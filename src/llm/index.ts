// LLM 提供商 - 支持多个国内提供商
import OpenAI from 'openai';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMConfig {
  provider: string;
  apiKey?: string;
  baseURL?: string;
  secretKey?: string;
}

export class LLMProvider {
  private client: OpenAI | null = null;
  private config: LLMConfig;
  private model: string;

  constructor() {
    this.config = {
      provider: process.env.LLM_PROVIDER || 'qwen',
      apiKey: process.env.OPENAI_API_KEY 
        || process.env.QWEN_API_KEY 
        || process.env.ZHIPU_API_KEY 
        || process.env.DEEPSEEK_API_KEY
        || process.env.QIANFAN_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      secretKey: process.env.QIANFAN_SECRET_KEY
    };
    
    this.model = this.getModel();
    this.initClient();
  }

  private initClient() {
    if (!this.config.apiKey) {
      console.warn('⚠️ No LLM API key configured');
      return;
    }

    let baseURL = this.config.baseURL;
    
    // 根据提供商设置默认 baseURL
    if (!baseURL) {
      switch (this.config.provider) {
        case 'qwen':
          baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
          break;
        case 'zhipu':
          baseURL = 'https://open.bigmodel.cn/api/paas/v4';
          break;
        case 'deepseek':
          baseURL = 'https://api.deepseek.com/v1';
          break;
        case 'qianfan':
          baseURL = 'https://qianfan.baidubce.com/v2';
          break;
        default:
          baseURL = 'https://api.openai.com/v1';
      }
    }

    this.client = new OpenAI({
      baseURL,
      apiKey: this.config.apiKey,
    });
  }

  private getModel(): string {
    switch (this.config.provider) {
      case 'qwen':
        return 'qwen-plus';
      case 'qwen-long':
        return 'qwen-long';
      case 'zhipu':
        return 'glm-4';
      case 'zhipu-flash':
        return 'glm-4-flash';
      case 'deepseek':
        return 'deepseek-chat';
      case 'qianfan':
        return 'ernie-4.0-8k';
      case 'qianfan-speed':
        return 'ernie-speed-8k';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  async chat(messages: Message[]): Promise<string> {
    if (!this.client) {
      return '⚠️ LLM 未配置。请在 .env 文件中配置 API Key。';
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
      });
      
      return response.choices[0]?.message?.content || '无响应';
    } catch (error: any) {
      console.error('❌ LLM Error:', error.message);
      return '抱歉，我现在有点问题，请稍后再试。';
    }
  }

  getProvider(): string {
    return this.config.provider;
  }
}
