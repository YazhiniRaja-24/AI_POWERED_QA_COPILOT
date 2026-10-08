import { Router } from 'express';
import { asyncHandler, ok } from '../../utils/http';
import type { AiService } from './ai.service';
import { analyzeRequestSchema, generateRequestSchema } from './ai.schemas';

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
    asyncHandler(async (req, res) => {
      const input = analyzeRequestSchema.parse(req.body);
      res.json(ok(await ai.analyze(input)));
    }),
  );
  return router;
}
