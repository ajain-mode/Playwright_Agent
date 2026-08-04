# /generate-and-pass — force Agent pipeline, then execute until green

Force **generation/adaptation** of a Playwright spec via the 3-agent pipeline for **one** Case ID, then run the until-pass loop until **GREEN** or **PARKED**.

Shared glossary: `commands/test-execution-prompt-glossary.md`  
Guardrails: `.cursor/rules/agent-architecture.mdc`, `CLAUDE.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

```
SCOPE   = first token (REQUIRED) — Case ID
SOURCE  = from <path.csv>   OR second path-like token under src/agent/examples/ or repo root
          (default: src/agent/examples/sample-testcases.csv)
FLAGS   = --max-attempts=N (default 5)  --park-on-env  --headed
```

If `SCOPE` is empty, print usage and stop:

```text
Usage: /generate-and-pass <CASE_ID> [from <csv-path>] [--max-attempts=N]
```

Echo: `[generate-and-pass] scope=<SCOPE> source=<SOURCE> flags=<FLAGS>`

---

## Read first

1. This command file
2. `commands/test-execution-prompt-glossary.md` — Until-pass loop
3. Case row from `SOURCE` (Test Steps + Expected)
4. `src/data/<category>/*.csv` for runtime fields
5. Reference specs in `src/tests/AIAgent/<category>/`
6. App source locators: `src/agent/.cache/` (grep before any new POM locator)

---

## Procedure

1. **READ** the case row. Treat Test Steps + Expected as source of truth.

2. **GENERATE** via Agent pipeline (prefer CLI over hand-writing the whole spec):

   ```bash
   npm run agent:generate -- --file <SOURCE>
   # or agent:file / agent:batch for multi-row files filtered to this Case ID
   ```

   - Align nested `test.step` titles to CSV step numbers / expected text
   - Add POM methods only with `@author AI Agent` + app-source locators
   - Never modify human-authored POM methods/locators

3. **EXECUTE until pass** — same loop as `/run-until-pass` (`mode=full` after generate):

   ```bash
   npx playwright test <spec-path> --reporter=list --retries=0
   ```

   Diagnose → minimal fix → re-run until GREEN or PARKED (`--max-attempts`).

4. **ARTIFACTS** — `commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md`  
   Do not submit to Testmo unless asked.

---

## Examples

```text
/generate-and-pass 25273
/generate-and-pass 336260 from src/agent/examples/enriched_test_cases_5_expectedresult.csv
/generate-and-pass 86918 --max-attempts=5
```
