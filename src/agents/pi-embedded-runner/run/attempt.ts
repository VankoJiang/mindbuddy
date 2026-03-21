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
  try {
    if (timeoutController.signal.aborted) {
      throw new Error('aborted');
    }
    await session.prompt(params.prompt, { expandPromptTemplates: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    aborted = true;
    timedOut = timeoutController.signal.aborted || message.toLowerCase().includes('timeout');
  } finally {
    clearTimeout(timeout);
    subscription.unsubscribe();
    session.dispose();
  }

  return {
    aborted,
    timedOut,
    assistantTexts: subscription.assistantTexts,
    toolMetas: subscription.toolMetas,
    usage: subscription.getUsageTotals(),
  };
}
