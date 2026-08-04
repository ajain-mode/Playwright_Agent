# /rerun-failed — recover last failed case(s) until green

Identify recently failed Playwright Case IDs / specs and re-run each with `/execute-until-pass` until **GREEN** or **PARKED**.

Shared glossary: `commands/test-execution-prompt-glossary.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

```
SCOPE   = optional: last | all | CASE_ID[,CASE_ID…]
          (default: last — most recent failure set)
FLAGS   = --max-attempts=N (default 5)  --park-on-env  --no-fix
```

Echo: `[rerun-failed] scope=<SCOPE> flags=<FLAGS>`

---

## Procedure

1. **DISCOVER FAILURES** (in order):
   - `test-results/.last-run.json`
   - Recent `commands/reports/execution/_batch_summary.md` / `_batch_manually_stopped_summary.md`
   - Open `MANUAL_REVIEW.md` files still marked failed / PARKED / incomplete
   - Failures mentioned in the current chat if clearer

2. Build the Case ID / spec list. If none found, say so and stop.

3. For each failed case, run the `/execute-until-pass` SOP (serial).

4. Final reply: which recovered to GREEN vs remain PARKED, with paths to MANUAL_REVIEW.

---

## Examples

```text
/rerun-failed
/rerun-failed last
/rerun-failed 171324,171325
```
