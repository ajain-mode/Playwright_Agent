# /batch-until-pass — serial multi-case until each is green or parked

Process **multiple** Case IDs (list, CSV, folder, or tag) **serially**. Finish case N (GREEN or PARKED) before starting N+1. This repo runs Playwright with `workers: 1` — do not parallelize E2E cases.

Shared glossary: `commands/test-execution-prompt-glossary.md`  
Queue index: `commands/reports/execution/INDEX.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

```
SCOPE   = first token (REQUIRED)
          - ID list: 25272,86918,336260
          - CSV path: src/agent/examples/enriched_….csv
          - folder:<category>: folder:edi
          - @tag: @billingtoggle | @edi
MODE    = mode=<full|generate|execute|analyze>  (default: full)
FLAGS   = --max-attempts=N (default 5)  --park-on-env  --no-fix  --headed
```

If empty:

```text
Usage: /batch-until-pass <ID,ID,…|csv-path|folder:cat|@tag> [mode=full|execute|generate] [--max-attempts=N]
```

Echo: `[batch-until-pass] scope=<SCOPE> mode=<MODE> flags=<FLAGS>`

---

## Procedure

1. **BUILD WORK LIST** — ordered Case IDs from list, CSV rows, `src/tests/AIAgent/<category>/*.spec.ts`, or tag grep. Deduplicate. Print the list before starting.

2. **SERIAL LOOP** — for each Case ID:
   - If `mode=execute` → follow `/execute-until-pass` SOP
   - If `mode=generate` or `full` → follow `/run-until-pass` (or `/generate-and-pass` when forcing pipeline)
   - Do **not** start the next case until current is GREEN or PARKED
   - Skip regeneration when a correct existing spec already covers the case; ask only if duplicate/overlap is unclear (e.g. 25272 vs 25273)

3. **BATCH ARTIFACTS**
   - Per case: `commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md`
   - Summary: `commands/reports/execution/_batch_summary.md`
   - Update rows in `commands/reports/execution/INDEX.md` (GREEN / PARKED / IN PROGRESS)

4. **FINAL REPLY** — table:

   | Case ID | Status | Spec path | Blocker |
   |---------|--------|-----------|---------|

5. Do not submit to Testmo unless asked.

---

## Examples

```text
/batch-until-pass 25272,86918,336260,349979
/batch-until-pass src/agent/examples/enriched_test_cases_5_expectedresult.csv
/batch-until-pass folder:edi mode=execute
/batch-until-pass @billingtoggle mode=execute --max-attempts=5
```
