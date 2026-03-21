import { runEmbeddedAttempt } from './run/attempt.js';
import type { EmbeddedPiRunResult, RunEmbeddedPiAgentParams } from './types.js';

export async function runEmbeddedPiAgent(
  params: RunEmbeddedPiAgentParams,
): Promise<EmbeddedPiRunResult> {
  const attempt = await runEmbeddedAttempt(params);
  const text = attempt.assistantTexts.join('').trim();
  const normalizedError = normalizeError(attempt.errorMessage);
  if (!text) {
    console.warn('[pi-agent] empty response', {
      aborted: attempt.aborted,
      timedOut: attempt.timedOut,
      error: normalizedError || attempt.errorMessage || null,
      toolCount: attempt.toolMetas.length,
      usage: attempt.usage || null,
    });
  }

  return {
    text: text || (attempt.timedOut
      ? '请求超时，请稍后重试。'
      : normalizedError
        ? `请求失败：${normalizedError}`
        : attempt.aborted
          ? '请求已中断，请稍后再试。'
          : '无响应'),
    aborted: attempt.aborted,
    timedOut: attempt.timedOut,
    errorMessage: normalizedError,
    toolMetas: attempt.toolMetas,
    usage: attempt.usage,
  };
}

function normalizeError(value?: string): string | undefined {
  const message = (value || '').trim();
  if (!message) {
    return undefined;
  }

  const lowered = message.toLowerCase();
  if (lowered.includes('developer is not one of') || (lowered.includes('role') && lowered.includes('developer'))) {
    return '接口不支持 developer 角色，请改用兼容模式';
  }
  if (lowered.includes('api key') || lowered.includes('unauthorized')) {
    return 'API Key 无效或权限不足';
  }
  if (lowered.includes('model') && lowered.includes('not')) {
    return '模型不存在或当前账号无权限';
  }

  return message.slice(0, 180);
}
