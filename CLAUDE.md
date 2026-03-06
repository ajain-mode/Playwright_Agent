# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
npx playwright test

# Run a single test file
npx playwright test src/tests/generated/dfb/DFB-97746.spec.ts

# Run tests with Allure reporting
npm run test:allure

# Submit results to Testmo
npm run submit:testmo

# AI Agent modes
npm run agent:cli        # Interactive CLI
npm run agent:file       # Generate from file input
npm run agent:generate   # Generate code directly
npm run agent:preview    # Preview without writing files
npm run agent:analyze    # Analyze test cases only
npm run agent:batch      # Batch process multiple test cases
# --schema mode: npm run agent -- --schema  (lists available page objects/constants)
```

## Git Setup (required once per clone)

```bash
git config core.ignorecase false
git update-index --skip-worktree src/testmo/testmo-reporter.ts
```

## Architecture

This is an AI-powered Playwright test generation framework for SunTeck TMS (Transport Management System). It takes high-level test case descriptions and generates executable Playwright `.spec.ts` files.

### Generation Pipeline

```
Input (JSON / plain text / CSV / XLSX)
  → TestCaseParser       (src/agent/parsers/) — categorize + type-detect via keyword matching
  → SchemaAnalyzer       (src/agent/analyzers/) — discovers page object methods from src/pages/
  → CodeGenerator        (src/agent/generators/) — orchestrates LLM + rule-based code assembly
      ↳ LLMService       (src/agent/services/) — Anthropic claude-opus-4-5-20251101, temp=0.3, cached
  → src/tests/generated/<category>/<TEST_ID>.spec.ts
```

### Key Source Files

| Path | Purpose |
|------|---------|
| `src/agent/run-agent.ts` | CLI entry point for all agent modes |
| `src/agent/PlaywrightAgent.ts` | Main orchestration class |
| `src/agent/config/AgentConfig.ts` | Paths, model settings, all known page objects & constants |
| `src/agent/config/PromptsConfig.ts` | System prompts, action→code mappings, guardrail rules |
| `src/agent/generators/CodeGenerator.ts` | Orchestrates LLM + rule-based code assembly |
| `src/agent/services/LLMService.ts` | Anthropic axios client with response caching |
| `src/agent/services/LLMPrompts.ts` | Prompt builders for code gen and value extraction |
| `src/agent/parsers/TestCaseParser.ts` | Parses inputs, detects category & test type |
| `src/agent/analyzers/SchemaAnalyzer.ts` | Discovers page object methods from src/pages/ |
| `src/agent/analyzers/PageObjectWriter.ts` | Generates new page object methods |
| `src/agent/analyzers/DataValidator.ts` | Validates and auto-corrects CSV test data |
| `src/agent/types/TestCaseTypes.ts` | All TypeScript interfaces (TestCaseInput, GeneratedScript, etc.) |
| `src/pages/` | Page Object Model classes organized by domain |
| `src/utils/PageManager.ts` | Factory for all page objects |
| `src/utils/dfbUtils/MultiAppManager.ts` | Multi-app context switching (BTMS, TNX, DME) |
| `src/utils/alertPatterns.ts` | Application alert message constants (`ALERT_PATTERNS`) |
| `src/loginHelpers/userSetup.ts` | All application user credentials (env vars + `userConfig.json`) |
| `src/data/<category>/` | CSV test data files per test category |
| `src/config/dataConfig.ts` | CSV data reader utility |
| `src/tests/generated/` | Output directory for AI-generated spec files |

### Test Categories & Data Files

Each category maps to a CSV in `src/data/<folder>/<file>.csv`:

| Category | CSV File |
|----------|----------|
| `dfb` | `dfb/dfbdata.csv` |
| `edi` | `edi/edidata.csv` |
| `commission` | `commission/commissiondata.csv` |
| `salesLead` | `salesLead/salesleaddata.csv` |
| `banyan` | `banyan/banyandata.csv` |
| `carrier` | `carrier/carrierdata.csv` |
| `bulkChange` | `bulkChange/bulkchangedata.csv` |
| `dat` | `dat/datdata.csv` |
| `nonOperationalLoads` | `nonOperationalLoads/nonoperationalloadsdata.csv` |
| `api` | `api/apidata.csv` |

### Page Object Model

Page objects live in `src/pages/` grouped by domain: `loads`, `login`, `admin`, `customers`, `finance`, `salesLead`, `carrier`, `tnx`, `dme`, `tritan`, `home`, `commonPages`. All are exposed via `PageManager` at `src/utils/PageManager.ts`.

Generated tests access page objects as `pages.<getter>.<method>()`. The `AgentConfig.pageObjects` registry lists all known POM classes — update it when adding new page objects. The `excludedPageDirs` in AgentConfig lists domains intentionally excluded from the registry.

### Multi-Application Support

Tests can span three applications via `appManager` (`MultiAppManager`):
- `appManager.switchToBTMS()` — main TMS
- `appManager.switchToTNX()` — Tender Exchange
- `appManager.switchToDME()` — Digital Matching Engine

Reference example for multi-app tests: `DFB-97739.spec.ts`. Reference for BTMS-only: `DFB-25103.spec.ts`.

### Generated Test Structure

```typescript
import { BrowserContext, expect, Page, test } from '@playwright/test';
import { MultiAppManager } from '@utils/dfbUtils/MultiAppManager';
import userSetup from '@loginHelpers/userSetup';
import dataConfig from '@config/dataConfig';
import { PageManager } from '@utils/PageManager';
import { ALERT_PATTERNS } from '@utils/alertPatterns';

