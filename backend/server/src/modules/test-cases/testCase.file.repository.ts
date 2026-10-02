import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { TestCaseRepository } from './testCase.repository';
import { applyPatch, buildTestCase, duplicateTestCase, type TestCase } from './testCase.types';
import type { CreateTestCaseInput, UpdateTestCaseInput } from './testCase.validation';

/** Dev-only store: keeps data in memory and mirrors it to a JSON file. */
export class FileTestCaseRepository implements TestCaseRepository {
  readonly kind = 'file' as const;
  private items: TestCase[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly file: string, private readonly seed: TestCase[]) {}

  async init(): Promise<void> {
    try {
      this.items = JSON.parse(await fs.readFile(this.file, 'utf8')) as TestCase[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      this.items = [...this.seed];
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
    return structuredClone([...this.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  async get(id: string) {
    const found = this.items.find((t) => t.id === id);
    return found ? structuredClone(found) : null;
  }

  async create(input: CreateTestCaseInput) {
    const tc = buildTestCase(input);
    this.items.push(tc);
    await this.persist();
    return structuredClone(tc);
  }

  async update(id: string, patch: UpdateTestCaseInput) {
    const idx = this.items.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.items[idx] = applyPatch(this.items[idx], patch);
    await this.persist();
    return structuredClone(this.items[idx]);
  }

  async duplicate(id: string) {
    const src = this.items.find((t) => t.id === id);
    if (!src) return null;
    const copy = duplicateTestCase(src);
    this.items.push(copy);
    await this.persist();
    return structuredClone(copy);
  }

  async remove(id: string) {
    const before = this.items.length;
    this.items = this.items.filter((t) => t.id !== id);
    if (this.items.length === before) return false;
    await this.persist();
    return true;
  }
}
