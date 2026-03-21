import { runEmbeddedAttempt } from './run/attempt.js';
import type { EmbeddedPiRunResult, RunEmbeddedPiAgentParams } from './types.js';

export async function runEmbeddedPiAgent(
  params: RunEmbeddedPiAgentParams,
): Promise<EmbeddedPiRunResult> {
  const attempt = await runEmbeddedAttempt(params);
  const text = attempt.assistantTexts.join('').trim();

  return {
    text: text || (attempt.aborted ? '请求已中断，请稍后再试。' : '无响应'),
    aborted: attempt.aborted,
    timedOut: attempt.timedOut,
    toolMetas: attempt.toolMetas,
    usage: attempt.usage,
  };
}
