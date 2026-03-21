import { Buffer } from 'node:buffer';
import fs from 'node:fs/promises';

type SessionManagerCacheEntry = {
  loadedAt: number;
};

const SESSION_MANAGER_CACHE = new Map<string, SessionManagerCacheEntry>();
const DEFAULT_SESSION_MANAGER_TTL_MS = 45_000;

function resolveTtl(): number {
  const raw = process.env.MINDBUDDY_SESSION_MANAGER_CACHE_TTL_MS;
  if (!raw) {
    return DEFAULT_SESSION_MANAGER_TTL_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SESSION_MANAGER_TTL_MS;
  }
  return parsed;
}

function isEnabled(): boolean {
  return resolveTtl() > 0;
}

export function trackSessionManagerAccess(sessionFile: string): void {
  if (!isEnabled()) {
    return;
  }
  SESSION_MANAGER_CACHE.set(sessionFile, { loadedAt: Date.now() });
}

function isSessionManagerCached(sessionFile: string): boolean {
  if (!isEnabled()) {
    return false;
  }
  const item = SESSION_MANAGER_CACHE.get(sessionFile);
  if (!item) {
    return false;
  }
  return Date.now() - item.loadedAt <= resolveTtl();
}

export async function prewarmSessionFile(sessionFile: string): Promise<void> {
  if (!isEnabled()) {
    return;
  }
  if (isSessionManagerCached(sessionFile)) {
    return;
  }

  try {
    const handle = await fs.open(sessionFile, 'r');
    try {
      const buffer = Buffer.alloc(4096);
      await handle.read(buffer, 0, buffer.length, 0);
    } finally {
      await handle.close();
    }
    trackSessionManagerAccess(sessionFile);
  } catch {
    // Session file may not exist yet.
  }
}
