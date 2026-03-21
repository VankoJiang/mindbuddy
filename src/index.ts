// MindBuddy 入口文件
import Fastify from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from 'dotenv';
import { ChatAgent } from './agents/chat.js';
import { DataSources } from './data-sources/index.js';
import { LLMProvider } from './llm/index.js';
import { SoulProfile } from './soul/index.js';
import { renderAppHtml } from './web/app.js';

config();

const PORT = Number(process.env.PORT || 3000);
const WS_ENABLED = process.env.WS_ENABLED === '1';
const WS_PORT = Number(process.env.WS_PORT || 3001);

interface ChatBody {
  text?: string;
  sessionId?: string;
  provider?: string;
  model?: string;
}

interface RuntimeConfigBody {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

interface SoulBody {
  content?: string;
}

class MindBuddy {
  private app: ReturnType<typeof Fastify>;
  private wsServer: WebSocketServer | null;
  private agent: ChatAgent;
  private dataSources: DataSources;
  private llm: LLMProvider;
  private soul: SoulProfile;

  constructor() {
    this.app = Fastify({ logger: true });
    this.llm = new LLMProvider();
    this.soul = new SoulProfile();
    this.dataSources = new DataSources();
    this.agent = new ChatAgent(this.llm, this.soul);
    this.wsServer = WS_ENABLED ? new WebSocketServer({ port: WS_PORT }) : null;
  }

  async start() {
    await this.dataSources.init();
    if (this.wsServer) {
      this.setupWebSocket();
    }
    this.setupRoutes();

    await this.app.listen({ port: PORT });
    console.log(`MindBuddy running at http://localhost:${PORT}`);
  }

  private setupWebSocket() {
    if (!this.wsServer) {
      return;
    }

    this.wsServer.on('connection', (ws: WebSocket) => {
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as ChatBody;
          const text = (message.text || '').trim();

          if (!text) {
            ws.send(JSON.stringify({ type: 'error', message: 'text is required' }));
            return;
          }

          const context = await this.dataSources.getContext();
          const response = await this.agent.chat(
            text,
            context,
            message.sessionId,
            message.provider,
            message.model,
          );
          ws.send(JSON.stringify({ type: 'response', text: response, context }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: String(error) }));
        }
      });
    });
  }

  private setupRoutes() {
    this.app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.type('text/html');
      return renderAppHtml();
    });

    this.app.get('/health', async () => ({
      status: 'ok',
      provider: this.llm.getProvider(),
      model: this.llm.getModel(),
      soulPath: this.soul.getPath(),
      wsEnabled: WS_ENABLED,
      now: new Date().toISOString(),
    }));

    this.app.get('/context', async () => this.dataSources.getContext());
    this.app.get('/api/context', async () => this.dataSources.getContext());
    this.app.get('/api/models', async () => this.llm.getRuntimeConfig());
    this.app.get('/api/runtime-config', async () => this.llm.getRuntimeConfig());
    this.app.put('/api/runtime-config', async (request: FastifyRequest<{ Body: RuntimeConfigBody }>) => {
      const provider = typeof request.body?.provider === 'string' ? request.body.provider.trim() : undefined;
      const model = typeof request.body?.model === 'string' ? request.body.model.trim() : undefined;
      const apiKey = typeof request.body?.apiKey === 'string' ? request.body.apiKey.trim() : undefined;
      const baseUrl = request.body?.baseUrl;

      const providerSettings = provider
        ? {
            [provider]: {
              ...(apiKey ? { apiKey } : {}),
              ...(typeof baseUrl === 'string' ? { baseUrl } : {}),
            },
          }
        : {};

      return this.llm.updateRuntimeConfig({
        ...(typeof provider === 'string' ? { provider } : {}),
        ...(typeof model === 'string' ? { model } : {}),
        providerSettings,
      });
    });
    this.app.get('/api/soul', async () => ({
      path: this.soul.getPath(),
      content: this.soul.getPrompt(),
    }));
    this.app.put('/api/soul', async (request: FastifyRequest<{ Body: SoulBody }>, reply: FastifyReply) => {
      const content = request.body?.content || '';
      if (!content.trim()) {
        reply.code(400);
        return { error: 'content is required' };
      }
      this.soul.setPrompt(content);
      return {
        path: this.soul.getPath(),
        content: this.soul.getPrompt(),
      };
    });

    this.app.post('/api/chat', async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
      const text = (request.body?.text || '').trim();
      if (!text) {
        reply.code(400);
        return { error: 'text is required' };
      }

      try {
        const context = await this.dataSources.getContext();
        const response = await this.agent.chat(
          text,
          context,
          request.body?.sessionId,
          request.body?.provider,
          request.body?.model,
        );
        return { text: response, context };
      } catch (error) {
        reply.code(500);
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }
}

new MindBuddy().start();
