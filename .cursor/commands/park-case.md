# /park-case — stop until-pass loop and document blocker

Stop the until-pass / batch loop for a Case ID. Write **PARKED** status and manual unblockers. Continue other batch cases if any remain.

Shared glossary: `commands/test-execution-prompt-glossary.md`

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

```
SCOPE   = first token (REQUIRED) — Case ID
REASON  = reason="…"   OR remaining free text after Case ID
```

If Case ID missing:

```text
Usage: /park-case <CASE_ID> reason="<blocker synopsis>"
```

Echo: `[park-case] scope=<SCOPE> reason=<REASON>`

---

## Procedure

1. Stop further execute/fix attempts for this Case ID in the current session.

2. Write/update `commands/reports/execution/<CASE_ID>/MANUAL_REVIEW.md`:

   ```markdown
   # PARKED — Case <CASE_ID>

   **Status:** PARKED
   **Spec:** `…` (if known)
   **Reason:** <REASON>
   **Last run:** <command + exit synopsis if available>

   ## Manual unblockers
   1. …

   ## Re-run (after unblock)
   ```bash
   npx playwright test <spec> --reporter=list --retries=0
   ```
   ```

3. Mark `commands/reports/execution/INDEX.md` and `_batch_summary.md` as PARKED for this ID.

4. If a `/batch-until-pass` is in progress, continue with the next Case ID.

---

## Examples

```text
/park-case 366505 reason="Banyan returned no rates on stage"
/park-case 61626 TNX org dropdown intermittent; needs manual stage check
```
