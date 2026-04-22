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

# Run agent unit tests
npx playwright test src/agent/__tests__/
```

## Git Setup (required once per clone)

```bash
git config core.ignorecase false
git update-index --skip-worktree src/testmo/testmo-reporter.ts
```

## Architecture

This is an AI-powered Playwright test generation framework for SunTeck TMS (Transport Management System). It takes high-level test case descriptions and generates executable Playwright `.spec.ts` files.

### Generation Pipeline (3-Agent Architecture)

LLM calls are currently disabled. Generation is fully rule-based using the 3-agent pipeline:

```
Input (JSON / plain text / CSV / XLSX)
  → TestCaseParser          (src/agent/parsers/)       — categorize + type-detect via keyword matching + FieldRegistry extraction
  → RepoCloneManager        (src/agent/services/)      — clones/updates app source repos (returns anyUpdated flag)
  → AppSourceIndexer        (src/agent/analyzers/)     — scans PHP/Twig for HTML elements (index invalidated on repo update)
  → CsvDataService          (src/agent/services/)      — ensures test data row in category CSV
  → CodeGenerator           (src/agent/generators/)    — orchestrates generation:
      ├─ HIGH MATCH (≥70%): cloneAndAdaptReferenceSpec  — clones reference, compares steps + expected results
      │   └─ steps with matching action AND expected results → kept from reference
      │   └─ steps with differing expected results → LLM generates replacement code
      └─ STEP-BY-STEP: processAllSteps() pre-processes all steps with evolving context:
          → Agent 1: StepProcessor  (src/agent/analyzers/) — classifies steps, immutable contextBefore/contextAfter
          → StepMappings            (src/agent/config/)    — best-match scoring across 130+ declarative mappings
          → Agent 2: POMMethodMatcher (src/agent/generators/) — matches steps to POMs using context snapshots
  → Agent 3: SpecValidator  (src/agent/validators/)    — sanitizer pre-pass + guardrail validation + auto-fixes
  → PageObjectWriter        (src/agent/analyzers/)     — writes new POM methods to page object files
  → src/tests/generated/<category>/<TEST_ID>.spec.ts
```

### Application Source Integration

The agent clones application source repos to extract exact locators (never fabricated):

| Repo | Branch | App | Scanned Path |
|------|--------|-----|-------------|
| `modetrans/mono.git` | `master` | btms | `btms/php/src` (*.php) |
| `modetrans/dme.git` | `main` | dme | `templates` (*.html.twig) |

Cache: `src/agent/.cache/` (repos + `app-source-index.json`)

The `AppSourceIndexer` extracts all HTML elements (inputs, selects, buttons, etc.) with stability scores. The `POMMethodMatcher` uses this index to find exact locators when creating new POM methods.

**Index invalidation**: `RepoCloneManager.ensureRepos()` returns `{ sourceDirs, anyUpdated }` where `anyUpdated` is true if any repo's commit hash changed after git pull. When `anyUpdated=true`, `PlaywrightAgent.ensureAppSourceIndexer()` skips the JSON cache and forces a full index rebuild.

### Unified Field Registry

`src/agent/config/FieldRegistry.ts` is the single source of truth for all field name mappings. Each `FieldDefinition` ties together:
- `canonicalKey` — the testData key used in generated code (camelCase)
- `formFieldId` — the HTML form field name/id (snake_case)
- `stepPatterns` — regexes that match this field in natural-language test steps
- `csvAliases` — lowercase CSV column headers that map to this field
- `extractionSources` — where to find the value in `explicitValues`

Derived functions:
- `buildStepFieldAliases()` — used by StepProcessor for step text → field inference
- `buildCsvAliasMap()` — used by CsvDataService for CSV column → value mapping
- `csvHeaderToCanonicalKey()` / `testDataKeyToFormField()` — utility lookups

### StepMappings Best-Match Scoring

`matchStepMapping()` in `StepMappings.ts` evaluates ALL 130+ mappings and picks the best match by scoring: `confidence × specificityScore(pattern, action, match)`. The specificity score considers:
- Literal character ratio (40%) — how many non-metacharacters in the regex
- Match coverage (40%) — what fraction of the input the match spans
- Capture group bonus (up to 15%) — patterns with captures are more specific
- Anchor bonus (up to 10%) — `^` and `$` anchored patterns score higher

This eliminates ordering fragility — specific mappings (e.g., "Enter carrier rate") beat generic ones (e.g., "Enter value") regardless of array position.

### SpecValidator Sanitizer Pre-Pass

`SpecValidator.sanitize()` runs 13 declarative `SANITIZER_RULES` (SAN-001 through SAN-013) as a pre-pass before structural validation. Each rule has `detect(code) → bool` and `fix(code) → string`. Key rules:
- SAN-001: Smart/curly quotes → straight quotes
- SAN-006: DMELogin/TNXLogin extra password arg removal
- SAN-007: navigateToHeader → hoverOverHeaderByText
- SAN-008: testData.undefined → testData.FIXME_UNDEFINED_FIELD
- SAN-011: Duplicate import line deduplication

The `validateAndCorrect()` method calls `sanitize()` before entering the validation loop.

### View Mode vs Edit Mode Awareness

The `StepProcessor` tracks `isEditMode` in `PageContext`. Each `ProcessedStep` carries immutable context snapshots:
- `contextBefore` — frozen `PageContext` snapshot before the step executes
- `contextAfter` — frozen `PageContext` snapshot after the step's context mutations
- `context` (deprecated) — mutable snapshot, kept for backward compatibility

The `POMMethodMatcher` uses `step.context` to choose locator strategy:
- **Edit mode** (`isEditMode=true`): Uses exact `#id` locators (e.g., `page.locator('#invoice_process')`) with `.inputValue()`, `.fill()`, `.selectOption()`
- **View mode** (`isEditMode=false`, action=`verify`): Uses Playwright chained locators (e.g., `page.getByRole('row', { name: /Label/i }).locator('td').nth(1)`) with `.textContent()`
- **Tab awareness** (`currentTab`): `TAB_TO_PREFERRED_CLASS` maps tab names to preferred POM classes (e.g., PICK → `EditLoadPickTabPage`, DROP → `EditLoadDropTabPage`). This disambiguates methods like `enterActualDateValue()` that exist on both tab pages.

