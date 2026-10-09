import { Router } from 'express';
import { env } from '../../config/env';
import { asyncHandler, ok } from '../../utils/http';
import type { AiService } from './ai.service';
import {
  analyzeFailureRequestSchema,
  analyzeUrlRequestSchema,
  generateRequestSchema,
} from './ai.schemas';
import { inspectWebsite, inspectorConfig } from './website-inspector';

const inspectionConfig = inspectorConfig(env);

export function createAiRouter(ai: AiService) {
  const router = Router();
  router.post(
    '/test-cases/generate',
    asyncHandler(async (req, res) => {
      const input = generateRequestSchema.parse(req.body);
      res.json(ok(await ai.generate(input)));
    }),
  );
  router.post(
    '/failures/analyze',
    asyncHandler(async (req) => {
      analyzeFailureRequestSchema.parse(req.body);
    }),
  );
  router.post(
    '/analyze-url',
    asyncHandler(async (req, res) => {
      const body = analyzeUrlRequestSchema.parse(req.body);
      const analysis = await inspectWebsite(body.url, inspectionConfig);
      res.json(ok({ analysis, provider: 'playwright' }));
    }),
  );
  return router;
}
