import * as readline from 'readline';
import { OllamaClient, createSession } from '../llm/index.js';
import { ObsidianVault } from '../vault/obsidian.js';
import { config } from '../config.js';

const PROMPT_PREFIX = '\x1b[32mYou\x1b[0m › ';
const BOT_PREFIX = '\x1b[36mZypher Ghost\x1b[0m › ';
const SYSTEM_PREFIX = '\x1b[33m[System]\x1b[0m';

function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

export async function runCLI(): Promise<void> {
  console.log(`${SYSTEM_PREFIX} Zypher Ghost CLI — Shadowrun AI Assistant`);
  console.log(`${SYSTEM_PREFIX} Model: ${config.ollama.model}  |  Host: ${config.ollama.host}`);

  let vault: ObsidianVault | null = null;
  if (config.vault.path) {
    try {
      vault = new ObsidianVault(config.vault.path);
      await vault.buildCache();
      console.log(`${SYSTEM_PREFIX} Vault loaded: ${vault.noteCount} notes from ${config.vault.path}`);
    } catch (err) {
      console.error(`${SYSTEM_PREFIX} Failed to load vault: ${(err as Error).message}`);
    }
  } else {
    console.log(`${SYSTEM_PREFIX} No vault configured. Set VAULT_PATH in .env to enable note search.`);
  }

  const llm = new OllamaClient();
  const session = createSession();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  console.log(`${SYSTEM_PREFIX} Type your message and press Enter. Commands: /reset /quit /help\n`);

  const askQuestion = (): void => {
    rl.question(PROMPT_PREFIX, async (input) => {
      const message = input.trim();

      if (!message) {
        askQuestion();
        return;
      }

      // Built-in commands
      if (message === '/quit' || message === '/exit') {
        console.log(`\n${SYSTEM_PREFIX} Farewell, chummer. Stay in the shadows.`);
        rl.close();
        return;
      }

      if (message === '/reset') {
        session.reset();
        console.log(`${SYSTEM_PREFIX} Conversation history cleared.`);
        askQuestion();
        return;
      }

      if (message === '/help') {
        console.log(`\n${SYSTEM_PREFIX} Commands:`);
        console.log('  /reset  — Clear conversation history');
        console.log('  /vault  — Show vault info');
        console.log('  /quit   — Exit\n');
        askQuestion();
        return;
      }

      if (message === '/vault') {
        if (vault) {
          console.log(`${SYSTEM_PREFIX} Vault: ${config.vault.path} (${vault.noteCount} notes)`);
        } else {
          console.log(`${SYSTEM_PREFIX} No vault loaded. Set VAULT_PATH in .env.`);
        }
        askQuestion();
        return;
      }

      // Search the vault for relevant context
      let vaultContext: string | undefined;
      if (vault) {
        const results = await vault.search(message);
        if (results.length > 0) {
          vaultContext = vault.buildContext(results);
          const noteNames = results.map((r) => r.note.title).join(', ');
          console.log(`${SYSTEM_PREFIX} Vault context from: ${noteNames}`);
        }
      }

      // Stream the LLM response
      process.stdout.write(BOT_PREFIX);
      try {
        for await (const chunk of llm.chatStream(session, message, vaultContext)) {
          process.stdout.write(chunk);
        }
        process.stdout.write('\n\n');
      } catch (err) {
        clearLine();
        console.error(`\n${SYSTEM_PREFIX} Error: ${(err as Error).message}`);
        console.error(`${SYSTEM_PREFIX} Make sure Ollama is running at ${config.ollama.host}`);
      }

      askQuestion();
    });
  };

  rl.on('close', () => {
    process.exit(0);
  });

  askQuestion();
}