### Clone+Adapt Expected Result Comparison

When `cloneAndAdaptReferenceSpec()` clones a high-match reference spec, `matchStepsToReference()` compares both **action text** (Jaccard word similarity) and **expected results**. If a step's action matches the reference (≥0.5 similarity) but its expected result contains keywords missing from the reference step's code, the similarity is capped at 0.4 to force LLM-based adaptation. This prevents blind cloning of assertion code when the expected outcome differs (e.g., "Load is not Invoiced" vs "carrier invoiced $XXX over the total charge").

### Data Extraction: No Hardcoded Defaults

`TestCaseParser` field defaults for `rateType`, `loadMethod`, and `Method` are empty strings — not category-specific defaults like "SPOT" or "TL". Values must come from explicit step text extraction or CSV data. This prevents incorrect defaults from polluting test data for categories that don't use those fields.

### Key Source Files

| Path | Purpose |
|------|---------|
| `src/agent/run-agent.ts` | CLI entry point for all agent modes |
| `src/agent/PlaywrightAgent.ts` | Main orchestration class — initializes AppSourceIndexer, delegates CSV to CsvDataService |
| `src/agent/config/AgentConfig.ts` | Paths, model settings, app source repos, all known page objects & constants |
| `src/agent/config/PromptsConfig.ts` | System prompts, action→code mappings, guardrail rules |
| `src/agent/config/FieldRegistry.ts` | **Unified field registry** — single source of truth for field aliases, CSV mappings, step patterns |
| `src/agent/config/StepMappings.ts` | 130+ declarative step→code mappings with best-match scoring |
| `src/agent/analyzers/StepProcessor.ts` | **Agent 1** — classifies raw steps into ProcessedStep with immutable contextBefore/contextAfter snapshots |
| `src/agent/generators/POMMethodMatcher.ts` | **Agent 2** — matches steps to POM methods, proposes new ones with app-source locators |
| `src/agent/validators/SpecValidator.ts` | **Agent 3** — validates guardrails, auto-fixes violations, declarative SANITIZER_RULES pre-pass |
| `src/agent/generators/CodeGenerator.ts` | Assembles spec code from step mappings (rule-based, LLM disabled) |
| `src/agent/analyzers/AppSourceIndexer.ts` | Scans cloned app source (PHP/Twig) for HTML elements with stability scores |
| `src/agent/services/RepoCloneManager.ts` | Clones/updates application source repos from GitHub (returns anyUpdated for index invalidation) |
| `src/agent/services/CsvDataService.ts` | CSV read/write/alias operations (extracted from PlaywrightAgent) |
| `src/agent/analyzers/PageObjectWriter.ts` | Writes new POM methods to page object files (protects human-authored code) |
| `src/agent/services/LLMService.ts` | Anthropic axios client (currently disabled) |
| `src/agent/services/LLMPrompts.ts` | Prompt builders (currently unused) |
| `src/agent/parsers/TestCaseParser.ts` | Parses inputs, detects category & test type |
| `src/agent/analyzers/SchemaAnalyzer.ts` | Discovers page object methods from src/pages/ |
| `src/agent/analyzers/DataValidator.ts` | Validates and auto-corrects CSV test data |
| `src/agent/types/TestCaseTypes.ts` | All TypeScript interfaces (TestCaseInput, GeneratedScript, etc.) |
| `src/agent/__tests__/` | Unit tests for StepProcessor, FieldRegistry, StepMappings, SpecValidator |
| `src/pages/` | Page Object Model classes organized by domain |
| `src/utils/PageManager.ts` | Factory for all page objects |
| `src/utils/dfbUtils/MultiAppManager.ts` | Multi-app context switching (BTMS, TNX, DME) |
| `src/utils/globalConstants.ts` | Global constants (HEADERS, LOAD_STATUS, INVOICE_PROCESS, AUTOPAY_STATUS, etc.) |
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
| `billingtoggle` | `billingtoggle/billingtoggledata.csv` |
| `nonOperationalLoads` | `nonOperationalLoads/nonoperationalloadsdata.csv` |
| `api` | `api/apidata.csv` |

