# Proposal: Three-Agent Architecture for Step-to-Code Generation

**Status:** Draft — pending review  
**Author:** AI Agent  
**Date:** 2026-04-14  
**Updated:** 2026-04-21 — Added Agent 3 (Validator) with feedback loop, auto-clone from GitHub  

---

## Problem Statement

The current `generateCodeFromAction()` pipeline in `CodeGenerator.ts` has four critical flaws:

1. **Hardcoded heuristic tree** — A 1,600-line `if/else` ladder maps step descriptions to POM calls via keyword matching. Every new POM method requires a new branch; novel wording falls through.
2. **Fabricated locators on fallback** — When heuristics and LLM both fail, `generateDirectLocatorCode()` (CodeGenerator.ts:2782) and self-check Fix 6 (PlaywrightAgent.ts:1004) fabricate `sharedPage.locator()` calls from step text (e.g., "Enter office code" → `#form_office_code`). These are often wrong and violate the "no locators in spec" guardrail.
3. **Warn-only guardrails** — Of 33 guardrails in `validatePostGenerationGuardrails`, 14 are warn-only (they log but never fix or block). The critical one — #13 (`sharedPage.locator()` in spec) — has no enforcement at all.
4. **No step coverage verification** — There is no check that all test case steps have been translated into code. Steps can be silently dropped, merged incorrectly, or replaced with placeholders without detection.

**Evidence:** BT-72258.spec.ts was generated with 8 fabricated `sharedPage.locator()` calls, 3 placeholder steps regenerated as nonsense locators, missing step coverage for "Accept the alert" and "Upload documents", and multiple guardrail violations that were logged but never fixed.

---

## Proposed Architecture

Replace the single-pass heuristic pipeline with **three sequential agents**, an **Application Source Indexer**, and a **feedback loop**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRE-PROCESSING (runs once)                      │
│                                                                     │
│  RepoCloneManager (NEW)                                             │
│  ├── git clone --depth 1 modetrans/mono.git → .cache/mono/         │
│  ├── git clone --depth 1 modetrans/dme.git  → .cache/dme/          │
│  └── Auto-pull if cache older than 24h                              │
│                                                                     │
│  AppSourceIndexer                                                   │
│  ├── Scans .cache/mono/btms/php/src/*.php                           │
│  ├── Scans .cache/dme/templates/**/*.twig                           │
│  └── Builds element index: { id, name, type, context, file, line } │
│                                                                     │
│  PageObjectScanner (existing)                                       │
│  └── Builds POM index: { className, methods[], locators[] }        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   AGENT 1: StepProcessor                            │
│                                                                     │
│  Input:  TestStep[] (raw action strings from parser)                │
│  Output: ProcessedStep[] (classified, entity-extracted)             │
│                                                                     │
│  Per step:                                                          │
│  1. Classify actionType (login, navigate, fill, select, click,      │
│     verify, upload, alert, switch-app, wait)                        │
│  2. Extract entities: targetField, targetValue, targetPage,         │
│     targetTab, expectedResult, alertPattern                         │
│  3. Resolve value source: hardcoded vs testData vs generated        │
│  4. NO code generation — pure text analysis                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   AGENT 2: POMMethodMatcher                         │
│                                                                     │
│  Input:  ProcessedStep[] + POM index + App Source index              │
│  Output: GeneratedTestStep[] (code for each step)                   │
│                                                                     │
│  Per step (3-phase lookup):                                         │
│  A. Search existing POM methods → emit POM call                     │
│  B. Search app source for real locator → create new POM method      │
│  C. Mark as TODO (NEVER fabricate a locator)                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                AGENT 3: SpecValidator (NEW)                         │
│                                                                     │
│  Input:  Generated spec code + ProcessedStep[] + guardrail rules    │
│  Output: ValidationReport (pass/fail + list of violations)          │
│                                                                     │
│  Checks:                                                            │
│  1. Step Coverage — every ProcessedStep has matching code            │
│  2. Hard Guardrails — zero sharedPage.locator(), no fabricated IDs  │
│  3. Structural Integrity — balanced braces, valid imports, types    │
│  4. POM Compliance — all locators in POM, no business logic in spec │
│  5. Data Compliance — no hardcoded values, testData.* used          │
│  6. Assertion Quality — no .toBeTruthy() for value checks           │
│                                                                     │
│  If FAIL → feedback to Agent 2 with specific corrections            │
│  If PASS → write spec to disk                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
               ┌──────────────────────────┐
               │   FEEDBACK LOOP          │
               │                          │
               │  Validator FAIL?         │
               │  ├── YES → send back to  │
               │  │   Agent 2 with:       │
               │  │   - violation list    │
               │  │   - step indices      │
               │  │   - correction hints  │
               │  │   (max 2 iterations)  │
               │  └── NO → write to disk  │
               └──────────────────────────┘
```

---

## Component Details

### Component 0: RepoCloneManager (NEW)

**File:** `src/agent/services/RepoCloneManager.ts`

**Purpose:** Automatically clone and keep up-to-date shallow copies of the application source repositories. Eliminates dependency on hardcoded local paths — works on any machine with git credentials.

**Behavior:**

```
Agent startup:
  For each configured repo:
    1. Check if .cache/<repoName>/ exists
       ├── YES → check age of last pull
       │   ├── < 24 hours → skip (use cached)
       │   └── ≥ 24 hours → git pull (fast, shallow)
       └── NO  → git clone --depth 1 --branch <branch> <url> .cache/<repoName>/
    2. Verify clone is healthy (contains expected subPath)
    3. Return local path to AppSourceIndexer
```

**Cache location:** `src/agent/.cache/` (gitignored)

```
src/agent/.cache/
├── mono/                    ← shallow clone of modetrans/mono
│   └── btms/php/src/        ← AppSourceIndexer reads from here
│       ├── loadform.php
│       ├── carrform.php
│       ├── billing.php
│       └── ...
├── dme/                     ← shallow clone of modetrans/dme
│   └── templates/           ← AppSourceIndexer reads from here
│       ├── bundles/
│       ├── admin/
│       └── ...
└── clone-metadata.json      ← tracks last-pull timestamps
```

**clone-metadata.json:**

```json
{
  "mono": {
    "repoUrl": "https://github.com/modetrans/mono.git",
    "branch": "main",
    "lastPull": "2026-04-21T07:30:00.000Z",
    "commitHash": "570b65d2c636f0669da79f4a02ea862ad9a2affe"
  },
  "dme": {
    "repoUrl": "https://github.com/modetrans/dme.git",
    "branch": "main",
    "lastPull": "2026-04-21T07:30:12.000Z",
    "commitHash": "91494de7fcc5d5b93fe5acd1503314586d18259d"
  }
}
```

**Interface:**

```typescript
interface RepoConfig {
  repoUrl: string;           // e.g., "https://github.com/modetrans/mono.git"
  branch: string;            // e.g., "main"
  name: string;              // e.g., "mono" — used as cache folder name
  subPath: string;           // e.g., "btms/php/src" — subfolder to index
  fileTypes: string[];       // e.g., ["*.php"]
  app: string;               // e.g., "btms" — used as context label
}

