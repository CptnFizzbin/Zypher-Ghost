import { describe, it, expect } from '@jest/globals';

// Mock dotenv to avoid needing a .env file in tests
process.env.OLLAMA_HOST = 'http://test-host:11434';
process.env.OLLAMA_MODEL = 'test-model';
process.env.WEB_PORT = '4000';
process.env.HISTORY_LIMIT = '10';

describe('config', () => {
  it('reads OLLAMA_HOST from environment', async () => {
    const { config } = await import('../src/config.js');
    expect(config.ollama.host).toBe('http://test-host:11434');
  });

  it('reads OLLAMA_MODEL from environment', async () => {
    const { config } = await import('../src/config.js');
    expect(config.ollama.model).toBe('test-model');
  });

  it('reads WEB_PORT as a number', async () => {
    const { config } = await import('../src/config.js');
    expect(config.web.port).toBe(4000);
    expect(typeof config.web.port).toBe('number');
  });

  it('reads HISTORY_LIMIT as a number', async () => {
    const { config } = await import('../src/config.js');
    expect(config.historyLimit).toBe(10);
  });

  it('defaults interface to cli when not set', async () => {
    const { config } = await import('../src/config.js');
    expect(config.interface).toBe('cli');
  });

  it('has a system prompt', async () => {
    const { config } = await import('../src/config.js');
    expect(typeof config.systemPrompt).toBe('string');
    expect(config.systemPrompt.length).toBeGreaterThan(0);
  });

  it('vault.path is null when VAULT_PATH not set', async () => {
    const { config } = await import('../src/config.js');
    expect(config.vault.path).toBeNull();
  });
});
