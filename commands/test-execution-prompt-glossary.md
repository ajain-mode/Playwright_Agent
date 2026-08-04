# Test execution prompt glossary (command → agent prompt)

Maps **short commands** to the **full prompts** the AI agent must follow when generating and/or executing Playwright specs. Goal: run each targeted case **until it passes** (or hits a defined stop / park rule).

**Cursor Project Commands** (type `/` in Agent chat):

| Slash command | File |
|---------------|------|
| `/run-until-pass` (`/rup`) | `.cursor/commands/run-until-pass.md` |
| `/generate-and-pass` (`/gap`) | `.cursor/commands/generate-and-pass.md` |
| `/execute-until-pass` (`/eup`) | `.cursor/commands/execute-until-pass.md` |
| `/batch-until-pass` (`/bup`) | `.cursor/commands/batch-until-pass.md` |
| `/rerun-failed` (`/rrf`) | `.cursor/commands/rerun-failed.md` |
| `/park-case` (`/park`) | `.cursor/commands/park-case.md` |
| `/testmo-gap-report` | `.cursor/commands/testmo-gap-report.md` → `commands/testmo-to-agent-testcase-format.md` |

Companion docs:
- Format / gap analysis: `commands/testmo-to-agent-testcase-format.md`
- Per-case run artifacts: `commands/reports/execution/`
- Guardrails: `.cursor/rules/agent-architecture.mdc`, `CLAUDE.md`

---

## Approach (how to use this file)