### Page Object Model

Page objects live in `src/pages/` grouped by domain: `loads`, `login`, `admin`, `customers`, `finance`, `salesLead`, `carrier`, `tnx`, `dme`, `tritan`, `home`, `commonPages`. All are exposed via `PageManager` at `src/utils/PageManager.ts`.

Generated tests access page objects as `pages.<getter>.<method>()`. The `AgentConfig.pageObjects` registry lists all known POM classes — update it when adding new page objects. The `excludedPageDirs` in AgentConfig lists domains intentionally excluded from the registry.

### POM Authorship Protection

**MANDATORY**: Human-authored POM methods and locators are strictly read-only. The agent may only:
- **ADD** new methods/locators (marked `@author AI Agent`)
- **MODIFY** existing `@author AI Agent` methods

Never alter methods authored by any human (Deepak Bohra, Avanish Srivastava, Mukul Khan, etc.). If a human-authored locator needs a fix, propose the change as a comment — do not apply it.

### POM Method Requirements

Every POM method must have a JSDoc block:
- `@author` (mandatory — `AI Agent` for generated methods)
- `@created` (mandatory — date in YYYY-MM-DD format)
- `@param` for each parameter
- `@returns` for non-void return types
- Locator source reference (e.g., `officeform.php:1449`) when discovered from app source

### Guardrail Rules

Key guardrails enforced by `SpecValidator` (Agent 3) and `PromptsConfig.ts`:

| Rule | What it prevents |
|------|-----------------|
| `noLocatorsInSpecs` | `sharedPage.locator(...)` in spec files — use POM methods |
| `noHardcodedAssertionValues` | Hardcoded strings in `.toBe()`, `.toContain()` — use global constants or `testData.*` |
| `noHardcodedNumericValuesInPOMCalls` | Hardcoded numbers in rate/amount POM calls — use `testData.*` |
| `noHardcodedTimeouts` | Hardcoded timeout numbers — use `WAIT` constants |
| `noForceTrue` | `force: true` in locator options — fix root cause instead |
| `pomMethodJSDocRequired` | POM methods without JSDoc tags |
| `noModifyHumanAuthoredPOM` | Modifying human-authored POM methods/locators |
| `noSilentCatchInGeneratedPOM` | Silent `.catch(() => false)` — must log errors |
| `noEvaluateDomGuessing` | `page.evaluate()` with DOM querySelector — use Playwright methods |

### Global Constants

Assertion expected values must come from `src/utils/globalConstants.ts`, never hardcoded:

| Constant | Keys | Usage |
|----------|------|-------|
| `INVOICE_PROCESS` | `OFFICE`, `CENTRAL` | Office invoice process validation |
| `AUTOPAY_STATUS` | `ENABLED` ("YES"), `DISABLED` ("NO") | Office auto-pay validation (view page display values) |
| `PAYABLE_TOGGLE_VALUE` | `AGENT`, `BILLING`, `NEUTRAL` | Billing page payable toggle |
| `FINANCE_MESSAGES` | `LOAD_NOT_INVOICED`, `CARRIER_OVER_INVOICED` | Finance/billing message assertions |
| `LOAD_STATUS` | Various | Load status assertions |
| `HEADERS`, `ADMIN_SUB_MENU`, `LOAD_SUB_MENU`, etc. | Various | Navigation constants |

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
- Assertion values use global constants (`INVOICE_PROCESS.OFFICE`, `AUTOPAY_STATUS.ENABLED`), not hardcoded strings

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
ANTHROPIC_API_KEY=        # Optional — LLM calls currently disabled, rule-based generation is default
```

User credentials are loaded in `userSetup.ts` from two sources:
1. `src/loginHelpers/userConfig.json` (gitignored) — usernames and non-sensitive config
2. Environment variables — all passwords

### Playwright Config Highlights

- Tests run sequentially (`workers: 1`, `fullyParallel: false`)
- Timeouts: 5 min test, 3 min action/navigation
- Screenshots always captured (full-page), trace always on, video off
- Browser: Chrome headless via `channel: 'chrome'`
- Reporters: Allure (`src/reporting/allure-results/`), JUnit XML, HTML, list, Testmo

### TypeScript Strict Settings

The tsconfig enforces `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`. Generated code must satisfy these or it will fail to compile.
