import type { AgentTool, AgentToolResult, AgentToolUpdateCallback } from '@mariozechner/pi-agent-core';
import type { ToolDefinition } from '@mariozechner/pi-coding-agent';

type ToolExecuteArgs = Parameters<NonNullable<ToolDefinition['execute']>>;

function normalizeResult(toolName: string, result: unknown): AgentToolResult<unknown> {
  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>;
    if (Array.isArray(record.content)) {
      return result as AgentToolResult<unknown>;
    }
    const details = 'details' in record ? record.details : record;
    return {
      content: [{ type: 'text', text: JSON.stringify(details ?? { status: 'ok', tool: toolName }) }],
      details: details ?? { status: 'ok', tool: toolName },
    };
  }

  return {
    content: [{ type: 'text', text: String(result ?? '') }],
    details: result ?? { status: 'ok', tool: toolName },
  };
}

function getExecutionTuple(args: ToolExecuteArgs): {
  toolCallId: string;
  params: unknown;
  signal: AbortSignal | undefined;
  onUpdate: AgentToolUpdateCallback<unknown> | undefined;
} {
  const toolCallId = String(args[0]);
  const params = args[1];
  const a3 = args[2];
  const a4 = args[3];
  const a5 = args[4];

  const signal = isAbortSignal(a3) ? a3 : isAbortSignal(a5) ? a5 : undefined;
  const onUpdate = typeof a4 === 'function'
    ? (a4 as AgentToolUpdateCallback<unknown>)
    : typeof a3 === 'function'
      ? (a3 as AgentToolUpdateCallback<unknown>)
      : undefined;
  return { toolCallId, params, signal, onUpdate };
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return typeof value === 'object' && value !== null && 'aborted' in (value as Record<string, unknown>);
}

export function toToolDefinitions(tools: AgentTool[]): ToolDefinition[] {
  return tools.map((tool) => {
    const name = tool.name || 'tool';
    return {
      name,
      label: tool.label ?? name,
      description: tool.description ?? '',
      parameters: tool.parameters,
      execute: async (...args: ToolExecuteArgs): Promise<AgentToolResult<unknown>> => {
        const { toolCallId, params, signal, onUpdate } = getExecutionTuple(args);
        try {
          const raw = await tool.execute(toolCallId, params, signal, onUpdate);
          return normalizeResult(name, raw);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: 'text', text: JSON.stringify({ status: 'error', tool: name, error: message }) }],
            details: { status: 'error', tool: name, error: message },
          };
        }
      },
    };
  });
}
