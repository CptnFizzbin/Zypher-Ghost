import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { createSession } from '../../../llm/session.js';
import type { VaultService, ChatService } from '../services/chat.service.js';
import { config } from '../../../config.js';

interface WsMessage {
  type: 'message' | 'reset' | 'ping';
  content?: string;
}

interface WsResponse {
  type: 'chunk' | 'done' | 'error' | 'system' | 'pong';
  content?: string;
}

export function attachWsController(
  server: Server,
  chatService: ChatService,
  vaultService: VaultService,
): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

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
      if (vaultService.vault) {
        try {
          const results = await vaultService.vault.search(userMessage);
          if (results.length > 0) {
            vaultContext = vaultService.vault.buildContext(results);
            const noteNames = results.map((r) => r.note.title).join(', ');
            send({ type: 'system', content: `Vault context from: ${noteNames}` });
          }
        } catch (err) {
          console.error('[Web] Vault search error:', err);
        }
      }

      try {
        for await (const chunk of chatService.llm.chatStream(session, userMessage, vaultContext)) {
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
}