class RepoCloneManager {
  constructor(private cacheDir: string, private maxAgeMs: number = 24 * 60 * 60 * 1000) {}
  
  async ensureRepos(repos: RepoConfig[]): Promise<Map<string, string>> {
    // Returns map of repoName → local path to subPath
    // e.g., { "mono" → "src/agent/.cache/mono/btms/php/src" }
  }
  
  async forceRefresh(repoName: string): Promise<void> {
    // Force git pull regardless of cache age
  }
}
```

**Graceful degradation:**
- If git credentials are missing → log warning, skip clone, AppSourceIndexer runs without that repo (Phase B returns empty results, falls through to Phase C TODO)
- If network is unavailable → use stale cache if it exists, log warning
- If repo URL changes → delete old cache, re-clone
- On CI → the clone step is automatic; CI just needs the same git credentials it already uses for Playwright_Agent

**Performance:**
- `git clone --depth 1` for mono (~30s first time, fetches only latest commit)
- `git clone --depth 1` for dme (~5s first time, small repo)
- `git pull` on subsequent runs (~2-5s if cache is stale)
- Total overhead on first run: ~35s (amortized — only runs once per 24h)

---

### Component 1: AppSourceIndexer (NEW)

**File:** `src/agent/analyzers/AppSourceIndexer.ts`

**Purpose:** Build a searchable index of all HTML elements (inputs, selects, buttons, links, tables) from the auto-cloned application source code. This is the single source of truth for locators — the agent NEVER guesses.

**Source directories** (resolved by RepoCloneManager):

| App | Repository | Sub-path | File types | Key files |
|-----|-----------|----------|------------|-----------|
| BTMS | `modetrans/mono` | `btms/php/src/` | `*.php` | `loadform.php`, `carrform.php`, `billing.php`, `officeform.php`, `custform.php`, `loads.inc.php`, `quoteform.php` |
| DME | `modetrans/dme` | `templates/` | `*.twig`, `*.html.twig` | `login.html.twig`, `request.html.twig`, `api_token.html.twig` |

**Index structure:**

```typescript
interface AppElement {
  id?: string;            // e.g., "form_agent_login", "load_rate_type_select"
  name?: string;          // e.g., "load_rate_type", "office_code"
  type: 'input' | 'select' | 'button' | 'textarea' | 'checkbox' | 'radio' | 'link' | 'table' | 'div' | 'span';
  inputType?: string;     // "text", "hidden", "password", "submit", "file", etc.
  classes?: string[];     // CSS classes on the element
  text?: string;          // Button text, link text, label text
  parentForm?: string;    // "fatsform", "carr_form", "custform", etc.
  sourceFile: string;     // Relative path to the PHP/Twig file
  sourceLine: number;     // Line number in source
  context: string;        // Page context: "loadform", "carrform", "billing", "officeform", "custform", "dme-login"
  labelText?: string;     // Associated <label> text if found nearby
}

interface AppSourceIndex {
  elements: AppElement[];
  findById(id: string): AppElement[];
  findByName(name: string): AppElement[];
  findByText(text: string, type?: string): AppElement[];
  findByContext(context: string): AppElement[];
  fuzzySearch(query: string, context?: string): AppElement[];
}
```

**Extraction patterns:**

```
PHP echo patterns:
  echo "<input type='text' id='field_name' name='field_name' ...>"
  echo "<select name='dropdown' id='dropdown' ...>"
  echo "<button id='saveButton' ...>Save</button>"
  $ht['field'] = "<input name='field_name' id='field_name' ...>"
  $ht['field'] = selectbox("field_name", ...)        // name = id = first arg
  $ht['field'] = selectbox1("field_name", ..., 'id="custom_id"')

Twig patterns:
  <input type="text" id="username" name="_username" ...>
  <button type="submit" class="btn ...">Sign in</button>
  {{ form_widget(requestForm.email, ...) }}           // id = "reset_password_request_form_email"
```

**Scan strategy:**
- Runs once at agent startup (before any test case generation)
- Cached to disk (`src/agent/.cache/app-source-index.json`) with file modification timestamps
- Incremental re-scan when source files change
- Expected index size: ~2,000–5,000 elements across both apps

**Configuration** (in `AgentConfig.ts`):

```typescript
public appSourceRepos: RepoConfig[] = [
  {
    repoUrl: 'https://github.com/modetrans/mono.git',
    branch: 'main',
    name: 'mono',
    subPath: 'btms/php/src',
    fileTypes: ['*.php'],
    app: 'btms',
  },
  {
    repoUrl: 'https://github.com/modetrans/dme.git',
    branch: 'main',
    name: 'dme',
    subPath: 'templates',
    fileTypes: ['*.twig', '*.html.twig'],
    app: 'dme',
  },
];

// Cache settings
public appSourceCacheDir: string = path.join(this.projectRoot, 'src/agent/.cache');
public appSourceCacheMaxAgeMs: number = 24 * 60 * 60 * 1000; // 24 hours
```

---

### Component 2: StepProcessor — Agent 1 (NEW)

**File:** `src/agent/analyzers/StepProcessor.ts`

**Purpose:** Classify and extract structured intent from raw test step text. No code generation.

```typescript
type ActionType = 
  | 'login' | 'navigate' | 'fill' | 'select' | 'click' 
  | 'verify' | 'upload' | 'alert' | 'switch-app' | 'switch-user'
  | 'wait' | 'save' | 'hover' | 'tab-click' | 'unknown';

