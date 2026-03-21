import fs from 'node:fs';
import path from 'node:path';
import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { Model } from '@mariozechner/pi-ai';
import { AuthStorage, ModelRegistry, readOnlyTools } from '@mariozechner/pi-coding-agent';
import { runEmbeddedPiAgent } from '../agents/pi-embedded-runner.js';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  sessionId?: string;
  provider?: string;
  model?: string;
}

interface LLMConfig {
  provider: string;
  model: string;
  timeoutMs: number;
}

interface ProviderDefinition {
  id: string;
  name: string;
  apiKeyEnv: string;
  runtimeProvider: string;
  defaultBaseUrl: string;
  requiresBaseUrl: boolean;
  baseUrlEnv: string;
  compat?: {
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
    thinkingFormat?: 'openai' | 'zai' | 'qwen' | 'qwen-chat-template' | 'openrouter';
  };
}

interface ProviderOverride {
  apiKey?: string;
  baseUrl?: string;
}

interface RuntimeStore {
  provider?: string;
  model?: string;
  providers?: Record<string, ProviderOverride>;
}

export interface ProviderMeta {
  id: string;
  name: string;
  configured: boolean;
  apiKeyConfigured: boolean;
  baseUrlConfigured: boolean;
  baseUrl: string;
}

export interface RuntimeConfigInput {
  provider?: string;
  model?: string;
  providerSettings?: Record<string, { apiKey?: string; baseUrl?: string }>;
}

export interface RuntimeConfigPayload {
  defaults: {
    provider: string;
    model: string;
  };
  providers: ProviderMeta[];
}

export class LLMProvider {
  private config: LLMConfig;
  private authStorage: AuthStorage;
  private modelRegistry: ModelRegistry;
  private tools: AgentTool[];
  private initError: string | null = null;
  private providerModels = new Map<string, Set<string>>();
  private providers: Map<string, ProviderDefinition>;
  private runtimeStorePath: string;
  private runtimeStore: RuntimeStore = { providers: {} };

  constructor() {
    this.config = {
      provider: (process.env.LLM_PROVIDER || '').trim(),
      model: (process.env.LLM_MODEL || '').trim(),
      timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 45_000),
    };
    this.authStorage = AuthStorage.create();
    this.modelRegistry = new ModelRegistry(this.authStorage);
    this.tools = readOnlyTools as unknown as AgentTool[];
    this.runtimeStorePath = path.join(process.env.HOME || '', '.mindbuddy', 'runtime.json');
    this.loadRuntimeStore();
    this.providers = this.buildProviders();
    this.init();
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    if (this.initError) {
      return `⚠️ pi-agent 初始化失败：${this.initError}`;
    }

    const prompt = this.extractLatestUserMessage(messages);
    if (!prompt) {
      return '请输入要发送的内容。';
    }

    let model: Model<any>;
    try {
      model = this.resolveModel(options);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return `⚠️ ${reason}`;
    }

    const sessionId = sanitizeSessionId(options?.sessionId || 'web-default');
    const sessionFile = path.join(process.env.HOME || '', '.mindbuddy', 'sessions', `${sessionId}.jsonl`);
    const systemPrompt = this.buildSystemPrompt(messages);

    const result = await runEmbeddedPiAgent({
      sessionId,
      sessionFile,
      workspaceDir: process.cwd(),
      prompt,
      systemPrompt,
      model,
      authStorage: this.authStorage,
      modelRegistry: this.modelRegistry,
      tools: this.tools,
      timeoutMs: this.config.timeoutMs,
    });

