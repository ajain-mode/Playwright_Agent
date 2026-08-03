# GREEN — Case 171325

**Status:** Passed (full green Playwright).  
**Spec:** `src/tests/AIAgent/dfb/DFB-171325.spec.ts`  
**Passed:** 2026-07-16 (~6.5m)

## Fixes applied

1. **Load Method** — UI shows `TruckLoad`; assert `"truckload"` (case-insensitive) instead of CSV `TL`.
2. **Bid history timestamp** — omitted from `validateBidHistoryFirstRow` (stage server clock can drift >1 min past local capture).

## Re-run

```bash
npx playwright test src/tests/AIAgent/dfb/DFB-171325.spec.ts --reporter=list --retries=0
```

Do **not** submit to Testmo until product owner requests it.
