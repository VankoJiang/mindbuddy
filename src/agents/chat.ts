// Chat Agent - PI 架构 (Perception -> Integration -> Response)
import { LLMProvider } from '../llm/index.js';
import type { SoulSource } from '../soul/index.js';
import type { CalendarEvent, Context, NoteSummary } from '../types/context.js';

interface PerceptionSnapshot {
  notes: string[];
  schedule: string[];
  signals: string[];
}

export class ChatAgent {
  private llm: LLMProvider;
  private soul: SoulSource;

  constructor(llm: LLMProvider, soul: SoulSource) {
    this.llm = llm;
    this.soul = soul;
  }

  async chat(
    userMessage: string,
    context: Context,
    sessionId?: string,
    provider?: string,
    model?: string,
  ): Promise<string> {
    // P: Perception - 从原始上下文提取可用信号
    const perception = this.perceive(context);
    // I: Integration - 将信号组装为高密度上下文
    const contextPrompt = this.integrate(perception);
    // R: Response - 与用户消息融合后生成回复
    return this.respond(userMessage, contextPrompt, sessionId, provider, model);
  }

  private perceive(context: Context): PerceptionSnapshot {
    return {
      notes: this.perceiveNotes(context.notes),
      schedule: this.perceiveSchedule(context.calendar),
      signals: this.perceiveSignals(context),
    };
  }

  private integrate(snapshot: PerceptionSnapshot): string {
    const sections: string[] = ['## 用户上下文（PI）'];

    sections.push('\n### 备忘录洞察');
    sections.push(snapshot.notes.length > 0 ? snapshot.notes.map(item => `- ${item}`).join('\n') : '- 暂无备忘录信息');

    sections.push('\n### 近期日程');
    sections.push(snapshot.schedule.length > 0 ? snapshot.schedule.map(item => `- ${item}`).join('\n') : '- 暂无近期日程');

    sections.push('\n### 状态信号');
    sections.push(snapshot.signals.length > 0 ? snapshot.signals.map(item => `- ${item}`).join('\n') : '- 暂无可用状态信号');

    return sections.join('\n');
  }

  private async respond(
    userMessage: string,
    contextPrompt: string,
    sessionId?: string,
    provider?: string,
    model?: string,
  ): Promise<string> {
    const soulPrompt = this.soul.getPrompt();
    return this.llm.chat([
      { role: 'system', content: `${soulPrompt}\n\n${contextPrompt}` },
      { role: 'user', content: userMessage },
    ], { sessionId, provider, model });
  }

  private perceiveNotes(notes: NoteSummary[]): string[] {
    return notes.slice(0, 5).map(note => {
      const summary = note.content.slice(0, 100).replace(/\s+/g, ' ').trim();
      const keywords = note.keywords.length > 0 ? `关键词: ${note.keywords.join('、')}` : '无关键词';
      return `${note.title} | ${summary}${summary.length >= 100 ? '...' : ''} | ${keywords}`;
    });
  }

  private perceiveSchedule(events: CalendarEvent[]): string[] {
    return events.slice(0, 8).map(event => this.formatEvent(event));
  }

  private perceiveSignals(context: Context): string[] {
    const signals: string[] = [];
    const now = new Date();

    const todayEvents = context.calendar.filter(event => {
      const start = new Date(event.start);
      return start.toDateString() === now.toDateString();
    });

    if (todayEvents.length > 0) {
      signals.push(`今天有 ${todayEvents.length} 个安排`);
    } else {
      signals.push('今天日程较空，可以安排恢复性活动');
    }

    if (context.screenTime.isLateNight) {
      signals.push('近期可能存在熬夜，建议提醒休息节奏');
    }
    signals.push(`最近屏幕使用约 ${context.screenTime.totalHours.toFixed(1)} 小时`);

    return signals;
  }

  private formatEvent(event: CalendarEvent): string {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const day = `${start.getMonth() + 1}/${start.getDate()}`;

    if (event.isAllDay) {
      return `${day} 全天 | ${event.title}${event.calendar ? ` (${event.calendar})` : ''}`;
    }

    const startTime = this.formatTime(start);
    const endTime = this.formatTime(end);
    return `${day} ${startTime}-${endTime} | ${event.title}${event.calendar ? ` (${event.calendar})` : ''}`;
  }

  private formatTime(date: Date): string {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  }
}
