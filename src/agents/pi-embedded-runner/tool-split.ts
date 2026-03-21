import type { AgentTool } from '@mariozechner/pi-agent-core';
import { toToolDefinitions } from '../pi-tool-definition-adapter.js';

export function splitSdkTools(options: { tools: AgentTool[]; sandboxEnabled: boolean }): {
  builtInTools: AgentTool[];
  customTools: ReturnType<typeof toToolDefinitions>;
} {
  const { tools } = options;
  return {
    // Keep built-in list empty so all tools pass through one adapter path.
    builtInTools: [],
    customTools: toToolDefinitions(tools),
  };
}
