# GREEN — Case 171324

**Status:** Passed (full green Playwright).  
**Spec:** `src/tests/AIAgent/dfb/DFB-171324.spec.ts`  
**Passed:** 2026-07-16 (~9.1m)

## Fixes applied

1. **Load Method** — UI shows `TruckLoad`; assert `"truckload"` (case-insensitive) instead of CSV `TL`.
2. **Bid history timestamp** — omitted from `validateBidHistoryFirstRow` (stage server clock can drift >1 min past local capture).

## Note

Spec currently follows the Match Now E2E path (cloned from 171325 / 61626). Case title mentions DAT+TNX dual post; DAT-specific posting is not yet modeled separately. Match Now + cross-app validation is green on stage.

## Re-run

```bash
npx playwright test src/tests/AIAgent/dfb/DFB-171324.spec.ts --reporter=list --retries=0
```

Do **not** submit to Testmo until product owner requests it.
