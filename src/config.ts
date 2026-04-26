import 'dotenv/config';

export interface AppConfig {
  ollama: {
    host: string;
    model: string;
  };
  discord: {
    token: string;
    clientId: string;
  };
  web: {
    port: number;
    host: string;
  };
  vault: {
    path: string | null;
  };
  interface: 'cli' | 'discord' | 'web' | 'all';
  historyLimit: number;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are Zypher Ghost, an AI assistant embedded in the shadows of the Sixth World. \
You are a knowledgeable street operative with expertise in Shadowrun lore, rules, and storytelling. \
You assist the team by recalling campaign notes, worldbuilding details, character backgrounds, and game mechanics. \
You speak in a grounded, tactical tone — like a seasoned fixer who's seen too many runs go sideways. \
When referencing information from the vault, always cite which note it came from. \
If you don't know something, say so — never make up lore or stats. Stay in character unless explicitly asked otherwise.`;

function getInterface(): AppConfig['interface'] {
  const iface = process.env.INTERFACE?.toLowerCase();
  if (iface === 'discord' || iface === 'web' || iface === 'all') return iface;
  return 'cli';
}

export const config: AppConfig = {
  ollama: {
    host: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL ?? 'llama3.2',
  },
  discord: {
    token: process.env.DISCORD_TOKEN ?? '',
    clientId: process.env.DISCORD_CLIENT_ID ?? '',
  },
  web: {
    port: parseInt(process.env.WEB_PORT ?? '3000', 10),
    host: process.env.WEB_HOST ?? 'localhost',
  },
  vault: {
    path: process.env.VAULT_PATH ?? null,
  },
  interface: getInterface(),
  historyLimit: parseInt(process.env.HISTORY_LIMIT ?? '20', 10),
  systemPrompt: process.env.SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT,
};
