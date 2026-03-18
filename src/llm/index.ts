// LLM 提供商 - 支持多个国内提供商
import OpenAI from 'openai';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMProvider {
  private client: OpenAI | null = null;
  private provider: string;

  constructor() {
    this.provider = process.env.LLM_PROVIDER || 'qwen';
    this.initClient();
  }

  private initClient() {
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('No LLM API key configured');
      return;
    }

    this.client = new OpenAI({
      baseURL,
      apiKey,
    });
  }

  async chat(messages: Message[]): Promise<string> {
    if (!this.client) {
      return '抱歉，LLM 未配置。请在 .env 文件中配置 API Key。';
    }

    const model = this.getModel();
    
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages as any,
      });
      
      return response.choices[0]?.message?.content || '无响应';
    } catch (error) {
      console.error('LLM Error:', error);
      return '抱歉，我现在有点问题，请稍后再试。';
    }
  }

  private getModel(): string {
    switch (this.provider) {
      case 'qwen':
        return 'qwen-plus';
      case 'zhipu':
        return 'glm-4';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        return 'gpt-3.5-turbo';
    }
  }
}
