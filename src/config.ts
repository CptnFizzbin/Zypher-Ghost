import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { ZYPHER_GHOST_SYSTEM_PROMPT } from './prompts/system.js';

export const env = createEnv({
  server: {
    OLLAMA_HOST: z.string().url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3.2'),
    DISCORD_TOKEN: z.string().default(''),
    DISCORD_CLIENT_ID: z.string().default(''),
    WEB_PORT: z.coerce.number().int().positive().default(3000),
    WEB_HOST: z.string().default('localhost'),
    VAULT_PATH: z.string().optional(),
    INTERFACE: z.enum(['cli', 'discord', 'web', 'all']).default('cli'),
    HISTORY_LIMIT: z.coerce.number().int().positive().default(20),
    SYSTEM_PROMPT: z.string().default(ZYPHER_GHOST_SYSTEM_PROMPT),
  },
  runtimeEnv: process.env,
});

export interface AppConfig {
  ollama: { host: string; model: string };
  discord: { token: string; clientId: string };
  web: { port: number; host: string };
  vault: { path: string | null };
  interface: 'cli' | 'discord' | 'web' | 'all';
  historyLimit: number;
  systemPrompt: string;
}

export const config: AppConfig = {
  ollama: {
    host: env.OLLAMA_HOST,
    model: env.OLLAMA_MODEL,
  },
  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.DISCORD_CLIENT_ID,
  },
  web: {
    port: env.WEB_PORT,
    host: env.WEB_HOST,
  },
  vault: {
    path: env.VAULT_PATH ?? null,
  },
  interface: env.INTERFACE,
  historyLimit: env.HISTORY_LIMIT,
  systemPrompt: env.SYSTEM_PROMPT,
};

