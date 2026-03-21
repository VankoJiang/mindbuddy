import { describe, expect, it, vi } from 'vitest';
import { ChatAgent } from './chat.js';
import type { Context } from '../types/context.js';
import type { LLMProvider } from '../llm/index.js';
import type { SoulSource } from '../soul/index.js';

describe('ChatAgent', () => {
  it('builds PI context before calling llm', async () => {
    const llmChat = vi.fn().mockResolvedValue('ok');
    const llm = { chat: llmChat } as unknown as LLMProvider;
    const soul = {
      getPrompt: () => '你是 MindBuddy 测试人格。',
      getPath: () => '/tmp/soul.md',
    } as SoulSource;
    const agent = new ChatAgent(llm, soul);

    const context: Context = {
      notes: [
        {
          title: '今日备忘',
          content: '下午要准备周会资料，晚上要跑步半小时。',
          keywords: ['周会', '跑步'],
        },
      ],
      calendar: [
        {
          title: '产品评审',
          start: new Date('2026-03-21T14:00:00+08:00'),
          end: new Date('2026-03-21T15:00:00+08:00'),
          isAllDay: false,
          calendar: '工作',
        },
      ],
      screenTime: {
        totalHours: 6.5,
        isLateNight: false,
        topApps: [
          { name: 'VS Code', hours: 2.1 },
          { name: 'Chrome', hours: 1.7 },
        ],
      },
    };

    const reply = await agent.chat('今天有点焦虑', context);

    expect(reply).toBe('ok');
    expect(llmChat).toHaveBeenCalledTimes(1);

    const messages = llmChat.mock.calls[0][0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('MindBuddy 测试人格');
    expect(messages[0].content).toContain('用户上下文（PI）');
    expect(messages[0].content).toContain('备忘录洞察');
    expect(messages[0].content).toContain('近期日程');
    expect(messages[0].content).toContain('产品评审');
    expect(messages[0].content).toContain('最近屏幕使用约');
    expect(messages[1].content).toBe('今天有点焦虑');
  });
});