interface ProcessedStep {
  stepNumber: number;
  rawAction: string;
  actionType: ActionType;
  targetField?: string;
  targetValue?: string;
  targetPage?: string;
  targetTab?: string;
  buttonText?: string;
  linkText?: string;
  headerText?: string;
  subHeaderText?: string;
  expectedResult?: string;
  alertPattern?: string;
  documentType?: string;
  valueSource: 'hardcoded' | 'testData' | 'generated' | 'none';
  testDataKey?: string;
  app: 'btms' | 'dme' | 'tnx' | 'unknown';
}
```

**Classification rules** (regex-based, no LLM needed):

| actionType | Detection pattern |
|------------|-------------------|
| `login` | `/login\|sign.?in\|btmslogin\|sso/i` |
| `navigate` | `/navigate\|go\s+to\|open\|hover.*header.*click/i` |
| `fill` | `/enter\|fill\|input\|type\s+in/i` |
| `select` | `/select\|choose\|dropdown\|from.*drop/i` |
| `click` | `/click\|press\|tap/i` (and not other types) |
| `verify` | `/verify\|validate\|assert\|check\|ensure\|confirm\|expect/i` |
| `upload` | `/upload\|attach\|browse.*file\|drag.*drop/i` |
| `alert` | `/alert\|accept.*ok\|dismiss\|dialog\|confirm.*popup/i` |
| `switch-app` | `/switch.*tnx\|switch.*dme\|switch.*btms/i` |
| `switch-user` | `/switch.*user\|change.*user/i` |
| `save` | `/save\s+button\|click.*save\|submit.*form/i` |
| `hover` | `/hover\s+over/i` |
| `tab-click` | `/click.*tab\|navigate.*tab\|select.*tab/i` |

---

### Component 3: POMMethodMatcher — Agent 2 (NEW)

**File:** `src/agent/generators/POMMethodMatcher.ts`

**Purpose:** For each processed step, find the best existing POM method or create a new one with a verified locator from the application source.

```typescript
interface MatchResult {
  type: 'existing-pom' | 'new-pom' | 'todo';
  code: string;
  pageObject?: string;
  methodName?: string;
  confidence: number;          // 0.0–1.0
  newLocator?: AppElement;     // If new POM method was created, the source element
  reason: string;
}
```

**Phase A — POM method matching:**

Score all indexed POM methods against the ProcessedStep:

```
Score = weighted sum of:
  - actionType alignment   (0.3) → method name contains verb matching step type
  - field name similarity  (0.3) → method name/params match targetField
  - page context match     (0.2) → method's POM class matches targetPage
  - parameter compat       (0.2) → method accepts value of the right type
```

Threshold: match if score ≥ 0.6.

**Phase B — App source locator search + new POM method creation:**

1. Query `AppSourceIndexer.fuzzySearch(targetField, targetPage)`
2. Find actual `id`/`name` from PHP/Twig source
3. Generate new POM method with the REAL locator
4. Write to POM file via `PageObjectWriter` (existing)
5. Emit POM call to the new method

**Locator selection priority** (from AppElement):
1. `#id` (CSS id selector) — if `id` exists and is short/stable
2. `[name="value"]` — if `name` exists and `id` doesn't
3. `getByRole('button', { name: 'text', exact: true })` — for buttons/links with text
4. `getByLabel('label text')` — if `labelText` was extracted

**Phase C — TODO fallback:**

```typescript
// TODO: No POM method or application element found for: "Accept the alert by clicking OK"
// Manual implementation required — verify the element exists in the application
```

**NEVER** fabricates a locator. This is the hard constraint.

---

### Component 4: SpecValidator — Agent 3 (NEW)

**File:** `src/agent/validators/SpecValidator.ts`

**Purpose:** Post-generation validation agent that checks the generated spec against the original test case, enforces all guardrails as hard blocks, and provides structured feedback for correction.

#### Why a separate validator?

Currently, validation is scattered across three methods (`validatePostGenerationGuardrails`, `selfCheckAndFix`, `validateGeneratedCode`) with 50+ individual checks, most of which are warn-only. The problems:

| Current issue | Impact |
|---------------|--------|
| 14 of 33 guardrails in `validatePostGenerationGuardrails` are warn-only | Violations ship to disk uncorrected |
| `selfCheckAndFix` Fix 6 *creates* violations while trying to fix them | Produces fabricated `sharedPage.locator()` calls |
| `validateGeneratedCode` finds issues but never blocks the write | File is saved regardless of issue count |
| No step coverage check exists anywhere | Steps silently dropped or merged |
| LLM fix attempt runs once and accepts degraded output | Non-improving LLM response overwrites the original |

Agent 3 consolidates all validation into a single authority with **hard enforcement**.

#### Interface

```typescript
interface ValidationViolation {
  ruleId: string;                    // e.g., "HARD-001", "STEP-003", "POM-002"
  severity: 'hard-block' | 'error' | 'warning';
  message: string;                   // Human-readable description
  line?: number;                     // Line in generated spec
  stepNumber?: number;               // Which test step is affected
  category: 'step-coverage' | 'guardrail' | 'structural' | 'pom-compliance' 
           | 'data-compliance' | 'assertion-quality';
  autoFixable: boolean;              // Can Agent 2 fix this automatically?
  correctionHint?: string;           // Specific instruction for Agent 2
  affectedCode?: string;             // The problematic code snippet
}

interface ValidationReport {
  passed: boolean;                   // true only if zero hard-block/error violations
  violations: ValidationViolation[];
  stepCoverage: StepCoverageResult;
  summary: {
    hardBlocks: number;
    errors: number;
    warnings: number;
    stepsImplemented: number;
    stepsTotal: number;
    stepsMissing: number;
  };
}

interface StepCoverageResult {
  totalSteps: number;
  implementedSteps: number;
  missingSteps: ProcessedStep[];     // Steps with no corresponding code
  todoSteps: ProcessedStep[];        // Steps marked as TODO
  weakSteps: ProcessedStep[];        // Steps with low-confidence POM match
}

interface CorrectionRequest {
  stepIndex: number;
  processedStep: ProcessedStep;
  violation: ValidationViolation;
  instruction: string;               // Specific correction instruction for Agent 2
}
```

#### Validation Rules

**Category 1: Step Coverage (HARD-BLOCK)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `STEP-001` | Every `ProcessedStep` has a corresponding `test.step()` block in the spec | **HARD-BLOCK** — missing steps trigger correction |
| `STEP-002` | Step numbering is sequential (no gaps, no duplicates) | **ERROR** — auto-fixable |
| `STEP-003` | No placeholder-only steps (steps containing only `waitForAllLoadStates` and nothing else) | **HARD-BLOCK** — placeholder steps trigger re-generation via Agent 2 |
| `STEP-004` | TODO steps must have a clear reason, not a fabricated locator | **HARD-BLOCK** — TODO with `sharedPage.locator()` triggers correction |

**How step coverage works:**

```
For each ProcessedStep[i]:
  1. Search the spec for test.step("Step {i}:...") or test.step("...{rawAction keywords}...")
  2. If found:
     a. Check the step body is non-empty (not just comments/waits)
     b. Check the step body contains a POM call or valid assertion
     c. Mark as "implemented"
  3. If NOT found:
     a. Mark as "missing"
     b. Create a CorrectionRequest for Agent 2
```

