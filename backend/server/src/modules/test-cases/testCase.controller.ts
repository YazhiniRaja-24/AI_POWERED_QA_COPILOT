import { asyncHandler, AppError, ok } from '../../utils/http';
import type { TestCaseRepository } from './testCase.repository';
import { createTestCaseSchema, updateTestCaseSchema } from './testCase.validation';

const notFound = (id: string) => new AppError(404, 'NOT_FOUND', `Test case "${id}" was not found`);

export function createTestCaseController(repo: TestCaseRepository) {
  return {
    list: asyncHandler(async (_req, res) => {
      res.json(ok(await repo.list()));
    }),
    get: asyncHandler(async (req, res) => {
      const tc = await repo.get(req.params.id);
      if (!tc) throw notFound(req.params.id);
      res.json(ok(tc));
    }),
    create: asyncHandler(async (req, res) => {
      const input = createTestCaseSchema.parse(req.body);
      res.status(201).json(ok(await repo.create(input)));
    }),
    update: asyncHandler(async (req, res) => {
      const patch = updateTestCaseSchema.parse(req.body);
      const tc = await repo.update(req.params.id, patch);
      if (!tc) throw notFound(req.params.id);
      res.json(ok(tc));
    }),
    duplicate: asyncHandler(async (req, res) => {
      const tc = await repo.duplicate(req.params.id);
      if (!tc) throw notFound(req.params.id);
      res.status(201).json(ok(tc));
    }),
    remove: asyncHandler(async (req, res) => {
      if (!(await repo.remove(req.params.id))) throw notFound(req.params.id);
      res.json(ok({ id: req.params.id, deleted: true }));
    }),
  };
}
