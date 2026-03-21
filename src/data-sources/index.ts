// 数据源管理器 - 统一管理本地数据
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import matter from 'gray-matter';
import type { CalendarEvent, Context, NoteSummary, ScreenTimeData } from '../types/context.js';

export interface Config {
  notes: {
    enabled: boolean;
    paths: string[];
  };
  calendar: {
    enabled: boolean;
    calendars: string[];
    lookAheadDays: number;
    icsPaths: string[];
  };
  screenTime: {
    enabled: boolean;
  };
}

type CacheKey = 'notes' | 'calendar' | 'screenTime';

interface RawIcsEvent {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

interface ScreenTimeAppUsage {
  name: string;
  milliseconds: number;
}

interface ScreenTimeState {
  dayKey: string;
  lastSeenAtMs: number;
  lastAppId: string;
  lastAppName: string;
  apps: Record<string, ScreenTimeAppUsage>;
}

interface FrontAppInfo {
  bundleId: string;
  name: string;
}

export class DataSources {
  private config: Config;
  private noteRoots: string[];
  private screenTimeStatePath: string;
  private screenTimeSampler: NodeJS.Timeout | null = null;
  private warnedScreenTimeReadFailure = false;
  private cache: {
    notes?: NoteSummary[];
    calendar?: CalendarEvent[];
    screenTime?: ScreenTimeData;
  } = {};
  private cacheUpdatedAt: Record<CacheKey, number> = {
    notes: 0,
    calendar: 0,
    screenTime: 0,
  };
  private cacheTTL: Record<CacheKey, number> = {
    notes: 30_000,
    calendar: 60_000,
    screenTime: 30_000,
  };
  private warnedCalendarReadFailure = false;

  constructor() {
    this.config = this.loadConfig();
    this.noteRoots = this.config.notes.paths.map(item => this.resolveUserPath(item));
    this.screenTimeStatePath = path.join(process.env.HOME || '', '.mindbuddy', 'screentime-state.json');
  }

  private loadConfig(): Config {
    const configPath = path.join(process.env.HOME || '', '.mindbuddy', 'config.json');
    const defaultConfig: Config = {
      notes: {
        enabled: true,
        paths: ['~/Documents/mindbuddy-notes'],
      },
      calendar: {
        enabled: true,
        calendars: [],
        lookAheadDays: 7,
        icsPaths: [],
      },
      screenTime: {
        enabled: true,
      },
    };

    try {
      if (!fs.existsSync(configPath)) {
        return defaultConfig;
      }

      const data = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(data) as Partial<Config>;
      return {
        notes: { ...defaultConfig.notes, ...parsed.notes },
        calendar: { ...defaultConfig.calendar, ...parsed.calendar },
        screenTime: { ...defaultConfig.screenTime, ...parsed.screenTime },
      };
    } catch (error) {
      console.warn('Config load failed, using defaults', error);
      return defaultConfig;
    }
  }

  async init() {
    this.startScreenTimeSampler();
    await Promise.all([this.getNotes(), this.getScreenTime()]);
  }

  async getContext(): Promise<Context> {
    const [notes, calendar, screenTime] = await Promise.all([
      this.getNotes(),
      this.getCalendar(),
      this.getScreenTime(),
    ]);

    return { notes, calendar, screenTime };
  }

  async getNotes(): Promise<NoteSummary[]> {
    if (this.isCacheFresh('notes') && this.cache.notes) {
      return this.cache.notes;
    }

    if (!this.config.notes.enabled) {
      this.cache.notes = [];
      this.touchCache('notes');
      return this.cache.notes;
    }

    const noteCandidates: Array<{ note: NoteSummary; mtime: number }> = [];

    for (const root of this.noteRoots) {
      if (!fs.existsSync(root)) {
        continue;
      }

      const files = this.collectFiles(root, new Set(['.md', '.txt']), 3);
      for (const filePath of files) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = matter(raw);
          const stat = fs.statSync(filePath);
          noteCandidates.push({
            note: {
              title: path.basename(filePath).replace(/\.(md|txt)$/i, ''),
              content: parsed.content.slice(0, 800),
              keywords: this.extractKeywords(parsed.content),
            },
            mtime: stat.mtimeMs,
          });
        } catch (error) {
          console.warn(`Failed to read note: ${filePath}`, error);
        }
      }
    }