**Category 2: Hard Guardrails (HARD-BLOCK)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `HARD-001` | Zero `sharedPage.locator()` calls in spec | **HARD-BLOCK** — each occurrence creates a CorrectionRequest with the step context and asks Agent 2 to find a POM method or search app source |
| `HARD-002` | Zero `sharedPage.evaluate()` with DOM guessing (querySelector, closest) | **HARD-BLOCK** |
| `HARD-003` | Zero fabricated element IDs (IDs not found in AppSourceIndex and > 30 chars or > 5 segments) | **HARD-BLOCK** |
| `HARD-004` | Zero `force: true` in locator options | **AUTO-FIX** (strip) |
| `HARD-005` | Zero `page.waitForTimeout(N)` hardcoded waits | **AUTO-FIX** → `waitForLoadState` |
| `HARD-006` | All `ALERT_PATTERNS.*` keys must exist in the constant registry | **HARD-BLOCK** — invalid key triggers correction |

**Category 3: Structural Integrity (ERROR)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `STRUCT-001` | Balanced braces `{}`, parentheses `()`, brackets `[]` | **ERROR** — auto-fixable |
| `STRUCT-002` | `test.describe.serial()` wrapper present | **ERROR** |
| `STRUCT-003` | `beforeAll` / `afterAll` present with correct setup/teardown | **ERROR** |
| `STRUCT-004` | All imports resolve (no missing `WAIT`, `HEADERS`, `ALERT_PATTERNS`, etc.) | **ERROR** — auto-fixable |
| `STRUCT-005` | No smart quotes (`"` `"` `'` `'`) | **AUTO-FIX** |
| `STRUCT-006` | No duplicate consecutive POM calls (copy-paste artifact) | **AUTO-FIX** |

**Category 4: POM Compliance (ERROR)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `POM-001` | All page interactions go through `pages.<getter>.<method>()` | **ERROR** — each violation creates CorrectionRequest |
| `POM-002` | No business logic (if/else, for/while, .map/.filter) in spec body | **ERROR** — CorrectionRequest to extract to POM |
| `POM-003` | `pages.<getter>` resolves to a known PageManager getter | **ERROR** |
| `POM-004` | `pages.<getter>.<method>` resolves to an existing method on that class | **ERROR** — triggers `ensurePageObjectMethodsExist` |
| `POM-005` | No inline `require()` calls in spec | **ERROR** |
| `POM-006` | No `try/catch` that swallows errors with `console.log` | **ERROR** — CorrectionRequest to use `expect.soft()` |

**Category 5: Data Compliance (ERROR)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `DATA-001` | No hardcoded numeric values in POM method calls (e.g., `enterCustomerRate("500")`) | **ERROR** — CorrectionRequest: "Use testData.customerRate" |
| `DATA-002` | No hardcoded carrier names — use `CARRIER_NAME.*` constants | **AUTO-FIX** |
| `DATA-003` | No hardcoded alert strings — use `ALERT_PATTERNS.*` constants | **AUTO-FIX** |
| `DATA-004` | `testData.undefined` replaced with valid key or `FIXME` marker | **ERROR** |
| `DATA-005` | Login uses correct user (`userSetup.globalUser` for non-salesLead) | **AUTO-FIX** |

**Category 6: Assertion Quality (WARNING)**

| Rule ID | Check | Enforcement |
|---------|-------|-------------|
| `ASSERT-001` | `expect.soft().toBeTruthy()` on value checks should use `.toBe()` / `.toContain()` | **WARNING** — CorrectionRequest with suggested fix |
| `ASSERT-002` | Steps with "hard assertion" in test case text use `expect()` not `expect.soft()` | **AUTO-FIX** |
| `ASSERT-003` | `console.log` used as validation substitute (contains "verified", "expected") | **WARNING** — CorrectionRequest: "Replace with expect()" |
| `ASSERT-004` | Every `verify` step has at least one `expect()` call | **ERROR** — CorrectionRequest |

---

#### The Feedback Loop

```typescript
class SpecValidator {
  
  async validateAndCorrect(
    specCode: string,
    processedSteps: ProcessedStep[],
    pomMatcher: POMMethodMatcher,
    maxIterations: number = 2
  ): Promise<{ finalCode: string; report: ValidationReport }> {
    
    let currentCode = specCode;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      // Validate
      const report = this.validate(currentCode, processedSteps);
      
      if (report.passed) {
        return { finalCode: currentCode, report };
      }
      
      // Collect auto-fixable violations
      currentCode = this.applyAutoFixes(currentCode, report.violations);
      
      // Collect violations that need Agent 2 re-processing
      const corrections = this.buildCorrectionRequests(report);
      
      if (corrections.length === 0) {
        // Only warnings remain — acceptable
        return { finalCode: currentCode, report };
      }
      
      // Send corrections back to Agent 2
      for (const correction of corrections) {
        const fixedCode = await pomMatcher.correctStep(
          correction.processedStep,
          correction.instruction,
          correction.violation
        );
        currentCode = this.replaceStepCode(
          currentCode, 
          correction.stepIndex, 
          fixedCode
        );
      }
      
      iteration++;
    }
    
    // Max iterations reached — return with remaining violations logged
    const finalReport = this.validate(currentCode, processedSteps);
    return { finalCode: currentCode, report: finalReport };
  }
}
```

#### Feedback Loop — Detailed Flow

```
ITERATION 1:
  SpecValidator.validate(specCode, processedSteps)
    → Found 3 violations:
      [HARD-001] Line 63: sharedPage.locator("#form_office_code...") 
        → CorrectionRequest: { stepIndex: 2, instruction: "Search POM for office code fill method, 
          or search AppSourceIndex for 'office_code' in 'officeform' context" }
      [STEP-001] Step 14 "Accept the alert" has no matching test.step block
        → CorrectionRequest: { stepIndex: 14, instruction: "Generate alert handling code using 
          pages.commonReusables.validateAlert()" }
      [DATA-001] Line 106: enterCustomerRate("500") uses hardcoded value
        → AUTO-FIX: → enterCustomerRate(testData.customerRate)
  
  Apply auto-fixes → DATA-001 fixed inline
  Send HARD-001, STEP-001 back to Agent 2:
    
    POMMethodMatcher.correctStep(step2, "Search for office_code element")
      → AppSourceIndexer.fuzzySearch('office_code', 'officeform')
      → Found: { name: 'office_code', id: 'form_office_code_search', sourceFile: 'officeform.php' }
      → Create POM method: editOfficeInfoPage.fillOfficeCode(value)
      → Return: "await pages.editOfficeInfoPage.fillOfficeCode(testData.officeCode);"
    
    POMMethodMatcher.correctStep(step14, "Generate alert handling")
      → Recognized actionType: 'alert' → maps to commonReusables.validateAlert()
      → Return: "await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED);"

ITERATION 2:
  SpecValidator.validate(correctedCode, processedSteps)
    → 0 hard-blocks, 0 errors, 2 warnings (ASSERT-001, ASSERT-003)
    → report.passed = true (warnings don't block)
  
  → Write to disk ✅
```

