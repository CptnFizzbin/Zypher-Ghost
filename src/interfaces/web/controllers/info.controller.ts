import type { Request, Response } from 'express';
import type { VaultService } from '../services/chat.service.js';
import { config } from '../../../config.js';

export function infoController(vaultService: VaultService) {
  return (_req: Request, res: Response): void => {
    res.json({
      model: config.ollama.model,
      host: config.ollama.host,
      vault: config.vault.path
        ? { path: config.vault.path, notes: vaultService.vault?.noteCount ?? 0 }
        : null,
    });
  };
}
