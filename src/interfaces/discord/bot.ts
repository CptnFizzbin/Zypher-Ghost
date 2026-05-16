import {
  Client,
  GatewayIntentBits,
  Events,
  type Message,
  ActivityType,
  ChannelType,
} from 'discord.js';
import { OllamaClient, createSession } from '../../llm/index.js';
import { ObsidianVault } from '../../vault/obsidian.js';
import { config } from '../../config.js';

/** Map of channel/user ID → session for per-channel conversation history */
const sessions = new Map<string, ReturnType<typeof createSession>>();

function getSession(id: string): ReturnType<typeof createSession> {
  if (!sessions.has(id)) {
    sessions.set(id, createSession());
  }
  return sessions.get(id)!;
}

export async function runDiscordBot(): Promise<void> {
  if (!config.discord.token) {
    throw new Error('DISCORD_TOKEN is not set in environment. Cannot start Discord bot.');
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  const llm = new OllamaClient();

  let vault: ObsidianVault | null = null;
  if (config.vault.path) {
    try {
      vault = new ObsidianVault(config.vault.path);
      await vault.buildCache();
      console.log(`[Discord] Vault loaded: ${vault.noteCount} notes`);
    } catch (err) {
      console.error(`[Discord] Failed to load vault: ${(err as Error).message}`);
    }
  }

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[Discord] Logged in as ${readyClient.user.tag}`);
    readyClient.user.setActivity('the shadows', { type: ActivityType.Watching });
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const isDM = message.channel.type === ChannelType.DM;
    const isMentioned = message.mentions.has(client.user!);

    // In guilds, only respond when mentioned; in DMs always respond
    if (!isDM && !isMentioned) return;

    // Strip the bot mention from the message content
    const userMessage = message.content
      .replace(/<@!?\d+>/g, '')
      .trim();

    if (!userMessage) {
      await message.reply('Chummer, you pinged but said nothing. What do you need?');
      return;
    }

    // Built-in commands
    if (userMessage.toLowerCase() === '/reset') {
      const sessionId = isDM ? message.author.id : message.channelId;
      sessions.delete(sessionId);
      await message.reply('Conversation history cleared. Fresh start, chummer.');
      return;
    }

    if (userMessage.toLowerCase() === '/vault') {
      if (vault) {
        await message.reply(`Vault online: **${config.vault.path}** — ${vault.noteCount} notes loaded.`);
      } else {
        await message.reply('No vault connected. Set `VAULT_PATH` in the bot config to enable note search.');
      }
      return;
    }

    const sessionId = isDM ? message.author.id : message.channelId;
    const session = getSession(sessionId);

    // Show typing indicator
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Search vault for context
    let vaultContext: string | undefined;
    if (vault) {
      const results = await vault.search(userMessage);
      if (results.length > 0) {
        vaultContext = vault.buildContext(results);
      }
    }

    try {
      const reply = await llm.chat(session, userMessage, vaultContext);

      // Discord has a 2000-char message limit — split if needed
      if (reply.length <= 2000) {
        await message.reply(reply);
      } else {
        const chunks = splitMessage(reply, 2000);
        await message.reply(chunks[0]);
        for (const chunk of chunks.slice(1)) {
          if ('send' in message.channel) {
            await message.channel.send(chunk);
          }
        }
      }
    } catch (err) {
      console.error('[Discord] LLM error:', err);
      await message.reply(
        `Sorry chummer, the data feed went dark. Make sure Ollama is running at \`${config.ollama.host}\`.`,
      );
    }
  });

  await client.login(config.discord.token);
}

function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    // Try to split at a paragraph or sentence boundary
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt < maxLength / 2) splitAt = maxLength;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}
