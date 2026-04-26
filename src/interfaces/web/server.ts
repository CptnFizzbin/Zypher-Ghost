import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { OllamaClient, createSession } from '../../llm/ollama.js';
import { ObsidianVault } from '../../vault/obsidian.js';
import { config } from '../../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface WsMessage {
  type: 'message' | 'reset' | 'ping';
  content?: string;
}

interface WsResponse {
  type: 'chunk' | 'done' | 'error' | 'system' | 'pong';
  content?: string;
}

export async function runWebServer(): Promise<void> {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const llm = new OllamaClient();

  let vault: ObsidianVault | null = null;
  if (config.vault.path) {
    try {
      vault = new ObsidianVault(config.vault.path);
      await vault.buildCache();
      console.log(`[Web] Vault loaded: ${vault.noteCount} notes`);
    } catch (err) {
      console.error(`[Web] Failed to load vault: ${(err as Error).message}`);
    }
  }

  // Serve static files from the public directory
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // Health / info endpoint
  app.get('/api/info', (_req, res) => {
    res.json({
      model: config.ollama.model,
      host: config.ollama.host,
      vault: config.vault.path
        ? { path: config.vault.path, notes: vault?.noteCount ?? 0 }
        : null,
    });
  });

  // WebSocket connections — one session per connection
  wss.on('connection', (ws: WebSocket) => {
    const session = createSession();

    const send = (data: WsResponse): void => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    };

    send({
      type: 'system',
      content: `Connected to Zypher Ghost | Model: ${config.ollama.model}`,
    });

    ws.on('message', async (raw) => {
      let parsed: WsMessage;
      try {
        parsed = JSON.parse(raw.toString()) as WsMessage;
      } catch {
        send({ type: 'error', content: 'Invalid JSON message.' });
        return;
      }

      if (parsed.type === 'ping') {
        send({ type: 'pong' });
        return;
      }

      if (parsed.type === 'reset') {
        session.reset();
        send({ type: 'system', content: 'Conversation history cleared.' });
        return;
      }

      if (parsed.type !== 'message' || !parsed.content?.trim()) {
        send({ type: 'error', content: 'Empty message.' });
        return;
      }

      const userMessage = parsed.content.trim();

      // Search vault for context
      let vaultContext: string | undefined;
      if (vault) {
        try {
          const results = await vault.search(userMessage);
          if (results.length > 0) {
            vaultContext = vault.buildContext(results);
            const noteNames = results.map((r) => r.note.title).join(', ');
            send({ type: 'system', content: `Vault context from: ${noteNames}` });
          }
        } catch (err) {
          console.error('[Web] Vault search error:', err);
        }
      }

      try {
        for await (const chunk of llm.chatStream(session, userMessage, vaultContext)) {
          send({ type: 'chunk', content: chunk });
        }
        send({ type: 'done' });
      } catch (err) {
        console.error('[Web] LLM error:', err);
        send({
          type: 'error',
          content: `Ollama error: ${(err as Error).message}. Is Ollama running at ${config.ollama.host}?`,
        });
      }
    });

    ws.on('error', (err) => {
      console.error('[Web] WebSocket error:', err);
    });
  });

  server.listen(config.web.port, config.web.host, () => {
    console.log(`[Web] Zypher Ghost running at http://${config.web.host}:${config.web.port}`);
  });
}
