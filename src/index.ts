// MindBuddy 入口文件
import { Fastify } from 'fastify';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from 'dotenv';
import { ChatAgent } from './agents/chat.js';
import { DataSources } from './data-sources/index.js';
import { LLMProvider } from './llm/index.js';

config();

const PORT = process.env.PORT || 3000;

class MindBuddy {
  private app: Fastify;
  private wsServer: WebSocketServer;
  private agent: ChatAgent;
  private dataSources: DataSources;
  private llm: LLMProvider;

  constructor() {
    this.app = Fastify({ logger: true });
    this.llm = new LLMProvider();
    this.dataSources = new DataSources();
    this.agent = new ChatAgent(this.llm, this.dataSources);
    this.wsServer = new WebSocketServer({ port: PORT });
  }

  async start() {
    await this.dataSources.init();
    this.setupWebSocket();
    this.setupRoutes();
    
    await this.app.listen({ port: PORT });
    console.log(`MindBuddy running at http://localhost:${PORT}`);
  }

  private setupWebSocket() {
    this.wsServer.on('connection', (ws) => {
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const context = await this.dataSources.getContext();
          const response = await this.agent.chat(message.text, context);
          ws.send(JSON.stringify({ type: 'response', text: response }));
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', message: String(e) }));
        }
      });
    });
  }

  private setupRoutes() {
    this.app.get('/health', async () => ({ status: 'ok' }));
    this.app.get('/context', async () => await this.dataSources.getContext());
  }
}

new MindBuddy().start();