#### When feedback loop reaches max iterations

If after 2 iterations there are still hard-block violations:
- The spec is **NOT written to disk**
- A detailed report is logged:
  ```
  ❌ GENERATION BLOCKED for BT-72258: 2 unresolved hard-block violation(s) after 2 correction attempts
     [HARD-001] Line 178: sharedPage.locator("//button[contains(text(),'Upload')]")
       → Agent 2 could not find POM method or app source element
       → Manual action required: Add upload button locator to ViewLoadPage.ts
     [STEP-001] Step 19: "Upload document" — no implementation possible
       → No upload-related POM method or element found
  ```
- The file is saved with a `.draft.spec.ts` extension instead, clearly marking it as incomplete

---

## Integration with Existing Pipeline

### What changes in `CodeGenerator.ts`

The method `generateCodeFromAction` (lines 1154–2776) gets **replaced** by a call to the agents:

```typescript
// BEFORE (current — 1600 lines of if/else)
private async generateCodeFromAction(action: string, testData?: TestData): Promise<string> {
  // 1. Pattern library
  // 2. Compound splitting
  // 3. 1600-line if/else keyword tree
  // 4. LLM fallback
  // 5. generateDirectLocatorCode ← fabricates locators
}

// AFTER (proposed)
private async generateCodeFromAction(action: string, testData?: TestData): Promise<string> {
  // 1. Pattern library (keep — proven patterns from existing specs)
  const pattern = this.patternExtractor.findPattern(action);
  if (pattern) return pattern.code;
  
  // 2. Compound splitting (keep — handles semicolons)
  
  // 3. StepProcessor → POMMethodMatcher (replaces the if/else tree)
  const processed = this.stepProcessor.processStep(stepNumber, action, testData);
  const result = await this.pomMatcher.matchAndGenerate(processed, testData);
  return result.code;
  
  // generateDirectLocatorCode is REMOVED entirely
}
```

### What changes in `PlaywrightAgent.ts`

The `saveScript` method (lines 420–530) gets updated:

```typescript
// BEFORE
async saveScript(script: GeneratedScript): Promise<void> {
  script.content = this.sanitizeGeneratedCode(script.content);
  const { content } = this.selfCheckAndFix(script.content, isMultiApp);
  const issues = this.validateGeneratedCode(content, testCaseId);
  if (issues.length > 0 && llm available) { ... LLM fix attempt ... }
  fs.writeFileSync(outputPath, content);  // ALWAYS writes, even with issues
}

// AFTER
async saveScript(script: GeneratedScript, processedSteps: ProcessedStep[]): Promise<void> {
  // Agent 3: Validate + correct loop
  const { finalCode, report } = await this.specValidator.validateAndCorrect(
    script.content,
    processedSteps,
    this.pomMatcher,
    2  // max iterations
  );
  
  if (report.passed) {
    fs.writeFileSync(outputPath, finalCode);
    console.log(`✅ Generated: ${testCaseId}.spec.ts (${report.summary.stepsImplemented}/${report.summary.stepsTotal} steps)`);
  } else {
    // Save as draft — NOT a production spec
    fs.writeFileSync(outputPath.replace('.spec.ts', '.draft.spec.ts'), finalCode);
    console.log(`⚠️ Draft saved: ${testCaseId}.draft.spec.ts — ${report.summary.hardBlocks} unresolved violation(s)`);
    for (const v of report.violations.filter(v => v.severity === 'hard-block')) {
      console.log(`   ❌ ${v.ruleId}: ${v.message}`);
    }
  }
}
```

### What stays unchanged

| Component | Status | Reason |
|-----------|--------|--------|
| `TestCaseParser` | Unchanged | Step parsing is working well |
| `TestPatternExtractor` | Unchanged | Pattern reuse from existing specs is valuable |
| `PageObjectScanner` | Unchanged | Already indexes all POM methods |
| `PageObjectWriter` | Unchanged | Already writes locators + methods to POM files |
| `LLMService` | Reduced role | Only used for complex multi-step logic that can't be decomposed |
| `FormStepGrouper` | Unchanged | Composite step grouping is independent |
| `ReferenceSpecAnalyzer` | Unchanged | Cloning from similar specs is independent |

### What gets removed

| Component | Reason |
|-----------|--------|
| `generateDirectLocatorCode` (CodeGenerator.ts:2782–2874) | Source of fabricated locators |
| Self-check Fix 6 (PlaywrightAgent.ts:1004–1059) | Source of fabricated locators in self-check |
| 1600-line if/else tree in `generateCodeFromAction` | Replaced by StepProcessor + POMMethodMatcher |
| `validatePostGenerationGuardrails` (CodeGenerator.ts:3687–4475) | Consolidated into SpecValidator |
| `selfCheckAndFix` (PlaywrightAgent.ts:892–1340) | Consolidated into SpecValidator |
| `validateGeneratedCode` (PlaywrightAgent.ts:678–884) | Consolidated into SpecValidator |

### What gets consolidated

All 33 guardrails from `validatePostGenerationGuardrails`, 17 fixes from `selfCheckAndFix`, and 20+ checks from `validateGeneratedCode` are consolidated into SpecValidator's 6 categories with clear severity levels:

| Old location | Count | → New SpecValidator category |
|-------------|-------|------------------------------|
| Guardrails #1–4 (constants) | 4 | DATA-002, DATA-003, HARD-006 |
| Guardrails #5 (fabricated IDs) | 1 | HARD-003 |
| Guardrails #6–7 (login, customer) | 2 | DATA-005, AUTO-FIX |
| Guardrails #8 (POM method exists) | 1 | POM-003, POM-004 |
| Guardrails #9–10 (inline locator→POM) | 2 | HARD-001 |
| Guardrails #11–14 (XPath/evaluate/locator) | 4 | HARD-001, HARD-002 |
| Guardrails #15–16 (waits/paths) | 2 | HARD-005, AUTO-FIX |
| Guardrails #17–18 (require/hardcoded) | 2 | POM-005, DATA-001 |
| Guardrails #19 (console.log cleanup) | 1 | AUTO-FIX |
| Guardrails #20 (constant refs) | 1 | DATA-002/DATA-003 |
| Guardrails #21 (business logic) | 1 | POM-002 |
| Guardrails #22 (wrong getter) | 1 | POM-003 |
| Guardrails #23–33 (misc) | 11 | Distributed across categories |
| Self-check Fix 1–17 | 17 | Distributed (Fix 6 DELETED) |
| validateGeneratedCode checks | 20+ | STRUCT-001 through STRUCT-006 |

