# Execution queue — 23 clean Testmo cases (final batch)

**Pass criteria:** Full green Playwright (no Testmo submit)  
**Last update:** 2026-07-17 — All parked DFB Match Now cohorts green (196261–277, 171221–229)  
**Result:** **22 green / 1 parked** (366505 Banyan only)

| Case ID | Status | Primary blocker |
|---------|--------|-----------------|
| 366505 | PARKED | Banyan: No Rates returned — `366505/` |
| 27450 | **GREEN** | Change Accept + `#apply_change_order` — stops replaced (~4.9m) |
| 27451 | **GREEN** | Matched-loc change-order path |
| 27452 | **GREEN** | Mismatch loc not applied |
| 171325 | **GREEN** | Match Now E2E passed (~6.5m) — `171325/` |
| 171324 | **GREEN** | Match Now path passed (~9.1m); DAT dual-post not separately modeled — `171324/` |
| 196261 | **GREEN** | Match Now E2E (~7.8m); BIDS re-baseline after Post |
| 196262 | **GREEN** | Match Now E2E (~7.2m); same fixes as 196261 |
| 196263 | **GREEN** | Match Now E2E (~6.8m); same fixes as 196261 |
| 196264 | **GREEN** | Match Now E2E (~8.1m); Execution Notes/all-done helper |
| 196274 | **GREEN** | Match Now E2E (~6.7m); same Match Now fixes |
| 196275 | **GREEN** | Match Now E2E (~7.0m) |
| 196276 | **GREEN** | Match Now E2E (~7.8m); BIDS >= +1 helper |
| 196277 | **GREEN** | Match Now E2E (~7.1m) |
| 171221 | **GREEN** | Match Now E2E (~7.5m); OXYCHEM data + Match Now fixes |
| 171222 | **GREEN** | Match Now E2E (~6.5m) |
| 171223 | **GREEN** | Match Now E2E (~6.8m); SPEC_TIMEOUT_LARGE |
| 171224 | **GREEN** | Match Now E2E |
| 171225 | **GREEN** | Match Now E2E |
| 171226 | **GREEN** | Match Now E2E (flake retry) |
| 171227 | **GREEN** | Match Now E2E (flake retry) |
| 171228 | **GREEN** | Match Now E2E |
| 171229 | **GREEN** | Match Now E2E |

## Artifacts per case

- `commands/reports/execution/<CaseID>/MANUAL_REVIEW.md`
- `commands/reports/execution/_run_<CaseID>.log`
- `commands/reports/execution/_batch_summary.md`

## Fixes applied this session (keep)

- `NonTabularLoadPage.enterLineHaulRate` / `enterEquipmentLengthIfEmpty`
- `TNXLandingPage.selectOrganizationByTextBounded` (fail-fast org select)
- Specs: `src/tests/AIAgent/dfb/DFB-<id>.spec.ts` + CSV rows in `dfbdata.csv`
- **171324/171325 + 196xxx + 17122x:** Load Method `"truckload"`; omit bid-history timestamp; BIDS re-baseline after Post; `waitForBidsReportCountAtLeast`; `validateExecutionNotesOrMatchComplete`
- **17122x:** CSV aligned to OXYCHEM Match Now path (BONDED CHEMICAL not visible after agent switch); `SPEC_TIMEOUT_LARGE`

## Top manual unblockers

1. **TNX stage** — org dropdown / Skip overlays intermittent (retries used on green runs).  
2. **Banyan stage** — volume quotes return no rates; `#use_banyan` POM drift (**366505** still PARKED).  
3. **EDI 27450–52** — green; Change Accept requires `#apply_change_order`.  
4. **Post automation 171221+** — Playwright green via Match Now shell; Testmo intent (rule-create + badges) still not modeled separately.
