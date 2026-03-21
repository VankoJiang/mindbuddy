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
  const debugEvents = process.env.DEBUG_PI_EVENTS === '1';
  const assistantTexts: string[] = [];
  const toolMetas: Array<{ toolName: string; meta?: string }> = [];
  const errorMessages: string[] = [];
  const usage: UsageTotals = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0,
  };

  const unsubscribe = params.session.subscribe((event: any) => {
    if (debugEvents) {
      const eventType = typeof event?.type === 'string' ? event.type : 'unknown';
      const assistantType = typeof event?.assistantMessageEvent?.type === 'string'
        ? event.assistantMessageEvent.type
        : '';
      console.log('[pi-event]', eventType, assistantType);
      if (eventType === 'message_end') {
        const role = event?.message?.role;
        const preview = safeStringify(event?.message).slice(0, 500);
        console.log('[pi-message-end]', role || 'unknown', preview);
      }
    }

    const eventError = extractErrorMessage(event);
    if (eventError) {
      errorMessages.push(eventError);
    }

    if (event?.type === 'message_update' && event.assistantMessageEvent?.type === 'text_delta') {
      const delta = typeof event.assistantMessageEvent.delta === 'string'
        ? event.assistantMessageEvent.delta
        : '';
      if (delta) {
        assistantTexts.push(delta);
      }
      return;
    }

    if (event?.type === 'message_update') {
      const messageEventText = extractText(event.assistantMessageEvent);
      if (messageEventText) {
        assistantTexts.push(messageEventText);
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
      if (message?.role === 'assistant') {
        const endedText = extractText(message);
        if (endedText) {
          assistantTexts.push(endedText);
        }
      }

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
    getFirstError: () => errorMessages[0],
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

function extractText(value: any): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.text === 'string') {
    return value.text;
  }

  if (typeof value.content === 'string') {
    return value.content;
  }

  if (Array.isArray(value.content)) {
    const chunks = value.content
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item?.text === 'string') {
          return item.text;
        }
        return '';
      })
      .filter(Boolean);
    return chunks.join('');
  }

  if (Array.isArray(value.parts)) {
    const chunks = value.parts
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item?.text === 'string') {
          return item.text;
        }
        return '';
      })
      .filter(Boolean);
    return chunks.join('');
  }

  return '';
}

function extractErrorMessage(event: any): string {
  if (!event) {
    return '';
  }

  const candidates = [
    event.error?.message,
    event.errorMessage,
    event.message?.errorMessage,
    event.message?.error?.message,
    event.assistantMessageEvent?.error?.message,
    event.assistantMessageEvent?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (typeof event.type === 'string' && event.type.toLowerCase().includes('error')) {
    const asText = safeStringify(event);
    return asText.slice(0, 240);
  }

  return '';
}
