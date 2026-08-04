# /run-until-pass — resolve, generate if needed, execute until green

End-to-end for **one** Case ID (or one spec path): ensure a Playwright spec exists, run it, diagnose failures, fix root causes, and re-run until **GREEN** or **PARKED**.

Shared glossary: `commands/test-execution-prompt-glossary.md`  
Guardrails: `.cursor/rules/agent-architecture.mdc`, `CLAUDE.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

Parse `$ARGUMENTS` as space-separated tokens:

```
SCOPE   = first token (REQUIRED) — Case ID (25272 | EDI-25272 | BT-74454) or spec path
MODE    = mode=<full|generate|execute|analyze>   OR bare token full|generate|execute|analyze
          (default: full)
FLAGS   = --max-attempts=N (default 5)  --park-on-env  --no-fix  --headed  --allure
```

If `SCOPE` is empty, print usage and stop:

```text
Usage: /run-until-pass <CASE_ID|spec-path> [mode=full|generate|execute|analyze] [--max-attempts=N]
```

Echo: `[run-until-pass] scope=<SCOPE> mode=<MODE> flags=<FLAGS>`

---

## Read first

1. This command file
2. `commands/test-execution-prompt-glossary.md` — Until-pass loop + artifact template
3. Case row in `src/agent/examples/sample-testcases.csv` (or CSV named in args)
4. Runtime data: `src/data/<category>/*.csv`
5. Existing spec under `src/tests/AIAgent/<category>/` if any
6. Category rules in `.cursor/rules/agent-architecture.mdc`

---

## Procedure

1. **RESOLVE** — Find Case ID, category, Test Steps + Expected, CSV test data, and target spec path  
   `src/tests/AIAgent/<category>/<PREFIX>-<ID>.spec.ts` (or `custom/TC-<ID>.spec.ts`).

2. **PREPARE** (skip if `mode=execute` and spec exists and compiles)
   - Prefer Agent pipeline: `npm run agent:generate` / `agent:file` / `agent:batch`
   - Align steps to the CSV row; follow guardrails (no locators in specs, constants for assertions,
     `navigateToBaseUrl` before header nav after detail pages, billingtoggle user switch when needed)
   - New POM methods only: `@author AI Agent`, locators from `src/agent/.cache/` app source

3. **EXECUTE** (skip if `mode=generate` or `mode=analyze`)

   ```bash
   npx playwright test <spec-path> --reporter=list --retries=0
   ```

   Do **not** raise Playwright retries to hide failures. Prefer POM / spec / CSV fixes.

4. **DIAGNOSE → FIX → RE-EXECUTE** until PASS or stop:
   - Stop **GREEN** on exit code 0
   - Stop **PARKED** if attempts ≥ `--max-attempts` (default 5), clear env/product blocker, or user stops
   - If `--no-fix`, report failure only (no code changes)

5. **ARTIFACTS**
   - Write/update `commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md`
   - Optional log: `commands/reports/execution/_run_<CASE_ID>.log`
   - Do **not** submit to Testmo unless the user explicitly asks

6. Ask clarifying questions only if Case ID, category, or preconditions are ambiguous.

---

## Category addenda (when relevant)

- **billingtoggle** — After `BTMSLogin`, switch to `USER_ROLES.BILLINGTOGGLE_USER`. View Load Waiting On → `ViewLoadPage`; View Billing → `LoadBillingPage`. Reference: `BT-74454.spec.ts`.
- **dfb** — Map precondition bands to POMs; `MultiAppManager` for TNX/DME. Reference: `DFB-97739.spec.ts`.
- **edi** — Prefer existing EDI prefs helpers when overlap exists; confirm before duplicating coverage.

---

## Examples

```text
/run-until-pass 25272
/run-until-pass EDI-86918 mode=execute
/run-until-pass BT-74454 --max-attempts=8
/run-until-pass src/tests/AIAgent/custom/TC-336260.spec.ts mode=execute
```
