import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createAiRouter } from './modules/ai/ai.routes';
import type { AiService } from './modules/ai/ai.service';
import type { TestCaseRepository } from './modules/test-cases/testCase.repository';
import { createTestCaseRouter } from './modules/test-cases/testCase.routes';
import { ok } from './utils/http';

export function createApp(repo: TestCaseRepository, ai: AiService) {
  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json(ok({
      status: 'ok',
      storage: repo.kind,
      durable: repo.kind === 'mongodb', // 'file' is a dev-only store
      aiProvider: ai.providerName,
    }));
  });
  app.use('/api/test-cases', createTestCaseRouter(repo));
  app.use('/api/ai', createAiRouter(ai));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