    return result.text;
  }

  getProvider(): string {
    return this.config.provider;
  }

  getModel(): string {
    return this.config.model;
  }

  getProviders(): ProviderMeta[] {
    return Array.from(this.providers.values()).map(provider => {
      const apiKeyConfigured = Boolean(this.resolveApiKey(provider));
      const baseUrl = this.resolveBaseUrl(provider);
      const baseUrlConfigured = provider.requiresBaseUrl ? Boolean(baseUrl) : true;
      return {
        id: provider.id,
        name: provider.name,
        configured: apiKeyConfigured && baseUrlConfigured,
        apiKeyConfigured,
        baseUrlConfigured,
        baseUrl,
      };
    });
  }

  getRuntimeConfig(): RuntimeConfigPayload {
    return {
      defaults: {
        provider: this.config.provider,
        model: this.config.model,
      },
      providers: this.getProviders(),
    };
  }

  updateRuntimeConfig(input: RuntimeConfigInput): RuntimeConfigPayload {
    if (typeof input.provider === 'string') {
      this.config.provider = input.provider.trim();
    }
    if (typeof input.model === 'string') {
      this.config.model = input.model.trim();
    }

    const storeProviders = this.runtimeStore.providers || {};
    const updates = input.providerSettings || {};
    for (const [providerId, update] of Object.entries(updates)) {
      if (!this.providers.has(providerId)) {
        continue;
      }
      const current = storeProviders[providerId] || {};

      if (typeof update.baseUrl === 'string') {
        current.baseUrl = update.baseUrl.trim();
      }
      if (typeof update.apiKey === 'string') {
        current.apiKey = update.apiKey.trim();
      }

      if (!current.baseUrl && !current.apiKey) {
        delete storeProviders[providerId];
      } else {
        storeProviders[providerId] = current;
      }
    }

    this.runtimeStore.provider = this.config.provider;
    this.runtimeStore.model = this.config.model;
    this.runtimeStore.providers = storeProviders;
    this.saveRuntimeStore();
    this.applyRuntimeKeys();
    return this.getRuntimeConfig();
  }

  private init() {
    try {
      this.applyRuntimeKeys();
      this.initError = null;
    } catch (error) {
      this.initError = error instanceof Error ? error.message : String(error);
      console.error('❌ pi-agent init failed:', this.initError);
    }
  }

  private loadRuntimeStore() {
    try {
      if (!fs.existsSync(this.runtimeStorePath)) {
        this.runtimeStore = { providers: {} };
        return;
      }

      const raw = fs.readFileSync(this.runtimeStorePath, 'utf-8');
      const parsed = JSON.parse(raw) as RuntimeStore;
      this.runtimeStore = {
        provider: typeof parsed.provider === 'string' ? parsed.provider.trim() : '',
        model: typeof parsed.model === 'string' ? parsed.model.trim() : '',
        providers: parsed.providers || {},
      };

      if (this.runtimeStore.provider) {
        this.config.provider = this.runtimeStore.provider;
      }
      if (this.runtimeStore.model) {
        this.config.model = this.runtimeStore.model;
      }
    } catch {
      this.runtimeStore = { providers: {} };
    }
  }

  private saveRuntimeStore() {
    const dir = path.dirname(this.runtimeStorePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.runtimeStorePath, JSON.stringify(this.runtimeStore, null, 2), 'utf-8');
  }

  private applyRuntimeKeys() {
    const configuredProviders = new Set<string>();

    for (const provider of this.providers.values()) {
      const apiKey = this.resolveApiKey(provider);
      if (!apiKey || configuredProviders.has(provider.runtimeProvider)) {
        continue;
      }
      this.authStorage.setRuntimeApiKey(provider.runtimeProvider, apiKey);
      configuredProviders.add(provider.runtimeProvider);
    }

    if (configuredProviders.size === 0) {
      console.warn('⚠️ No LLM API key configured');
    }
  }

  private resolveModel(options?: ChatOptions): Model<any> {
    const providerId = (options?.provider || this.config.provider).trim();
    const modelId = (options?.model || this.config.model).trim();

    if (!providerId) {
      throw new Error('请先选择厂商（provider）');
    }
    if (!modelId) {
      throw new Error('请先选择模型（model）');
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`不支持的厂商: ${providerId}`);
    }

    const apiKey = this.resolveApiKey(provider);
    if (!apiKey) {
      throw new Error(`缺少 ${provider.apiKeyEnv}，无法调用 ${providerId}`);
    }

    const baseUrl = this.resolveBaseUrl(provider);
    if (provider.requiresBaseUrl && !baseUrl) {
      throw new Error(`缺少 ${provider.baseUrlEnv}`);
    }

    this.registerProviderModel(provider, modelId, baseUrl);
    const model = this.modelRegistry.find(provider.id, modelId);
    if (!model) {
      throw new Error(`模型不可用: ${provider.id}/${modelId}`);
    }
    return model;
  }

  private registerProviderModel(provider: ProviderDefinition, modelId: string, baseUrl: string) {
    const modelSet = this.providerModels.get(provider.id) || new Set<string>();
    modelSet.add(modelId);
    this.providerModels.set(provider.id, modelSet);

    this.modelRegistry.registerProvider(provider.id, {
      baseUrl,
      apiKey: provider.apiKeyEnv,
      api: 'openai-completions',
      models: Array.from(modelSet).map(id => ({
        id,
        name: id,
        reasoning: true,
        input: ['text'],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 131072,
        maxTokens: 8192,
        ...(provider.compat ? { compat: provider.compat } : {}),
      })),
    });
  }

  private resolveApiKey(provider: ProviderDefinition): string {
    const override = this.runtimeStore.providers?.[provider.id]?.apiKey || '';
    if (override.trim()) {
      return override.trim();
    }
    return (process.env[provider.apiKeyEnv] || '').trim();
  }

  private resolveBaseUrl(provider: ProviderDefinition): string {
    const override = this.runtimeStore.providers?.[provider.id]?.baseUrl || '';
    if (override.trim()) {
      return override.trim();
    }
    const envBase = (process.env[provider.baseUrlEnv] || '').trim();
    if (envBase) {
      return envBase;
    }
    return provider.defaultBaseUrl;
  }

  private buildProviders(): Map<string, ProviderDefinition> {
    const providers: ProviderDefinition[] = [
      {
        id: 'qwen',
        name: 'Qwen',
        apiKeyEnv: 'QWEN_API_KEY',
        runtimeProvider: 'qwen',
        defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        requiresBaseUrl: true,
        baseUrlEnv: 'QWEN_BASE_URL',
        compat: {
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
          thinkingFormat: 'qwen',
        },
      },
      {
        id: 'zhipu',
        name: 'Zhipu',
        apiKeyEnv: 'ZHIPU_API_KEY',
        runtimeProvider: 'zhipu',
        defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        requiresBaseUrl: true,
        baseUrlEnv: 'ZHIPU_BASE_URL',
        compat: {
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
        },
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        runtimeProvider: 'deepseek',
        defaultBaseUrl: 'https://api.deepseek.com/v1',
        requiresBaseUrl: true,
        baseUrlEnv: 'DEEPSEEK_BASE_URL',
      },
      {
        id: 'openai',
        name: 'OpenAI',
        apiKeyEnv: 'OPENAI_API_KEY',
        runtimeProvider: 'openai',
        defaultBaseUrl: 'https://api.openai.com/v1',
        requiresBaseUrl: true,
        baseUrlEnv: 'OPENAI_BASE_URL',
      },
      {
        id: 'openai-compat',
        name: 'OpenAI Compatible',
        apiKeyEnv: 'OPENAI_API_KEY',
        runtimeProvider: 'openai',
        defaultBaseUrl: '',
        requiresBaseUrl: true,
        baseUrlEnv: 'OPENAI_BASE_URL',
        compat: {
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
        },
      },
    ];

    return new Map(providers.map(provider => [provider.id, provider]));
  }

  private buildSystemPrompt(messages: Message[]): string {
    const customSystem = messages
      .filter(message => message.role === 'system')
      .map(message => message.content.trim())
      .filter(Boolean)
      .join('\n\n');

    const base = `
You are MindBuddy, a local-first companion AI.
Focus on emotional support, concise language, and practical next steps.
Do not fabricate user context.
`.trim();

    return customSystem ? `${base}\n\n${customSystem}` : base;
  }

  private extractLatestUserMessage(messages: Message[]): string {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === 'user') {
        return message.content.trim();
      }
    }
    return '';
  }
}

function sanitizeSessionId(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return safe || 'web-default';
}
