import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default('qa_copilot'),
  DATA_FILE: z.string().default(path.resolve(process.cwd(), 'data/test-cases.json')),
  SEED_DEMO_DATA: z.enum(['true', 'false']).default('true'),
  AI_PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_API_KEY: z.string().optional(),
  URL_INSPECT_MAX_PAGES: z.coerce.number().int().min(1).max(10).default(3),
  URL_INSPECT_TIMEOUT_MS: z.coerce.number().int().min(3000).max(60000).default(15000),
});

// Treat empty strings (e.g. "MONGODB_URI=") as unset.
const raw = Object.fromEntries(
  Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''),
);

export const env = schema.parse(raw);
export type Env = z.infer<typeof schema>;