    this.cache.notes = noteCandidates
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 8)
      .map(item => item.note);
    this.touchCache('notes');
    return this.cache.notes;
  }

  async getCalendar(): Promise<CalendarEvent[]> {
    if (this.isCacheFresh('calendar') && this.cache.calendar) {
      return this.cache.calendar;
    }

    if (!this.config.calendar.enabled) {
      this.cache.calendar = [];
      this.touchCache('calendar');
      return this.cache.calendar;
    }

    const macEvents = this.readCalendarFromMacOS();
    const icsEvents = this.readCalendarFromIcs();
    const merged = this.sortAndDeduplicate([...macEvents, ...icsEvents]);

    this.cache.calendar = merged;
    this.touchCache('calendar');
    return this.cache.calendar;
  }

  async getScreenTime(): Promise<ScreenTimeData> {
    if (this.isCacheFresh('screenTime') && this.cache.screenTime) {
      return this.cache.screenTime;
    }

    if (!this.config.screenTime.enabled) {
      this.cache.screenTime = { totalHours: 0, isLateNight: false, topApps: [] };
      this.touchCache('screenTime');
      return this.cache.screenTime;
    }

    this.refreshScreenTimeState();

    const now = new Date();
    const state = this.readScreenTimeState(now);
    const appUsages = Object.values(state.apps)
      .filter(item => item.milliseconds > 0)
      .sort((a, b) => b.milliseconds - a.milliseconds);
    const totalMilliseconds = appUsages.reduce((sum, item) => sum + item.milliseconds, 0);

    this.cache.screenTime = {
      totalHours: Number((totalMilliseconds / (60 * 60 * 1000)).toFixed(2)),
      isLateNight: now.getHours() < 6,
      topApps: appUsages.slice(0, 5).map(item => ({
        name: item.name,
        hours: Number((item.milliseconds / (60 * 60 * 1000)).toFixed(2)),
      })),
    };
    this.touchCache('screenTime');
    return this.cache.screenTime;
  }

  private startScreenTimeSampler() {
    if (!this.config.screenTime.enabled || process.platform !== 'darwin' || this.screenTimeSampler) {
      return;
    }

    const tick = () => {
      this.refreshScreenTimeState();
      this.cacheUpdatedAt.screenTime = 0;
    };

    tick();
    this.screenTimeSampler = setInterval(tick, 60_000);
    this.screenTimeSampler.unref();
  }

  private refreshScreenTimeState(reference = new Date()) {
    if (process.platform !== 'darwin') {
      return;
    }

    const currentApp = this.readFrontmostApp();
    if (!currentApp) {
      return;
    }

    const state = this.readScreenTimeState(reference);
    const nowMs = reference.getTime();

    if (state.lastSeenAtMs > 0 && state.lastAppId) {
      const elapsed = nowMs - state.lastSeenAtMs;
      if (elapsed > 0) {
        const boundedElapsed = Math.min(elapsed, 5 * 60 * 1000);
        const previous = state.apps[state.lastAppId] || {
          name: state.lastAppName || state.lastAppId,
          milliseconds: 0,
        };
        previous.milliseconds += boundedElapsed;
        state.apps[state.lastAppId] = previous;
      }
    }

    state.lastSeenAtMs = nowMs;
    state.lastAppId = currentApp.bundleId;
    state.lastAppName = currentApp.name;
    if (!state.apps[currentApp.bundleId]) {
      state.apps[currentApp.bundleId] = {
        name: currentApp.name,
        milliseconds: 0,
      };
    } else {
      state.apps[currentApp.bundleId].name = currentApp.name;
    }

    this.writeScreenTimeState(state);
  }

  private readFrontmostApp(): FrontAppInfo | null {
    if (process.platform !== 'darwin') {
      return null;
    }

    try {
      const frontRaw = execFileSync('lsappinfo', ['front'], {
        encoding: 'utf-8',
        timeout: 500,
      }).trim();
      const asn = frontRaw.split(/\s+/)[0];
      if (!asn) {
        return null;
      }

      const infoRaw = execFileSync('lsappinfo', ['info', '-only', 'bundleid,name', asn], {
        encoding: 'utf-8',
        timeout: 500,
      });

      const bundleMatch = infoRaw.match(/"CFBundleIdentifier"="([^"]+)"/);
      const nameMatch = infoRaw.match(/"LSDisplayName"="([^"]+)"/);
      if (!bundleMatch?.[1]) {
        return null;
      }

      return {
        bundleId: bundleMatch[1],
        name: nameMatch?.[1] || bundleMatch[1],
      };
    } catch (error) {
      if (!this.warnedScreenTimeReadFailure) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to read frontmost app for screen time (${reason})`);
        this.warnedScreenTimeReadFailure = true;
      }
      return null;
    }
  }

  private readScreenTimeState(reference = new Date()): ScreenTimeState {
    const dayKey = this.formatDayKey(reference);
    const emptyState: ScreenTimeState = {
      dayKey,
      lastSeenAtMs: 0,
      lastAppId: '',
      lastAppName: '',
      apps: {},
    };

    try {
      if (!fs.existsSync(this.screenTimeStatePath)) {
        return emptyState;
      }

      const raw = fs.readFileSync(this.screenTimeStatePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ScreenTimeState>;
      if (!parsed || parsed.dayKey !== dayKey) {
        return emptyState;
      }

      const apps: Record<string, ScreenTimeAppUsage> = {};
      const parsedApps = parsed.apps || {};
      for (const [bundleId, value] of Object.entries(parsedApps)) {
        if (!value || typeof value !== 'object') {
          continue;
        }
        const app = value as Partial<ScreenTimeAppUsage>;
        const name = String(app.name || bundleId);
        const milliseconds = Number(app.milliseconds || 0);
        apps[bundleId] = {
          name,
          milliseconds: Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 0,
        };
      }

      return {
        dayKey,
        lastSeenAtMs: Number(parsed.lastSeenAtMs || 0),
        lastAppId: String(parsed.lastAppId || ''),
        lastAppName: String(parsed.lastAppName || ''),
        apps,
      };
    } catch {
      return emptyState;
    }
  }

  private writeScreenTimeState(state: ScreenTimeState) {
    const dir = path.dirname(this.screenTimeStatePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.screenTimeStatePath, JSON.stringify(state), 'utf-8');
  }

  private formatDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private readCalendarFromMacOS(): CalendarEvent[] {
    if (process.platform !== 'darwin') {
      return [];
    }

    const lookAheadDays = Math.max(1, this.config.calendar.lookAheadDays);
    const script = [
      'set outputRows to ""',
      'tell application "Calendar"',
      '  set rangeStart to current date',
      `  set rangeEnd to rangeStart + (${lookAheadDays} * days)`,
      '  repeat with cal in calendars',
      '    set calendarName to name of cal',
      '    repeat with ev in (every event of cal whose start date ≥ rangeStart and start date ≤ rangeEnd)',
      '      set row to calendarName & tab & summary of ev & tab & (start date of ev as «class isot») & tab & (end date of ev as «class isot») & tab & ((allday event of ev) as string)',
      '      set outputRows to outputRows & row & linefeed',
      '    end repeat',
      '  end repeat',
      'end tell',
      'return outputRows',
    ].join('\n');

    try {
      const raw = execFileSync('osascript', ['-'], {
        input: script,
        encoding: 'utf-8',
        timeout: 500,
      });
      return this.parseAppleCalendarRows(raw);
    } catch (error) {
      if (!this.warnedCalendarReadFailure) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to read macOS Calendar (${reason})`);
        this.warnedCalendarReadFailure = true;
      }
      return [];
    }
  }

  private parseAppleCalendarRows(raw: string): CalendarEvent[] {
    const allowedCalendars = new Set(this.config.calendar.calendars);
    const events: CalendarEvent[] = [];

    for (const row of raw.split(/\r?\n/)) {
      if (!row.trim()) {
        continue;
      }

      const [calendarName, title, startText, endText, allDayText] = row.split('\t');
      if (!calendarName || !title || !startText || !endText) {
        continue;
      }
      if (allowedCalendars.size > 0 && !allowedCalendars.has(calendarName)) {
        continue;
      }

      const start = this.parseCalendarDate(startText);
      const end = this.parseCalendarDate(endText);
      if (!start || !end) {
        continue;
      }

      events.push({
        title,
        start,
        end,
        isAllDay: /true/i.test(allDayText || ''),
        calendar: calendarName,
      });
    }

    return events;
  }

  private readCalendarFromIcs(): CalendarEvent[] {
    const configuredPaths = this.config.calendar.icsPaths.map(item => this.resolveUserPath(item));
    if (configuredPaths.length === 0) {
      return [];
    }

    const icsFiles: string[] = [];
    for (const configuredPath of configuredPaths) {
      if (!fs.existsSync(configuredPath)) {
        continue;
      }
      const stat = fs.statSync(configuredPath);
      if (stat.isFile() && configuredPath.toLowerCase().endsWith('.ics')) {
        icsFiles.push(configuredPath);
      } else if (stat.isDirectory()) {
        icsFiles.push(...this.collectFiles(configuredPath, new Set(['.ics']), 2));
      }
    }

    const allowedCalendars = new Set(this.config.calendar.calendars);
    const result: CalendarEvent[] = [];
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dayStart.getTime() + this.config.calendar.lookAheadDays * 24 * 60 * 60 * 1000);

    for (const filePath of icsFiles) {
      const calendarName = path.basename(filePath, '.ics');
      if (allowedCalendars.size > 0 && !allowedCalendars.has(calendarName)) {
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const events = this.parseIcsContent(content);
        for (const event of events) {
          if (event.start < dayStart || event.start > rangeEnd) {
            continue;
          }
          result.push({
            ...event,
            calendar: calendarName,
          });
        }
      } catch (error) {
        console.warn(`Failed to read ICS file: ${filePath}`, error);
      }
    }

    return result;
  }

  private parseIcsContent(content: string): RawIcsEvent[] {
    const unfolded = content.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);
    const events: RawIcsEvent[] = [];
    let current: Record<string, string> | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        current = {};
        continue;
      }
      if (line === 'END:VEVENT' && current) {
        const title = current.SUMMARY || 'Untitled Event';
        const startMeta = this.parseIcsDateWithMeta(current.DTSTART);
        const endMeta = this.parseIcsDateWithMeta(current.DTEND);
        if (startMeta) {
          events.push({
            title,
            start: startMeta.date,
            end: endMeta?.date || new Date(startMeta.date.getTime() + 60 * 60 * 1000),
            isAllDay: startMeta.isAllDay || Boolean(current['DTSTART;VALUE=DATE']),
          });
        }
        current = null;
        continue;
      }
      if (!current) {
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const rawKey = line.slice(0, colonIndex).toUpperCase();
      const value = line.slice(colonIndex + 1).trim();
      const baseKey = rawKey.split(';')[0];

      current[rawKey] = value;
      current[baseKey] = value;
    }

    return events;
  }

  private parseIcsDateWithMeta(value?: string): { date: Date; isAllDay: boolean } | null {
    if (!value) {
      return null;
    }

    const allDayPattern = /^(\d{4})(\d{2})(\d{2})$/;
    const localPattern = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/;
    const utcPattern = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

    const allDayMatch = value.match(allDayPattern);
    if (allDayMatch) {
      const [, year, month, day] = allDayMatch;
      return {
        date: new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0),
        isAllDay: true,
      };
    }

    const utcMatch = value.match(utcPattern);
    if (utcMatch) {
      const [, year, month, day, hour, minute, second] = utcMatch;
      return {
        date: new Date(
          Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second),
          ),
        ),
        isAllDay: false,
      };
    }

    const localMatch = value.match(localPattern);
    if (localMatch) {
      const [, year, month, day, hour, minute, second] = localMatch;
      return {
        date: new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
        ),
        isAllDay: false,
      };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return { date, isAllDay: false };
  }

  private parseCalendarDate(value: string): Date | null {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const normalized = value.replace(' ', 'T');
    const normalizedParsed = new Date(normalized);
    if (!Number.isNaN(normalizedParsed.getTime())) {
      return normalizedParsed;
    }

    const compact = this.parseIcsDateWithMeta(value);
    return compact?.date || null;
  }

  private sortAndDeduplicate(events: CalendarEvent[]): CalendarEvent[] {
    const seen = new Set<string>();
    return events
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .filter(event => {
        const key = `${event.calendar || ''}|${event.title}|${event.start.toISOString()}|${event.end.toISOString()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .slice(0, 24);
  }

  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^a-zA-Z\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word]) => word);
  }

  private resolveUserPath(value: string): string {
    return value.replace(/^~(?=$|\/)/, process.env.HOME || '');
  }

  private collectFiles(root: string, extensions: Set<string>, maxDepth: number): string[] {
    const files: string[] = [];
    const stack: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      const entries = fs.readdirSync(current.dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current.dir, entry.name);
        if (entry.isDirectory() && current.depth < maxDepth) {
          stack.push({ dir: fullPath, depth: current.depth + 1 });
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        if (extensions.has(path.extname(entry.name).toLowerCase())) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private isCacheFresh(key: CacheKey): boolean {
    const updatedAt = this.cacheUpdatedAt[key];
    return Date.now() - updatedAt < this.cacheTTL[key];
  }

  private touchCache(key: CacheKey) {
    this.cacheUpdatedAt[key] = Date.now();
  }
}
