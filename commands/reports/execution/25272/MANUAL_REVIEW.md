# GREEN — Case 25272

**Status:** Passed (full green Playwright).  
**Spec:** `src/tests/AIAgent/edi/EDI-25272.spec.ts`  
**Attempts:** 1  
**Passed:** 2026-08-04 (~1.1m)  
**Mode:** `/run-until-pass` full (existing spec; no regenerate)

## Fixes applied

None this run — existing spec passed on first execution.

## Coverage notes

- Field present on Customer More EDI Pref's: `place_new_load_on_hold_when_204_auto_accepted`
- Edit mode: single-select YES/NO; default NO (`EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD`)
- Customer: MARMAXX GROUP (`edidata.csv` EDI-25272)
- Related: EDI-25273 covers overlapping EDI prefs behavior; 25272 kept as dedicated presence + options case

## Re-run

```bash
npx playwright test src/tests/AIAgent/edi/EDI-25272.spec.ts --reporter=list --retries=0
```

Do **not** submit to Testmo until product owner requests it.
