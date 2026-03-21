import fs from 'node:fs';
import path from 'node:path';

export interface SoulSource {
  getPrompt(): string;
  getPath(): string;
  setPrompt(content: string): void;
}

export class SoulProfile implements SoulSource {
  private soulPath: string;
  private cachedMtimeMs = 0;
  private cachedPrompt = '';

  constructor(rawPath = process.env.SOUL_PATH || 'soul.md') {
    this.soulPath = resolveUserPath(rawPath);
  }

  getPath(): string {
    return this.soulPath;
  }

  getPrompt(): string {
    if (!fs.existsSync(this.soulPath)) {
      throw new Error(`未找到 soul.md: ${this.soulPath}，请基于 soul.template.md 创建。`);
    }

    const stat = fs.statSync(this.soulPath);
    if (this.cachedPrompt && this.cachedMtimeMs === stat.mtimeMs) {
      return this.cachedPrompt;
    }

    const content = fs.readFileSync(this.soulPath, 'utf-8').trim();
    if (!content) {
      throw new Error(`soul.md 为空: ${this.soulPath}`);
    }

    this.cachedPrompt = content;
    this.cachedMtimeMs = stat.mtimeMs;
    return this.cachedPrompt;
  }

  setPrompt(content: string) {
    const next = content.trim();
    if (!next) {
      throw new Error('soul.md 内容不能为空');
    }

    const dir = path.dirname(this.soulPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.soulPath, `${next}\n`, 'utf-8');

    const stat = fs.statSync(this.soulPath);
    this.cachedPrompt = next;
    this.cachedMtimeMs = stat.mtimeMs;
  }
}

function resolveUserPath(input: string): string {
  if (input.startsWith('~/')) {
    return path.join(process.env.HOME || '', input.slice(2));
  }
  if (path.isAbsolute(input)) {
    return input;
  }
  return path.resolve(process.cwd(), input);
}