1. **Prefer slash commands** — type `/run-until-pass 25272` (or `/rup`, `/bup`, …) in Cursor Agent chat; `$ARGUMENTS` is injected into the matching `.cursor/commands/*.md` SOP.
2. Use this glossary as the shared reference for the until-pass loop, combinations matrix, and artifact templates.
3. The agent follows the [Until-pass loop](#until-pass-loop-mandatory) and writes artifacts under `commands/reports/execution/`.

**Design principles**

| Principle | Why |
|-----------|-----|
| Command is short; prompt is complete | Humans type `/run-until-pass 25272`; the agent gets full SOPs |
| One case = one green gate | Multi-case flows still finish **each** ID before moving on |
| Fix code, don’t mask flakes | Prefer POM/spec/data fixes over raising Playwright `--retries` |
| Park when blocked | Environment / product blockers stop the loop with `MANUAL_REVIEW.md` |
| No Testmo submit by default | Match existing execution queue: green Playwright only unless asked |

---

## What to include (recommended contents)

| Section | Include? | Purpose |
|---------|----------|---------|
| Command index + aliases | **Yes** | Discoverability |
| Argument grammar | **Yes** | Consistent parsing (`SCOPE`, `MODE`, flags) |
| Expanded prompts (copy-paste) | **Yes** | Single source of truth for agent behavior |
| Single vs multi combinations | **Yes** | Batch / CSV / tag / folder variants |
| Until-pass loop + stop rules | **Yes** | Prevent infinite fix loops |
| Shell recipes (`npx playwright test …`) | **Yes** | Exact re-run commands |
| Artifact layout | **Yes** | Logs, MANUAL_REVIEW, INDEX |
| Category-specific addenda | Optional | e.g. billingtoggle user switch |
| Generate-only / execute-only / analyze-only modes | Optional | Split pipeline stages |
| Cursor Project Commands | **Done** | `.cursor/commands/*.md` + short aliases |
| Max attempts / time budget | Optional | Cap agent spend per case |
| Parallel vs serial batch policy | Optional | This repo uses `workers: 1` — keep serial |

---

## Argument grammar

Parse user input after the command name as space-separated tokens:

```
COMMAND   = /run-until-pass | /generate-and-pass | /execute-until-pass | …
SCOPE     = CASE_ID | CASE_ID,CASE_ID,… | @tag | path/to.csv | folder:<category>
MODE      = full | generate | execute | analyze   (default: full)
FLAGS     = --max-attempts=N  --park-on-env  --no-fix  --headed  --allure
```

| Token | Examples | Meaning |
|-------|----------|---------|
| Single ID | `25272`, `EDI-25272`, `BT-74454` | One case |
| ID list | `25272,86918,336260` | Ordered multi-case |
| Tag | `@billingtoggle`, `@edi` | All matching specs under `src/tests/AIAgent/` |
| CSV | `src/agent/examples/enriched_test_cases_5_expectedresult.csv` | Cases listed in file |
| Folder | `folder:edi` | All specs in `src/tests/AIAgent/edi/` |
| `full` | (default) | Resolve source → generate/adapt if needed → execute → fix until pass |
| `generate` | | Agent pipeline only (no Playwright run) |
| `execute` | | Run existing spec only (no regenerate) |
| `analyze` | | Map steps / gaps only (no write / no run) |

Echo at start:

```text
[<command>] scope=<SCOPE> mode=<MODE> flags=<FLAGS>
```

---

## Command index

| Command | Alias | Default mode | When to use |
|---------|-------|--------------|-------------|
| `/run-until-pass` | `/rup` | `full` | End-to-end: ensure spec exists, run, fix until green |
| `/generate-and-pass` | `/gap` | `full` | Force agent pipeline generation, then until-pass |
| `/execute-until-pass` | `/eup` | `execute` | Spec already exists; run + fix only |
| `/batch-until-pass` | `/bup` | `full` | Multiple IDs / CSV — **serial**, one green gate each |
| `/rerun-failed` | `/rrf` | `execute` | Re-run last failed case(s) from `test-results` / last report |
| `/park-case` | `/park` | — | Stop loop; write MANUAL_REVIEW with blocker |

---

## Until-pass loop (mandatory)

For **each** case in scope, repeat until **GREEN** or **PARKED**:

```text
1. RESOLVE
   - Find Case ID in sample-testcases.csv / supplied CSV / existing spec path
   - Locate or create category CSV row under src/data/<category>/
   - Resolve spec path: src/tests/AIAgent/<category>/<PREFIX>-<ID>.spec.ts

2. PREPARE (skip if mode=execute and spec exists)
   - Prefer agent pipeline: npm run agent:generate / agent:file / agent:batch
   - Align steps to sample-testcases.csv + guardrails
   - Add POM methods only with @author AI Agent + app-source locators

3. EXECUTE
   npx playwright test <spec> --reporter=list --retries=0
   (Do not raise retries to hide failures; fix root cause)

4. DIAGNOSE (on failure)
   - Read failure message, screenshot, trace under test-results/
   - Classify: locator | assertion | data | navigation | env/product | flake
   - Apply minimal fix (spec / AI-authored POM / CSV data)
   - Respect: no locators in specs, no hardcoded assertion strings, POM authorship rules

5. RE-EXECUTE → back to step 3

6. STOP / PARK when any of:
   - Pass (exit 0) → GREEN
   - Attempts ≥ --max-attempts (default 5) → PARKED
   - Clear env/product blocker (e.g. third-party no rates) → PARKED
   - User says stop → PARKED / STOPPED

7. ARTIFACTS
   - commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md
   - commands/reports/execution/_run_<CASE_ID>.log (optional)
   - Update commands/reports/execution/INDEX.md status row when batching
```

**Pass criteria:** Playwright exit code `0` for the targeted spec(s). Do **not** submit to Testmo unless the user explicitly asks.

---

## Shell recipes

```bash
# Single known spec
npx playwright test src/tests/AIAgent/edi/EDI-25272.spec.ts --reporter=list --retries=0

# Multiple specs (serial — prefer one at a time in until-pass loops)
npx playwright test src/tests/AIAgent/edi/EDI-25272.spec.ts src/tests/AIAgent/edi/EDI-86918.spec.ts --reporter=list --retries=0

# Category folder
npx playwright test src/tests/AIAgent/billingtoggle/ --reporter=list --retries=0

# By title / grep (use carefully — may match helpers)
npx playwright test src/tests/AIAgent/ --grep "25272" --reporter=list --retries=0

# Agent unit tests (not product E2E)
npx playwright test src/agent/__tests__/

# Allure (optional; slower)
npm run test:allure
```

Agent generation (when mode includes generate):

```bash
npm run agent:generate -- --file src/agent/examples/<file>.csv
npm run agent:batch -- --file src/agent/examples/<file>.csv
npm run agent:analyze -- --file src/agent/examples/<file>.csv
```

---

## Expanded prompts

Copy the block for the command you invoked. Replace `{…}` placeholders.

### 1) `/run-until-pass` — single case

**Trigger examples**

```text
/run-until-pass 25272
/run-until-pass EDI-86918 mode=execute
/rup BT-74454 --max-attempts=8
```

**Expanded prompt**

```text
Command: /run-until-pass
Scope: {CASE_ID}
Mode: {MODE=full}

1. Resolve case {CASE_ID} from src/agent/examples/sample-testcases.csv (or the CSV I named).
   Read Test Steps + Expected as source of truth. Load runtime data from src/data/<category>/.
2. If mode is full or generate: run the Agent pipeline to create/update
   src/tests/AIAgent/<category>/<PREFIX>-{CASE_ID}.spec.ts. Follow guardrails in
   .cursor/rules/agent-architecture.mdc (navigateToBaseUrl rules, no locators in specs,
   constants for assertions, billingtoggle user switch if category=billingtoggle, etc.).
3. If a suitable spec already exists and mode=execute, skip generation.
4. Execute with:
   npx playwright test <spec-path> --reporter=list --retries=0
5. On failure: diagnose, apply minimal fixes (spec / AI-authored POM / CSV), re-run.
   Repeat until PASS or PARK (max attempts = {N=5}).
6. Write commands/reports/execution/{CASE_ID}/MANUAL_REVIEW.md with status GREEN or PARKED,
   fixes applied, and the exact re-run command.
7. Ask clarifying questions only if Case ID, category, or preconditions are ambiguous.
   Do not submit results to Testmo unless I ask.
```

---

### 2) `/generate-and-pass` — single case (force pipeline)

**Trigger examples**

```text
/generate-and-pass 25273
/gap 336260 from src/agent/examples/enriched_test_cases_5_expectedresult.csv
```

**Expanded prompt**

```text
Command: /generate-and-pass
Scope: {CASE_ID}
Source: {CSV_PATH or sample-testcases.csv}

1. Read the case row (steps + expected). Prefer agent CLI generation over hand-writing the whole spec.
2. Generate/adapt the spec via the 3-agent pipeline; align POMs; add only AI Agent–authored POM methods
   with locators looked up from src/agent/.cache/ app source.
3. Execute until pass using the Until-pass loop (retries=0 on Playwright; fix root causes).
4. Preserve nested test.step titles that map to CSV step numbers / expected text.
5. Artifacts + MANUAL_REVIEW as in /run-until-pass.
```

---

### 3) `/execute-until-pass` — existing spec only

**Trigger examples**

```text
/execute-until-pass src/tests/AIAgent/custom/TC-336260.spec.ts
/eup 349979
```

**Expanded prompt**

```text
Command: /execute-until-pass
Scope: {CASE_ID or SPEC_PATH}
Mode: execute

1. Do not regenerate the spec unless it fails to compile or is missing required imports.
2. Run npx playwright test <spec> --reporter=list --retries=0.
3. Fix failures (prefer POM/spec/data). Re-run until PASS or PARK.
4. Update MANUAL_REVIEW.md for this case.
```

---

### 4) `/batch-until-pass` — multiple cases (serial)

**Trigger examples**

```text
/batch-until-pass 25272,86918,336260,349979
/bup src/agent/examples/enriched_test_cases_5_expectedresult.csv
/batch-until-pass folder:edi mode=execute
/bup @billingtoggle --max-attempts=5
```

**Expanded prompt**

```text
Command: /batch-until-pass
Scope: {ID_LIST | CSV_PATH | folder:… | @tag}
Mode: {MODE=full}

1. Build an ordered work list of Case IDs (from list, CSV rows, folder specs, or tag).
2. Process ONE case at a time (serial). Do not start case N+1 until case N is GREEN or PARKED.
3. For each case, run the /run-until-pass expanded prompt (or /execute-until-pass if mode=execute).
4. Skip generation when a correct existing spec already covers the case (confirm with me only if
   duplicate Case IDs / overlapping coverage is unclear).
5. Maintain a batch summary:
   - commands/reports/execution/_batch_summary.md
   - update INDEX.md rows (GREEN / PARKED / IN PROGRESS)
6. Final reply: table of Case ID → status → spec path → blocker (if any).
```

---

### 5) Combinations matrix

| Intent | Command | Scope example | Mode |
|--------|---------|---------------|------|
| One case, generate + run to green | `/generate-and-pass` | `25272` | `full` |
| One case, run existing to green | `/execute-until-pass` | `TC-336260.spec.ts` | `execute` |
| One case, smart full path | `/run-until-pass` | `BT-74454` | `full` |
| Several IDs, serial to green | `/batch-until-pass` | `25272,86918,336260` | `full` |
| CSV cohort to green | `/batch-until-pass` | `…/enriched_….csv` | `full` |
| Whole category, run only | `/batch-until-pass` | `folder:edi` | `execute` |
| Tag cohort | `/batch-until-pass` | `@AIAgent` / `@edi` | `execute` |
| Analyze only (no run) | `/run-until-pass` | `27450` | `analyze` |
| Cap fix loops | any | `… --max-attempts=3` | — |
| Stop & document blocker | `/park-case` | `366505 reason=…` | — |

---

### 6) `/rerun-failed`

**Trigger examples**

```text
/rerun-failed
/rrf last
```

**Expanded prompt**

```text
Command: /rerun-failed

1. Inspect test-results/.last-run.json and recent commands/reports/execution/_batch_summary.md
   (or the last failure in this chat) to identify failed Case IDs / specs.
2. For each failed case, run /execute-until-pass.
3. Report which recovered to GREEN vs remain PARKED.
```

---

### 7) `/park-case`

**Trigger examples**

```text
/park-case 366505 reason="Banyan returned no rates on stage"
```

**Expanded prompt**

```text
Command: /park-case
Scope: {CASE_ID}
Reason: {REASON}

1. Stop the until-pass loop for this case.
2. Write/update commands/reports/execution/{CASE_ID}/MANUAL_REVIEW.md with status PARKED,
   last command run, error synopsis, and manual unblockers.
3. Mark INDEX.md / _batch_summary.md accordingly. Continue other batch cases if any remain.
```

---

## Category addenda (append to expanded prompt when relevant)

### billingtoggle

```text
After BTMSLogin, switch to USER_ROLES.BILLINGTOGGLE_USER.
Use ViewLoadPage for Waiting On on View Load; LoadBillingPage after View Billing.
Reference: src/tests/AIAgent/billingtoggle/BT-74454.spec.ts.
```

### dfb / multi-app

```text
Map BTMS precondition bands to POMs (setupOfficePreConditions for office slice).
Use MultiAppManager for TNX/DME switches. Reference: DFB-97739.spec.ts.
```

### edi

```text
Prefer existing EDI prefs / change-order helpers when overlapping cases exist
(e.g. 25273 vs 25272). Confirm before duplicating coverage.
```

### custom / home / office

```text
May land under src/tests/AIAgent/custom/ with TC- prefix.
Look up report/office field locators in app source cache before adding POM methods.
```

---

## Artifact template (`MANUAL_REVIEW.md`)

```markdown
# {GREEN|PARKED} — Case {CASE_ID}

**Status:** …
**Spec:** `src/tests/AIAgent/...`
**Attempts:** n
**Last run:** YYYY-MM-DD

## Fixes applied
1. …

## Blocker (if PARKED)
…

## Re-run
```bash
npx playwright test <spec> --reporter=list --retries=0
```
```

---

## Suggested next steps (optional hardening)

1. ~~**Promote to Cursor Project Commands**~~ — done under `.cursor/commands/` (including `/testmo-gap-report` pointer).
2. **Default `--max-attempts=5`** already in command SOPs; optionally add a project skill that auto-loads this glossary on “run until pass” phrasing.
3. **INDEX auto-update** — small script to mark GREEN/PARKED from Playwright exit codes.
4. **Mode `dry-run`** — resolve paths + print the shell recipe without executing.
5. **Migrate to Agent Skills** — if your Cursor build prefers `.cursor/skills/<name>/SKILL.md` with `disable-model-invocation: true`, run `/migrate-to-skills` or port these command files.

---

## Quick reference card

```text
# Single → green
/run-until-pass 25272

# Force generate → green
/generate-and-pass 336260

# Existing spec → green
/execute-until-pass src/tests/AIAgent/custom/TC-336260.spec.ts

# Multi CSV → each green (serial)
/batch-until-pass src/agent/examples/enriched_test_cases_5_expectedresult.csv

# Multi IDs
/batch-until-pass 25272,86918,336260,349979 --max-attempts=5

# Folder execute-only
/batch-until-pass folder:edi mode=execute
```