---

## New File Summary

| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `src/agent/services/RepoCloneManager.ts` | ~150 | Auto-clones/pulls app repos from GitHub into local cache |
| `src/agent/analyzers/AppSourceIndexer.ts` | ~450 | Scans PHP/Twig for HTML elements, builds searchable index with stability scores |
| `src/agent/analyzers/StepProcessor.ts` | ~300 | Classifies steps, extracts entities, tracks cross-step page context (Agent 1) |
| `src/agent/generators/POMMethodMatcher.ts` | ~400 | Matches steps to POM methods or creates new ones with session cache (Agent 2) |
| `src/agent/validators/SpecValidator.ts` | ~550 | Validates spec, enforces guardrails, batched corrections, feedback loop (Agent 3) |
| `src/agent/config/StepMappings.ts` | ~300 | Declarative mapping table extracted from the if/else tree (~200 entries) |
| `src/agent/config/AgentConfig.ts` | +30 | New `appSourceRepos` config, cache settings, refresh policies |
| `src/agent/generators/CodeGenerator.ts` | -1600, +50 | Remove if/else tree, wire in new agents |
| `src/agent/PlaywrightAgent.ts` | -700, +50 | Remove selfCheckAndFix/validateGeneratedCode, wire in SpecValidator |
| `src/agent/analyzers/PageObjectScanner.ts` | +40 | Add method body analysis: referencedLocators, actionVerbs extraction |
| `.gitignore` | +1 | Add `src/agent/.cache/` |

---

## Execution Flow Example

**Test case:** BT-72258 (22 steps)

### Current behavior (broken)

```
Step 2: "Enter the office code as GA-LE790 and click Search"
  → No keyword match → LLM fails → generateDirectLocatorCode
  → sharedPage.locator("#form_office_code, #office_code, [name='office_code']").first()
  → FABRICATED — #form_office_code doesn't exist

Step 14: "Accept the alert by clicking OK"
  → LLM fails → placeholder step (waitForAllLoadStates only)
  → selfCheckAndFix Fix 6 regenerates:
    sharedPage.locator("//button[contains(text(),'Accept the alert by ing OK.')]")
  → FABRICATED — absurd locator

Post-generation: Guardrail #13 detects 8 violations → logs warning → writes file anyway
Result: 8 fabricated locators, 3 placeholder steps, file written to disk ❌
```

### Proposed behavior (correct)

```
AGENT 1 (StepProcessor):
  Step 2 → { actionType: 'fill', targetField: 'office_code', targetValue: 'GA-LE790' }
  Step 14 → { actionType: 'alert', alertPattern: 'accept_ok' }

AGENT 2 (POMMethodMatcher):
  Step 2 Phase A → editOfficeInfoPage.fillOfficeCode exists → emit POM call
  Step 14 Phase A → commonReusables.validateAlert exists → emit POM call with ALERT_PATTERNS

AGENT 3 (SpecValidator) — Iteration 1:
  ✅ Step coverage: 22/22 steps have code
  ✅ HARD-001: Zero sharedPage.locator() calls
  ✅ POM-001: All interactions via pages.<getter>.<method>()
  ⚠️ DATA-001: enterCustomerRate("500") → AUTO-FIX to testData.customerRate
  ⚠️ ASSERT-001: toBeTruthy() on value check → WARNING logged
  
  report.passed = true (only warnings remain)
  → Write to disk ✅

Result: 22 valid POM calls, 0 fabricated locators, all steps covered ✅
```

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| App source not available on CI/teammate machines | RepoCloneManager auto-clones from GitHub; only needs git credentials (already configured for CI) |
| App source index may be stale if PHP/Twig files change | RepoCloneManager auto-pulls every 24h; `--force-refresh` flag available for immediate update |
| Git clone is slow on first run | `--depth 1` shallow clone (~35s for mono); cached after first run; subsequent pulls ~2-5s |
| Git credentials missing or network unavailable | Graceful degradation: use stale cache if exists, skip Phase B if no cache, log warning |
| Some elements are dynamically generated (PHP loops with index) | Index captures patterns with `{$idx}` markers; matcher uses the base pattern |
| AppSourceIndexer regex can't parse every PHP echo pattern | Start with the 5 most common patterns (covers ~90%); add patterns as gaps are found |
| New POM methods may collide with existing ones | PageObjectWriter already checks for duplicates |
| StepProcessor misclassifies a step | Agent 3 catches misclassification through step coverage check |
| Feedback loop oscillates (fix creates new violation) | Max 2 iterations; each iteration tracks which violations were addressed |
| Agent 3 is too strict — blocks valid specs | Severity levels: only `hard-block` prevents writing; `error`+`warning` log but allow `.spec.ts` |
| Consolidating 70+ checks into SpecValidator is complex | Phased migration: start with the 6 hard-block rules, add remaining checks incrementally |

---

## Implementation Order

| Phase | Work | Depends On |
|-------|------|------------|
| **Phase 0** | `RepoCloneManager` — auto-clone/pull from GitHub, cache management | Nothing (standalone) |
| **Phase 1** | `AppSourceIndexer` — scan, index, cache, search | Phase 0 (needs cloned repos) |
| **Phase 2** | `StepProcessor` — classify + extract entities | Nothing (standalone, can run in parallel with Phase 0–1) |
| **Phase 3** | `POMMethodMatcher` — Phase A (POM search) | Phase 2 + existing PageObjectScanner |
| **Phase 4** | `POMMethodMatcher` — Phase B (app source + new POM) | Phase 1 + Phase 3 + existing PageObjectWriter |
| **Phase 5** | `SpecValidator` — validation rules + auto-fixes | Phase 2 (needs ProcessedStep[]) |
| **Phase 6** | `SpecValidator` — feedback loop + CorrectionRequest | Phase 3 + Phase 5 |
| **Phase 7** | Wire into `CodeGenerator` + `PlaywrightAgent` | Phases 4 + 6 |
| **Phase 8** | Remove old code: if/else tree, generateDirectLocatorCode, selfCheckAndFix, validateGeneratedCode, validatePostGenerationGuardrails | Phase 7 |
| **Phase 9** | Test with BT-72258, DFB-97746, BT-67846 test cases | All phases |

---

