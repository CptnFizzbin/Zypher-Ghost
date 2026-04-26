import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import { ObsidianVault } from '../src/vault/obsidian.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), 'vault-test-'));

  // Create some sample Shadowrun vault notes
  await writeFile(
    path.join(tmpDir, 'characters.md'),
    `# Characters\n\nShadow is a street samurai with wired reflexes. She runs with Nitro and the crew.\n`,
  );

  await writeFile(
    path.join(tmpDir, 'Seattle.md'),
    `# Seattle\n\nSeattle is a major metroplex in the Sixth World. The Ork Underground is here.\n`,
  );

  // Sub-folder note
  await mkdir(path.join(tmpDir, 'runs'));
  await writeFile(
    path.join(tmpDir, 'runs', 'run-01.md'),
    `# Run 01 - The Extraction\n\nThe team extracted a scientist from Aztechnology. The decker found key data.\n`,
  );
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('ObsidianVault', () => {
  it('throws if path does not exist', () => {
    expect(() => new ObsidianVault('/nonexistent/path/xyz')).toThrow();
  });

  it('builds cache and reports note count', async () => {
    const vault = new ObsidianVault(tmpDir);
    await vault.buildCache();
    expect(vault.noteCount).toBe(3);
  });

  it('finds notes by keyword search', async () => {
    const vault = new ObsidianVault(tmpDir);
    const results = await vault.search('street samurai');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].note.title).toBe('characters');
  });

  it('returns empty results for unmatched query', async () => {
    const vault = new ObsidianVault(tmpDir);
    const results = await vault.search('xyznonexistentterm');
    expect(results).toHaveLength(0);
  });

  it('finds notes in sub-folders', async () => {
    const vault = new ObsidianVault(tmpDir);
    const results = await vault.search('extraction aztechnology');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].note.title).toBe('run-01');
  });

  it('finds note by title (partial match)', async () => {
    const vault = new ObsidianVault(tmpDir);
    const note = await vault.getNoteByTitle('Seattle');
    expect(note).not.toBeNull();
    expect(note?.title).toBe('Seattle');
  });

  it('returns null for non-existent title', async () => {
    const vault = new ObsidianVault(tmpDir);
    const note = await vault.getNoteByTitle('NonExistentNoteXYZ');
    expect(note).toBeNull();
  });

  it('sorts results by relevance score', async () => {
    const vault = new ObsidianVault(tmpDir);
    // "samurai" appears in characters.md, not other notes
    const results = await vault.search('samurai');
    if (results.length > 1) {
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    }
  });

  it('builds context string from results', async () => {
    const vault = new ObsidianVault(tmpDir);
    const results = await vault.search('seattle');
    const context = vault.buildContext(results);
    expect(context).toContain('Seattle');
    expect(context).toContain('metroplex');
  });

  it('rebuilds cache when called again', async () => {
    const vault = new ObsidianVault(tmpDir);
    await vault.buildCache();
    const first = vault.noteCount;
    // Add a new note and rebuild
    await writeFile(path.join(tmpDir, 'new-note.md'), '# New Note\nContent here');
    await vault.buildCache();
    expect(vault.noteCount).toBe(first + 1);
  });
});
