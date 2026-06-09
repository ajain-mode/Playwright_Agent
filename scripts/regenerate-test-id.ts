#!/usr/bin/env npx ts-node
/**
 * Regenerate a single testcase from sample-testcases.csv by Case ID.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/regenerate-test-id.ts BT-67847 [--no-llm]
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { TestCaseParser } from '../src/agent/parsers/TestCaseParser';
import { PlaywrightAgent } from '../src/agent/PlaywrightAgent';

async function main(): Promise<void> {
  const testId = process.argv[2];
  const noLlm = process.argv.includes('--no-llm');
  if (!testId) {
    console.error('Usage: regenerate-test-id.ts <Case-ID> [--no-llm]');
    process.exit(1);
  }

  const csvPath = path.resolve(__dirname, '../src/agent/examples/sample-testcases.csv');
  const parser = new TestCaseParser();
  const rows = parser.parseFromCsvFile(csvPath);
  const normalized = testId.replace(/^BT-?/i, '');
  const testCase = rows.find((r) => {
    const id = r.id.replace(/^BT-?/i, '');
    return r.id === testId || id === normalized || r.id.endsWith(normalized);
  });

  if (!testCase) {
    console.error(`Case ID ${testId} not found in ${csvPath}`);
    process.exit(1);
  }

  console.log(`Regenerating ${testCase.id} (${testCase.steps.length} steps, ${testCase.expectedResults.length} expected block(s))`);

  const agent = new PlaywrightAgent({ llmEnabled: !noLlm });
  const result = await agent.generateFromTestCase(testCase);
  if (!result.success) {
    console.error(result.errors?.join('\n'));
    process.exit(1);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
