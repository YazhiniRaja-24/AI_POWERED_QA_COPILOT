import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RunRepository } from './run.repository';
import type { Run } from './run.types';

/** Keeps the most recent runs so the dev JSON file cannot grow without bound. */
const MAX_STORED_RUNS = 50;

/** Dev-only store: keeps data in memory and mirrors it to a JSON file. */
export class FileRunRepository implements RunRepository {
  readonly kind = 'file' as const;
  private items: Run[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly file: string) {}

  async init(): Promise<void> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8')) as Run[];
      this.items = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      this.items = [];
      await this.persist();
    }
  }

  private persist(): Promise<void> {
    const write = async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.items, null, 2), 'utf8');
      await fs.rename(tmp, this.file);
    };
    const next = this.queue.catch(() => undefined).then(write);
    this.queue = next;
    return next;
  }

  async list() {
    return structuredClone([...this.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async get(id: string) {
    const found = this.items.find((r) => r.id === id);
    return found ? structuredClone(found) : null;
  }

  async create(run: Run) {
    this.items = [run, ...this.items].slice(0, MAX_STORED_RUNS);
    await this.persist();
    return structuredClone(run);
  }
}