## Architectural Improvements (Post-Review)

The following 8 improvements were identified during architecture review and are incorporated into this proposal.

---

### Improvement 1: Extract if/else tree into a declarative mapping table

**Problem:** The 1,600-line heuristic tree in `generateCodeFromAction` contains hard-won domain knowledge (e.g., "Accept the alert" → `commonReusables.validateAlert()`). Deleting it and relying purely on scoring risks losing non-obvious mappings.

**Solution:** Extract into a structured mapping table that Agent 2 checks as a **first pass** before scoring:

**File:** `src/agent/config/StepMappings.ts`

```typescript
interface StepMapping {
  pattern: RegExp;
  pageObject: string;
  method: string;
  args?: string[];             // '$1' for regex capture groups, 'testData.*', constants
  requiresContext?: string;    // Only match if current page context matches
  confidence: number;          // How confident is this mapping (0.0–1.0)
}

const STEP_MAPPINGS: StepMapping[] = [
  { pattern: /click.*save/i, pageObject: 'editLoadFormPage', method: 'clickOnSaveBtn', confidence: 0.95 },
  { pattern: /accept.*alert/i, pageObject: 'commonReusables', method: 'validateAlert',
    args: ['sharedPage', 'ALERT_PATTERNS.*'], confidence: 0.90 },
  { pattern: /hover.*over.*header.*?(\w[\w\s]*)/i, pageObject: 'basePage', method: 'hoverOverHeaderByText',
    args: ['$1'], confidence: 0.95 },
  { pattern: /click.*sub.?header.*?(\w[\w\s]*)/i, pageObject: 'basePage', method: 'clickSubHeaderByText',
    args: ['$1'], confidence: 0.95 },
  { pattern: /switch.*to.*tnx/i, pageObject: 'appManager', method: 'switchToTNX', confidence: 1.0 },
  { pattern: /switch.*to.*dme/i, pageObject: 'appManager', method: 'switchToDME', confidence: 1.0 },
  // ... ~200 entries extracted from the current if/else tree
];
```

**Agent 2 Phase A priority order becomes:**
1. Check `StepMappings` (declarative table) — instant, highest confidence
2. Check existing POM method index (scoring algorithm) — fast, medium confidence
3. Check session-created methods cache — fast, high confidence
4. → Phase B (app source search) only if all above fail

---

### Improvement 2: Cross-step context tracking in Agent 1

**Problem:** Steps don't exist in isolation. Step 5 "Navigate to Carrier tab" changes the page context for Step 6 "Enter carrier rate." Without context, Agent 2 searches the entire POM/app index instead of narrowing to the relevant page.

**Solution:** Agent 1 maintains a running `PageContext` that propagates across steps:

```typescript
interface PageContext {
  currentApp: 'btms' | 'dme' | 'tnx';
  currentPage: string;        // 'loadform', 'carrform', 'billing', 'officeform', 'custform'
  currentTab: string;         // 'GENERAL', 'CARRIER', 'PICK', 'DROP', 'BILLING', etc.
  isEditMode: boolean;
  currentForm: string;        // 'fatsform', 'carr_form', 'custform'
}

class StepProcessor {
  processAllSteps(steps: TestStep[], testData?: TestData): {
    processedSteps: ProcessedStep[];
    contextPerStep: PageContext[];
  } {
    let ctx: PageContext = { currentApp: 'btms', currentPage: 'home', currentTab: 'GENERAL',
                             isEditMode: false, currentForm: '' };
    const results = [];
    for (const step of steps) {
      const processed = this.processStep(step, ctx);
      ctx = this.updateContext(ctx, processed);  // e.g., tab-click updates currentTab
      results.push({ processed, context: { ...ctx } });
    }
    return results;
  }
}
```

**Context update rules:**
- `login` → `currentApp: 'btms'`, `currentPage: 'home'`
- `navigate` to Carrier header → `currentPage: 'carrform'`
- `tab-click` to PICK → `currentTab: 'PICK'`
- `switch-app` to TNX → `currentApp: 'tnx'`
- `save` → `isEditMode: false` (typically returns to view mode)

This context flows into Agent 2, which uses `currentPage` and `currentTab` to narrow both POM search and AppSourceIndexer search.

---

### Improvement 3: Method body analysis in POM index

**Problem:** The proposed scoring only looks at method names and parameter signatures. But POM method bodies contain locators that reveal exactly which element they interact with. For example, `EditLoadCarrierTabPage.enterCarrierRate()` contains `#carr_1_rate` in its body — far more informative than the method name.

**Solution:** Extend `PageObjectScanner` to extract referenced locator IDs from method bodies:

```typescript
interface EnrichedMethodInfo {
  name: string;
  parameters: string;
  returnType: string;
  body: string;
  // NEW fields:
  referencedLocators: string[];  // e.g., ["#carr_1_rate", "#form_shipper_ship_point"]
  actionVerbs: string[];         // e.g., ["fill", "click", "selectOption"] — extracted from body
  targetElementIds: string[];    // Union of constructor locator IDs used in this method
}
```

**Extraction:** When `PageObjectScanner.parseMethods()` reads a method body, it also:
1. Finds all `this.<name>_LOC` references → maps to the constructor locator selector
2. Extracts action verbs: `.fill(`, `.click(`, `.selectOption(`, `.check(`, etc.
3. Stores these as part of the method metadata

**Scoring impact:** Agent 2 Phase A can now match:
- `targetField: 'carrier_rate'` against `referencedLocators: ['#carr_1_rate']` → strong signal
- `actionType: 'fill'` against `actionVerbs: ['fill']` → confirms method intent

---

### Improvement 4: Session-scoped method creation cache

**Problem:** If Agent 2 creates a new POM method `enterActualTime` for Step 10, and Step 15 also needs to enter the actual time, Agent 2 would create a duplicate without a session cache.

**Solution:** Add an in-session registry to POMMethodMatcher:

```typescript
class POMMethodMatcher {
  private sessionCreatedMethods = new Map<string, MatchResult>();

  async matchAndGenerate(step: ProcessedStep, context: PageContext, ...): Promise<MatchResult> {
    // 1. Check session cache (methods created earlier in this test case)
    const cacheKey = `${step.actionType}:${step.targetField}:${context.currentPage}`;
    if (this.sessionCreatedMethods.has(cacheKey)) {
      return this.sessionCreatedMethods.get(cacheKey)!;
    }

    // 2. Phase A: StepMappings → POM index search
    // 3. Phase B: App source search → create new method
    // 4. Phase C: TODO

    // After Phase B creates a new method, cache it:
    if (result.type === 'new-pom') {
      this.sessionCreatedMethods.set(cacheKey, result);
    }
    return result;
  }

  resetSession(): void { this.sessionCreatedMethods.clear(); }
}
```

