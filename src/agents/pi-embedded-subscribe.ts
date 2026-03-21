import type { AgentSession } from '@mariozechner/pi-coding-agent';

export type SubscribeEmbeddedPiSessionParams = {
  session: AgentSession;
};

type UsageTotals = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
};

export function subscribeEmbeddedPiSession(params: SubscribeEmbeddedPiSessionParams) {
  const assistantTexts: string[] = [];
  const toolMetas: Array<{ toolName: string; meta?: string }> = [];
  const usage: UsageTotals = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0,
  };

  const unsubscribe = params.session.subscribe((event: any) => {
    if (event?.type === 'message_update' && event.assistantMessageEvent?.type === 'text_delta') {
      const delta = typeof event.assistantMessageEvent.delta === 'string'
        ? event.assistantMessageEvent.delta
        : '';
      if (delta) {
        assistantTexts.push(delta);
      }
      return;
    }

    if (event?.type === 'tool_execution_end') {
      const toolName = typeof event.toolName === 'string' ? event.toolName : 'tool';
      toolMetas.push({
        toolName,
        meta: event.result ? safeStringify(event.result) : undefined,
      });
      return;
    }

    if (event?.type === 'message_end') {
      const message = event.message;
      if (message?.role === 'assistant' && typeof message?.usage === 'object' && message.usage) {
        const usageValue = message.usage as Record<string, unknown>;
        usage.input += asPositiveNumber(usageValue.input_tokens ?? usageValue.input ?? 0);
        usage.output += asPositiveNumber(usageValue.output_tokens ?? usageValue.output ?? 0);
        usage.cacheRead += asPositiveNumber(usageValue.cache_read_input_tokens ?? usageValue.cacheRead ?? 0);
        usage.cacheWrite += asPositiveNumber(usageValue.cache_creation_input_tokens ?? usageValue.cacheWrite ?? 0);
        usage.total += asPositiveNumber(usageValue.total_tokens ?? usageValue.total ?? 0);
      }
    }
  });

  const getUsageTotals = () => {
    if (usage.input === 0 && usage.output === 0 && usage.cacheRead === 0 && usage.cacheWrite === 0 && usage.total === 0) {
      return undefined;
    }
    const computedTotal = usage.total || (usage.input + usage.output + usage.cacheRead + usage.cacheWrite);
    return {
      input: usage.input || undefined,
      output: usage.output || undefined,
      cacheRead: usage.cacheRead || undefined,
      cacheWrite: usage.cacheWrite || undefined,
      total: computedTotal || undefined,
    };
  };

  return {
    assistantTexts,
    toolMetas,
    unsubscribe,
    getUsageTotals,
  };
}

function asPositiveNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }
  return num;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
