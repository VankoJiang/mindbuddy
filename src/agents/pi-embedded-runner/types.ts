import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { Model } from '@mariozechner/pi-ai';
import type { AuthStorage, ModelRegistry } from '@mariozechner/pi-coding-agent';

export interface RunEmbeddedPiAgentParams {
  sessionId: string;
  sessionFile: string;
  workspaceDir: string;
  prompt: string;
  systemPrompt: string;
  model: Model<any>;
  authStorage: AuthStorage;
  modelRegistry: ModelRegistry;
  tools: AgentTool[];
  timeoutMs: number;
}

export interface EmbeddedRunAttemptResult {
  aborted: boolean;
  timedOut: boolean;
  errorMessage?: string;
  assistantTexts: string[];
  toolMetas: Array<{ toolName: string; meta?: string }>;
  usage?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}

export interface EmbeddedPiRunResult {
  text: string;
  aborted: boolean;
  timedOut: boolean;
  errorMessage?: string;
  toolMetas: Array<{ toolName: string; meta?: string }>;
  usage?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}
