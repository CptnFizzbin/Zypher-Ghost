import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { createVaultService, createChatService } from './services/chat.service.js';
import { infoController } from './controllers/info.controller.js';
import { attachWsController } from './controllers/ws.controller.js';
import { config } from '../../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export async function runWebServer(): Promise<void> {
  const app = express();
  const server = http.createServer(app);

  const [vaultService, chatService] = await Promise.all([
    createVaultService(),
    Promise.resolve(createChatService()),
  ]);

  // Serve compiled React frontend from the public directory
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // REST endpoints
  app.get('/api/info', apiLimiter, infoController(vaultService));

  // Serve the SPA index for any unmatched routes (client-side routing)
  app.get('*path', apiLimiter, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // WebSocket controller
  attachWsController(server, chatService, vaultService);

  server.listen(config.web.port, config.web.host, () => {
    console.log(`[Web] Zypher Ghost running at http://${config.web.host}:${config.web.port}`);
  });
}

