// Chat Agent - 核心对话 Agent
import { LLMProvider } from '../llm/index.js';
import { DataSources } from '../data-sources/index.js';

export interface Context {
  notes: NoteSummary[];
  calendar: CalendarEvent[];
  screenTime: ScreenTimeData;
}

export interface NoteSummary {
  title: string;
  content: string;
  keywords: string[];
}

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

export interface ScreenTimeData {
  totalHours: number;
  isLateNight: boolean;
  topApps: { name: string; hours: number }[];
}

export class ChatAgent {
  private llm: LLMProvider;
  private dataSources: DataSources;
  private systemPrompt = `
你是 MindBuddy，一个了解用户的轻量化 AI 心理陪伴助手。
你会读取用户的笔记、日历和屏幕使用时间来更好地了解用户。
回复要简洁、温暖，适当关心用户。
`.trim();

  constructor(llm: LLMProvider, dataSources: DataSources) {
    this.llm = llm;
    this.dataSources = dataSources;
  }

  async chat(userMessage: string, context: Context): Promise<string> {
    // 构建上下文
    const contextPrompt = this.buildContextPrompt(context);
    
    // 调用 LLM
    const response = await this.llm.chat([
      { role: 'system', content: this.systemPrompt + '\n\n' + contextPrompt },
      { role: 'user', content: userMessage }
    ]);

    return response;
  }

  private buildContextPrompt(context: Context): string {
    let prompt = '\n\n## 用户上下文\n';
    
    // 笔记摘要
    if (context.notes.length > 0) {
      prompt += '\n### 最近笔记\n';
      context.notes.forEach(note => {
        prompt += `- ${note.title}: ${note.content.slice(0, 100)}...\n`;
        if (note.keywords.length > 0) {
          prompt += `  关键词: ${note.keywords.join(', ')}\n`;
        }
      });
    }

    // 日程
    if (context.calendar.length > 0) {
      prompt += '\n### 今日日程\n';
      const today = context.calendar.filter(e => {
        const today = new Date();
        const eventDate = new Date(e.start);
        return eventDate.toDateString() === today.toDateString();
      });
      if (today.length > 0) {
        today.forEach(e => {
          prompt += `- ${e.title} ${e.isAllDay ? '(全天)' : `${e.start.getHours()}:${e.start.getMinutes()}`}\n`;
        });
      } else {
        prompt += '- 今天没有日程\n';
      }
    }

    // 屏幕时间
    if (context.screenTime) {
      prompt += '\n### 屏幕使用\n';
      prompt += `- 今日使用: ${context.screenTime.totalHours.toFixed(1)}小时\n`;
      if (context.screenTime.isLateNight) {
        prompt += '- 提醒: 用户今天熬夜了\n';
      }
    }

    return prompt;
  }
}
