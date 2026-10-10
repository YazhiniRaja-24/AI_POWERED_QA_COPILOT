import { asyncHandler, AppError, ok } from '../../utils/http';
import type { RunService } from './run.service';
import { executeRunRequestSchema } from './run.validation';

export function createRunController(service: RunService) {
  return {
    execute: asyncHandler(async (req, res) => {
      const input = executeRunRequestSchema.parse(req.body);
      res.status(201).json(ok(await service.execute(input)));
    }),
    list: asyncHandler(async (_req, res) => {
      res.json(ok(await service.list()));
    }),
    get: asyncHandler(async (req, res) => {
      const run = await service.get(req.params.id);
      if (!run) throw new AppError(404, 'NOT_FOUND', `Run "${req.params.id}" was not found`);
      res.json(ok(run));
    }),
  };
}
