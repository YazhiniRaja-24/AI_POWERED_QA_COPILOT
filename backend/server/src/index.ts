import { createApp } from './app';
import { env } from './config/env';
import { createAiProvider } from './modules/ai/ai.provider';
import { AiService } from './modules/ai/ai.service';
import { createExecutor, executorConfig } from './modules/runs/executor';
import { createRunRepository } from './modules/runs/run.repository';
import { RunService } from './modules/runs/run.service';
import { createTestCaseRepository } from './modules/test-cases/testCase.repository';

async function main() {
  const repo = await createTestCaseRepository(env);
  const runRepo = await createRunRepository(env);
  const ai = new AiService(createAiProvider(env));
  const executor = createExecutor(executorConfig(env));
  const runs = new RunService(runRepo, repo, executor);
  createApp(repo, ai, runs).listen(env.PORT, () => {
    console.log(`QA Copilot API on http://localhost:${env.PORT}  (storage=${repo.kind}, ai=${ai.providerName})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
