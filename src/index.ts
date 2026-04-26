import 'dotenv/config';
import { config } from './config.js';

async function main(): Promise<void> {
  const iface = config.interface;

  console.log(`[Zypher Ghost] Starting interface: ${iface}`);

  if (iface === 'cli' || iface === 'all') {
    const { runCLI } = await import('./interfaces/cli.js');
    if (iface === 'all') {
      // Run CLI in background when running all interfaces
      runCLI().catch((err: unknown) => console.error('[CLI] Error:', err));
    } else {
      await runCLI();
      return;
    }
  }

  if (iface === 'discord' || iface === 'all') {
    const { runDiscordBot } = await import('./interfaces/discord/bot.js');
    runDiscordBot().catch((err: unknown) => console.error('[Discord] Error:', err));
  }

  if (iface === 'web' || iface === 'all') {
    const { runWebServer } = await import('./interfaces/web/server.js');
    await runWebServer();
  }
}

main().catch((err: unknown) => {
  console.error('[Zypher Ghost] Fatal error:', err);
  process.exit(1);
});
