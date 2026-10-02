import { Router } from 'express';
import type { TestCaseRepository } from './testCase.repository';
import { createTestCaseController } from './testCase.controller';

export function createTestCaseRouter(repo: TestCaseRepository) {
  const c = createTestCaseController(repo);
  const router = Router();
  router.get('/', c.list);
  router.post('/', c.create);
  router.get('/:id', c.get);
  router.put('/:id', c.update);
  router.post('/:id/duplicate', c.duplicate);
  router.delete('/:id', c.remove);
  return router;
}
