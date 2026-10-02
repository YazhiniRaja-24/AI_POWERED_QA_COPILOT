import { MongoClient, type Collection } from 'mongodb';
import type { TestCaseRepository } from './testCase.repository';
import { applyPatch, buildTestCase, duplicateTestCase, type TestCase } from './testCase.types';
import type { CreateTestCaseInput, UpdateTestCaseInput } from './testCase.validation';

const NO_ID = { projection: { _id: 0 } } as const;

export class MongoTestCaseRepository implements TestCaseRepository {
  readonly kind = 'mongodb' as const;

  private constructor(private readonly col: Collection<TestCase>) {}

  static async connect(uri: string, dbName: string, seed: TestCase[]) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const col = client.db(dbName).collection<TestCase>('testCases');
    await col.createIndex({ id: 1 }, { unique: true });
    if (seed.length > 0 && (await col.countDocuments()) === 0) {
      await col.insertMany(seed.map((s) => ({ ...s })));
    }
    console.log(`[storage] Connected to MongoDB database "${dbName}"`);
    return new MongoTestCaseRepository(col);
  }

  async list() {
    return (await this.col.find({}, NO_ID).sort({ updatedAt: -1 }).toArray()) as unknown as TestCase[];
  }

  async get(id: string) {
    return (await this.col.findOne({ id }, NO_ID)) as unknown as TestCase | null;
  }

  async create(input: CreateTestCaseInput) {
    const tc = buildTestCase(input);
    await this.col.insertOne({ ...tc });
    return tc;
  }

  async update(id: string, patch: UpdateTestCaseInput) {
    const existing = await this.get(id);
    if (!existing) return null;
    const next = applyPatch(existing, patch);
    await this.col.updateOne({ id }, { $set: next });
    return next;
  }

  async duplicate(id: string) {
    const src = await this.get(id);
    if (!src) return null;
    const copy = duplicateTestCase(src);
    await this.col.insertOne({ ...copy });
    return copy;
  }

  async remove(id: string) {
    const res = await this.col.deleteOne({ id });
    return res.deletedCount > 0;
  }
}
