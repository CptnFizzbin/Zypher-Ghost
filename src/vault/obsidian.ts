import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface VaultNote {
  /** Relative path within the vault */
  relativePath: string;
  /** Full absolute path on disk */
  absolutePath: string;
  /** Raw markdown content */
  content: string;
  /** Filename without extension */
  title: string;
}

export interface SearchResult {
  note: VaultNote;
  /** Matched excerpt(s) */
  excerpts: string[];
  /** Simple relevance score (higher = more matches) */
  score: number;
}

export class ObsidianVault {
  private readonly vaultPath: string;
  private noteCache: Map<string, VaultNote> = new Map();
  private cacheBuilt = false;

  constructor(vaultPath: string) {
    if (!existsSync(vaultPath)) {
      throw new Error(`Vault path does not exist: ${vaultPath}`);
    }
    this.vaultPath = path.resolve(vaultPath);
  }

  /** Load (or reload) all markdown notes into the in-memory cache. */
  async buildCache(): Promise<void> {
    this.noteCache.clear();

    const files = await glob('**/*.md', {
      cwd: this.vaultPath,
      absolute: false,
      ignore: ['**/.obsidian/**', '**/.trash/**'],
    });

    await Promise.all(
      files.map(async (relPath) => {
        const absPath = path.join(this.vaultPath, relPath);
        try {
          const content = await readFile(absPath, 'utf-8');
          const note: VaultNote = {
            relativePath: relPath,
            absolutePath: absPath,
            content,
            title: path.basename(relPath, '.md'),
          };
          this.noteCache.set(relPath, note);
        } catch {
          // Skip unreadable files
        }
      }),
    );

    this.cacheBuilt = true;
  }

  /** Return the total number of notes in the vault. */
  get noteCount(): number {
    return this.noteCache.size;
  }

  /** Ensure the cache has been built at least once. */
  private async ensureCache(): Promise<void> {
    if (!this.cacheBuilt) {
      await this.buildCache();
    }
  }

  /**
   * Full-text keyword search across all notes.
   * Returns results sorted by relevance (number of keyword occurrences).
   */
  async search(query: string, maxResults = 5): Promise<SearchResult[]> {
    await this.ensureCache();

    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 2);

    if (keywords.length === 0) return [];

    const results: SearchResult[] = [];

    for (const note of this.noteCache.values()) {
      const lowerContent = note.content.toLowerCase();
      let score = 0;
      const excerpts: string[] = [];

      for (const keyword of keywords) {
        let idx = lowerContent.indexOf(keyword);
        while (idx !== -1) {
          score++;
          // Extract a 200-char excerpt around the match
          const start = Math.max(0, idx - 80);
          const end = Math.min(note.content.length, idx + keyword.length + 120);
          const excerpt = `...${note.content.slice(start, end).trim()}...`;
          if (!excerpts.includes(excerpt)) {
            excerpts.push(excerpt);
          }
          // Limit excerpts per note to avoid overwhelming context
          if (excerpts.length >= 3) break;
          idx = lowerContent.indexOf(keyword, idx + 1);
        }
      }

      if (score > 0) {
        results.push({ note, excerpts, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Get a note by its title (case-insensitive, partial match).
   */
  async getNoteByTitle(title: string): Promise<VaultNote | null> {
    await this.ensureCache();
    const lower = title.toLowerCase();
    for (const note of this.noteCache.values()) {
      if (note.title.toLowerCase().includes(lower)) {
        return note;
      }
    }
    return null;
  }

  /**
   * Build a compact context string from search results for injection into the LLM prompt.
   */
  buildContext(results: SearchResult[]): string {
    if (results.length === 0) return '';

    return results
      .map((r) => {
        const header = `### Note: ${r.note.title} (${r.note.relativePath})`;
        const body = r.excerpts.join('\n');
        return `${header}\n${body}`;
      })
      .join('\n\n');
  }
}
