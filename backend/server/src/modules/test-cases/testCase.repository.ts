import type { Env } from '../../config/env';
import type { TestCase } from './testCase.types';
import type { CreateTestCaseInput, UpdateTestCaseInput } from './testCase.validation';
import { buildSeedData } from './testCase.seed';
import { FileTestCaseRepository } from './testCase.file.repository';
import { MongoTestCaseRepository } from './testCase.mongo.repository';

export interface TestCaseRepository {
  /** 'mongodb' is durable. 'file' is a local dev store and NOT production persistence. */
  readonly kind: 'mongodb' | 'file';
  list(): Promise<TestCase[]>;
  get(id: string): Promise<TestCase | null>;
  create(input: CreateTestCaseInput): Promise<TestCase>;
  update(id: string, patch: UpdateTestCaseInput): Promise<TestCase | null>;
  duplicate(id: string): Promise<TestCase | null>;
  remove(id: string): Promise<boolean>;
}

export async function createTestCaseRepository(env: Env): Promise<TestCaseRepository> {
  const seed = env.SEED_DEMO_DATA === 'true' ? buildSeedData() : [];
  if (env.MONGODB_URI) {
    // If a URI is configured we do NOT silently fall back; a failure should be loud.
    return MongoTestCaseRepository.connect(env.MONGODB_URI, env.MONGODB_DB, seed);
  }
  console.warn('[storage] MONGODB_URI not set -> using local JSON file store (DEV ONLY).');
  const repo = new FileTestCaseRepository(env.DATA_FILE, seed);
  await repo.init();
  return repo;
}
