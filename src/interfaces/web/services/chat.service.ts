import { OllamaClient } from '../../../llm/client.js';
import { ObsidianVault } from '../../../vault/obsidian.js';
import { config } from '../../../config.js';

export interface VaultService {
  vault: ObsidianVault | null;
}

export interface ChatService {
  llm: OllamaClient;
}

export async function createVaultService(): Promise<VaultService> {
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
  return { vault };
}

export function createChatService(): ChatService {
  return { llm: new OllamaClient() };
}
