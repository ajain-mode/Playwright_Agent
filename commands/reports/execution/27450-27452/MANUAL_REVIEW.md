# GREEN — Cases 27450 / 27451 / 27452 (EDI 204 + EDI Prefs)

**Status:** All three green (2026-07-17)  
**Tags:** `edi204`, `ediprefs`

## Specs

| Case | Spec | Result |
|------|------|--------|
| 27450 | `EDI-27450.spec.ts` | **GREEN** (~4.9m) — stops replaced after Change Accept |
| 27451 | `EDI-27451.spec.ts` | **GREEN** — matched loc; name unchanged |
| 27452 | `EDI-27452.spec.ts` | **GREEN** — mismatch; load not updated |

Shared: `src/tests/AIAgent/edi/_ediPrefsChangeOrderHelpers.ts`

## Root cause (27450)

Change tender was matched to the load (LOAD# present) and showed REPLACED names on the tenders grid, but Accept did not update stops because **`#apply_change_order` was left unchecked**.

Fix: on Change Accept, check `#apply_change_order`, leave `#create_new_load` unchecked, submit.

```typescript
await pages.loadTender204Page.acceptChangeOrderOntoExistingLoad();
// checks #apply_change_order
```

## Other learnings

- Admin Parse requires `ST*204*` first line (ISA/GS rejected)
- Ford: PSKL/AVGD; Accept original tender (empty LOAD# until Accept)
- Centralized loads use `Location_1_*` tabs + `getVisibleStopName()`
- Click **Change** row when two BOL rows exist
- View Load **Overlay** is Load-Copy (`LoadCopyFromController`) — not EDI apply; crashes on stage

## Logs

- `_run_27450_fix17.log` — green
- `_run_27451_27452_fix2.log` — re-verify after Accept fix
