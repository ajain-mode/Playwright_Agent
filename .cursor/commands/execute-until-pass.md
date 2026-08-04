# /execute-until-pass — run existing spec until green (no regenerate)

Run an **existing** Playwright spec for one Case ID (or path). Fix failures and re-run until **GREEN** or **PARKED**. Do **not** regenerate the spec unless it fails to compile or is missing required imports.

Shared glossary: `commands/test-execution-prompt-glossary.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

```
SCOPE   = first token (REQUIRED) — Case ID or spec path under src/tests/
FLAGS   = --max-attempts=N (default 5)  --park-on-env  --no-fix  --headed  --allure
```

If empty:

```text
Usage: /execute-until-pass <CASE_ID|spec-path> [--max-attempts=N]
```

Echo: `[execute-until-pass] scope=<SCOPE> flags=<FLAGS>`

---

## Procedure

1. **RESOLVE** spec path from Case ID (`src/tests/AIAgent/**/*<ID>*.spec.ts`) or use the path given.

2. **EXECUTE**

   ```bash
   npx playwright test <spec-path> --reporter=list --retries=0
   ```

3. On failure: classify (locator | assertion | data | navigation | env | flake).  
   Apply minimal fixes (prefer AI-authored POM / spec / CSV). Re-run.  
   If `--no-fix`, stop after first failure with diagnosis only.

4. Stop **GREEN** (exit 0) or **PARKED** (max attempts / env blocker / user stop).

5. Update `commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md` with status, attempts, fixes, re-run command.  
   Do not submit to Testmo unless asked.

---

## Examples

```text
/execute-until-pass 349979
/execute-until-pass src/tests/AIAgent/custom/TC-336260.spec.ts
/execute-until-pass EDI-25272 --max-attempts=3
```