---

### Improvement 5: Locator stability scoring in AppSourceIndexer

**Problem:** Not all locators from app source are equally stable. `id="form_agent_login"` is safe; `id="billing_alert{$idx}"` is dynamic; `class="js-select-custom-html"` may change.

**Solution:** Score each `AppElement` for locator stability:

```typescript
interface AppElement {
  // ...existing fields...
  stabilityScore: number;     // 0.0–1.0
  stabilityReason: string;    // "static id", "dynamic index", "behavioral class"
}
```

**Scoring rules:**

| Pattern | Score | Reason |
|---------|-------|--------|
| Static `id` (no PHP variable) | 1.0 | Unique, stable |
| `name` attribute (POST field) | 0.9 | Rarely changes (server-side contract) |
| `id` with PHP variable (`{$idx}`, `{$id}`) | 0.5 | Dynamic, may not be unique |
| `class` only (no id/name) | 0.3 | Styling classes change frequently |
| Text content only | 0.2 | Most fragile, locale-dependent |

Agent 2 Phase B prefers elements with `stabilityScore ≥ 0.7`. If only low-stability elements are found, the generated POM method includes a `// WARNING: Low-stability locator` comment, and Agent 3 reports it as a warning.

---

### Improvement 6: Preview/dry-run for NEW POM method proposals

**Problem:** Agent 2 Phase B writes new POM methods directly to existing POM files. This is risky — a wrong locator or method name pollutes the POM without developer review.

**Constraint (per user):** Preview only triggers after Phase A has exhaustively searched ALL existing POM methods and confirmed no match exists. If any existing POM method can be used, it must be used — no new method is proposed.

**Solution:** Extend the existing `--preview` flag to include POM change proposals:

```
$ npm run agent -- --preview

📋 BT-72258 Generation Preview:

  Steps using existing POM methods: 18/22 ✅
  ├── Step 1:  pages.btmsLoginPage.BTMSLogin(userSetup.globalUser)
  ├── Step 2:  pages.editOfficeInfoPage.fillOfficeCode(testData.officeCode)
  ├── ...
  
  Steps needing NEW POM methods: 3/22 ⚠️ (no existing POM method found)
  ├── Step 10: EditLoadPickTabPage.enterPickActualTime(value: string)
  │   ├── POM search: 0 matches above threshold (best: 0.35)
  │   ├── App source: [name="pick_actual_time"] in loadform.php:4892
  │   └── Stability: 0.9 (static name attribute)
  ├── Step 19: ViewLoadPage.clickUploadDocumentIcon()
  │   ├── POM search: 0 matches above threshold (best: 0.28)
  │   ├── App source: img[title='Upload document'] in loadform.php:6120
  │   └── Stability: 0.8 (static title attribute)
  └── Step 22: LoadBillingPage.clickViewBillingLink()
      ├── POM search: 0 matches above threshold (best: 0.40)
      ├── App source: #view_billing_btn in billing.php:234
      └── Stability: 1.0 (static id)

  Steps marked as TODO: 1/22 ❓
  └── Step 14: "Accept custom dialog" — no element found in app source

  [P]roceed / [S]kip new POM / [E]dit proposals / [C]ancel?
```

In `--batch` mode (non-interactive), POM proposals are auto-accepted but logged for post-run review.

---

### Improvement 7: Batch corrections in Agent 3

**Problem:** If 3 steps on the same page all have `sharedPage.locator()` violations, sending 3 individual CorrectionRequests triggers 3 separate AppSourceIndex searches for the same page context.

**Solution:** Agent 3 groups corrections by page context and sends batch requests:

```typescript
interface BatchCorrectionRequest {
  pageContext: PageContext;
  corrections: CorrectionRequest[];
}

// Agent 3 groups before sending to Agent 2:
const grouped = groupBy(corrections, c => c.processedStep.targetPage);
for (const [page, batch] of grouped) {
  const results = await pomMatcher.correctBatch(batch);
  // Apply all results at once
}
```

Agent 2 searches AppSourceIndex once per page and resolves all corrections for that page together, potentially sharing locators across steps.

---

### Improvement 8: Commit pinning for repo cache

**Problem:** 24-hour cache refresh is arbitrary. Application source may not change for weeks. Also, if a PHP file changes between two runs, generation results differ — non-reproducible.

**Solution:** Support commit pinning and configurable refresh policies:

```typescript
interface RepoConfig {
  // ...existing fields...
  pinToCommit?: string;         // Optional: pin to specific commit for reproducibility
  refreshPolicy: 'on-demand' | 'daily' | 'weekly' | 'startup';  // Default: 'weekly'
}
```

CLI flags:
- `npm run agent -- --refresh-sources` — force-pull all repos regardless of policy
- `npm run agent -- --pin-sources` — record current commit hashes for reproducibility

---

## What This Does NOT Change

- **Test case parsing** (TestCaseParser) — stays the same
- **CSV data management** — stays the same
- **Reference spec cloning** (ReferenceSpecAnalyzer) — stays the same
- **Multi-app support** (MultiAppManager) — stays the same
- **Reporting** (Allure, Testmo) — stays the same
- **Existing hand-written specs** — untouched
- **Existing POM files** — only additive changes (new methods via PageObjectWriter)

---

## Success Criteria

1. **Zero `sharedPage.locator()` calls** in any generated `.spec.ts` file
2. **Every generated locator** traces back to a real element in Monotrans/DME source (verified via AppSourceIndex)
3. **100% step coverage** — every test step has corresponding code or an explicit TODO with reason
4. **BT-72258 re-generation** produces valid POM calls for all 22 steps (vs. 8 fabricated locators currently)
5. **No regression** — DFB-97746, DFB-97739, BT-67846 re-generation produces identical or better output
6. **Blocked specs save as `.draft.spec.ts`** — never ship a broken spec as production
7. **Generation time** stays under 90 seconds per test case (including up to 2 validation iterations)
8. **Feedback loop converges** — 95%+ of specs pass after ≤ 1 correction iteration
9. **Existing POM reuse rate** — ≥ 80% of steps resolved via existing POM methods (Phase A), ≤ 20% need new methods (Phase B)
10. **New POM methods only when no existing POM can be used** — Agent 2 Phase B only triggers after exhaustive Phase A search confirms zero matches above threshold across all POM classes
11. **Locator stability** — all generated locators have stability score ≥ 0.7; lower-stability locators flagged as warnings
12. **Declarative mappings cover 90%+ of common step patterns** — extracted from the existing if/else tree
