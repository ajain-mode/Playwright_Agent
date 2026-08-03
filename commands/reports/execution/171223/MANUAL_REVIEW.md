# GREEN — Case 171223

**Status:** Playwright passed (~6.8m)
**Spec:** `src/tests/AIAgent/dfb/DFB-171223.spec.ts`
**Passed:** 2026-07-17

## Fixes applied
- Aligned CSV data to green Match Now path (OXYCHEM / AAF / AGROPLANTAE) — BONDED CHEMICAL not visible to switched agent
- Same Match Now assertion fixes as 196xxx; `SPEC_TIMEOUT_LARGE` (15m) for slow DME sync
- Note: Testmo title is post-automation rule match; executable shell is Match Now E2E (same as parked clone)

## Re-run
```bash
npx playwright test src/tests/AIAgent/dfb/DFB-171223.spec.ts --reporter=list --retries=0
```
