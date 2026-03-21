import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
} from '@mariozechner/pi-coding-agent';
import { prewarmSessionFile, trackSessionManagerAccess } from '../session-manager-cache.js';
import { splitSdkTools } from '../tool-split.js';
import type { EmbeddedRunAttemptResult, RunEmbeddedPiAgentParams } from '../types.js';
import { subscribeEmbeddedPiSession } from '../../pi-embedded-subscribe.js';

type EmbeddedRunAttemptParams = RunEmbeddedPiAgentParams;

export async function runEmbeddedAttempt(
  params: EmbeddedRunAttemptParams,
): Promise<EmbeddedRunAttemptResult> {
  await fs.mkdir(path.dirname(params.sessionFile), { recursive: true });
  await prewarmSessionFile(params.sessionFile);

  const sessionManager = SessionManager.open(params.sessionFile);
  trackSessionManagerAccess(params.sessionFile);

  const resourceLoader = new DefaultResourceLoader({
    cwd: params.workspaceDir,
    systemPromptOverride: () => params.systemPrompt,
    appendSystemPromptOverride: () => [],
  });
  await resourceLoader.reload();

  const { builtInTools, customTools } = splitSdkTools({
    tools: params.tools,
    sandboxEnabled: false,
  });

  const { session } = await createAgentSession({
    cwd: params.workspaceDir,
    authStorage: params.authStorage,
    modelRegistry: params.modelRegistry,
    model: params.model,
    tools: builtInTools as any,
    customTools,
    sessionManager,
    resourceLoader,
  });

  const subscription = subscribeEmbeddedPiSession({ session });
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort('timeout'), Math.max(1, params.timeoutMs));

  let aborted = false;
  let timedOut = false;
  let errorMessage: string | undefined;
  let promptResult: unknown;
  try {
    if (timeoutController.signal.aborted) {
      throw new Error('aborted');
    }
    promptResult = await session.prompt(params.prompt, { expandPromptTemplates: false });
    if (subscription.assistantTexts.length === 0) {
      const fallbackText = extractTextFromPromptResult(promptResult);
      if (fallbackText) {
        subscription.assistantTexts.push(fallbackText);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    aborted = true;
    timedOut = timeoutController.signal.aborted || message.toLowerCase().includes('timeout');
    errorMessage = message;
  } finally {
    clearTimeout(timeout);
    subscription.unsubscribe();
    session.dispose();
  }

  return {
    aborted,
    timedOut,
    errorMessage: errorMessage || subscription.getFirstError(),
    assistantTexts: subscription.assistantTexts,
    toolMetas: subscription.toolMetas,
    usage: subscription.getUsageTotals(),
  };
}

function extractTextFromPromptResult(value: unknown, seen = new WeakSet<object>()): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value !== 'object') {
    return '';
  }

  if (seen.has(value as object)) {
    return '';
  }
  seen.add(value as object);

  const object = value as Record<string, unknown>;
  const directKeys = ['text', 'content', 'message', 'response'];
  for (const key of directKeys) {
    const candidate = object[key];
    const extracted = extractTextFromPromptResult(candidate, seen);
    if (extracted) {
      return extracted;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractTextFromPromptResult(item, seen);
      if (extracted) {
        return extracted;
      }
    }
  }

  return '';
}
