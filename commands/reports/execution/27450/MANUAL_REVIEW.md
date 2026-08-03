# PARKED — Case 27450

**Status:** Not green after automated attempts.  
**Spec:** `src/tests/AIAgent/edi/EDI-27450.spec.ts`  
**Parked:** 2026-07-17T11:45:57

## How far execution got

EDI Prefs POM generated; Admin Parse reached; BOL not found on EDI 204 tenders

## Blocker

Load tender missing after parse

## Re-run

```bash
npx playwright test src/tests/AIAgent/edi/EDI-27450.spec.ts --reporter=list --retries=0
```

Do **not** submit to Testmo until green.