const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.serial('Case ID: TEST_ID - Title', () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });

  test.afterAll(async () => {
    await appManager.closeAllSecondaryPages();
    await sharedContext.close();
  });

  test('description', { tag: '@aiteam,@category' }, async () => {
    await test.step('Step 1: Login BTMS', async () => { ... });
    await test.step('Step 2: ...', async () => { ... });
  });
});
```

Key patterns:
- `test.describe.serial()` for sequential steps sharing browser context
- `beforeAll`/`afterAll` manage shared `BrowserContext` and `Page`
- Test data from CSV: `dataConfig.getTestDataFromCsv(dataConfig.<category>Data, testcaseID)`
- Tags on each test: `{ tag: '@aiteam,@<category>' }`
- Alert assertions use `ALERT_PATTERNS` constants, not hardcoded strings

### Path Aliases (tsconfig)

| Alias | Resolves To |
|-------|------------|
| `@pages/*` | `src/pages/*` |
| `@utils/*` | `src/utils/*` |
| `@config/*` | `src/config/*` |
| `@loginHelpers/*` | `src/loginHelpers/*` |
| `@api/*` | `src/api/*` |
| `@data/*` | `src/data/*` |

### Environment & Credentials

Required environment variables (store in `.env`, which is gitignored):

```
GLOBAL_PASSWORD=
BTMS_SSO_PASSWORD=
TNX_PASSWORD=
TNX_REP_PASSWORD=
DME_PASSWORD=
TRITAN_CUSTOMER_PASSWORD=
ANTHROPIC_API_KEY=        # Required for LLM-assisted generation
```

User credentials are loaded in `userSetup.ts` from two sources:
1. `src/loginHelpers/userConfig.json` (gitignored) — usernames and non-sensitive config
2. Environment variables — all passwords

The agent degrades gracefully to rule-based generation if `ANTHROPIC_API_KEY` is unavailable.

### Playwright Config Highlights

- Tests run sequentially (`workers: 1`, `fullyParallel: false`)
- Timeouts: 5 min test, 3 min action/navigation
- Screenshots always captured (full-page), trace always on, video off
- Browser: Chrome headless via `channel: 'chrome'`
- Reporters: Allure (`src/reporting/allure-results/`), JUnit XML, HTML, list, Testmo

### TypeScript Strict Settings

The tsconfig enforces `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`. Generated code must satisfy these or it will fail to compile.
