// 数据源管理器 - 统一管理本地数据
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import { NoteSummary, CalendarEvent, ScreenTimeData } from '../agents/chat.js';

export interface Config {
  notes: {
    enabled: boolean;
    paths: string[];
  };
  calendar: {
    enabled: boolean;
    calendars: string[];
  };
  screenTime: {
    enabled: boolean;
  };
}

export class DataSources {
  private config: Config;
  private notesPath: string[];
  private cache: {
    notes?: NoteSummary[];
    calendar?: CalendarEvent[];
    screenTime?: ScreenTimeData;
  } = {};

  constructor() {
    this.config = this.loadConfig();
    this.notesPath = this.config.notes.paths.map(p => 
      p.replace('~', process.env.HOME || '')
    );
  }

  private loadConfig(): Config {
    const configPath = path.join(process.env.HOME || '', '.mindbuddy', 'config.json');
    
    const defaultConfig: Config = {
      notes: {
        enabled: true,
        paths: ['~/Documents/mindbuddy-notes']
      },
      calendar: {
        enabled: true,
        calendars: []
      },
      screenTime: {
        enabled: true
      }
    };

    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Config load failed, using defaults');
    }

    return defaultConfig;
  }

  async init() {
    // 预加载数据
    await this.getNotes();
    await this.getCalendar();
    await this.getScreenTime();
  }

  async getContext() {
    return {
      notes: await this.getNotes(),
      calendar: await this.getCalendar(),
      screenTime: await this.getScreenTime()
    };
  }

  async getNotes(): Promise<NoteSummary[]> {
    if (this.cache.notes) return this.cache.notes;

    const notes: NoteSummary[] = [];

    for (const notePath of this.notesPath) {
      if (!fs.existsSync(notePath)) continue;

      const files = fs.readdirSync(notePath);
      
      for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.txt')) continue;
        
        const filePath = path.join(notePath, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = matter(content);
          
          notes.push({
            title: file.replace(/\.(md|txt)$/, ''),
            content: parsed.content.slice(0, 500),
            keywords: this.extractKeywords(parsed.content)
          });
        } catch (e) {
          console.warn(`Failed to read note: ${filePath}`);
        }
      }
    }

    // 限制返回最近 5 条
    this.cache.notes = notes.slice(-5);
    return this.cache.notes;
  }

  private extractKeywords(content: string): string[] {
    // 简单的关键词提取
    const words = content.toLowerCase()
      .replace(/[^a-zA-Z\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    // 统计词频
    const freq: Record<string, number> = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    
    // 返回前 5 个高频词
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }

  async getCalendar(): Promise<CalendarEvent[]> {
    if (this.cache.calendar) return this.cache.calendar;
    
    // TODO: 实现 macOS 日历读取
    // 暂时返回空数组
    this.cache.calendar = [];
    return this.cache.calendar;
  }

  async getScreenTime(): Promise<ScreenTimeData> {
    if (this.cache.screenTime) return this.cache.screenTime;
    
    // TODO: 实现 macOS 屏幕使用时间读取
    // 暂时返回模拟数据
    this.cache.screenTime = {
      totalHours: 8,
      isLateNight: false,
      topApps: [
        { name: 'VS Code', hours: 3 },
        { name: 'Chrome', hours: 2 },
        { name: 'Terminal', hours: 1 }
      ]
    };
    return this.cache.screenTime;
  }
}
