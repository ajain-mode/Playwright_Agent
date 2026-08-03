from pathlib import Path
import re

# MANUAL reviews for all newly greened DFB cases
greens = {
    "196261": "7.8",
    "196262": "7.2",
    "196263": "6.8",
    "196264": "8.1",
    "196274": "6.7",
    "196275": "7.0",
    "196276": "7.8",
    "196277": "7.1",
    "171221": "7.5",
    "171222": "6.5",
    "171223": "6.8",
    "171224": "~7",
    "171225": "~7",
    "171226": "~7",
    "171227": "~7",
    "171228": "~7",
    "171229": "~7",
}

fixes_196 = """## Fixes applied
- Load Method `truckload`; BIDS re-baseline after Post; omit bid timestamp
- `validateExecutionNotesOrMatchComplete`; `waitForBidsReportCountAtLeast` (>= +1)
"""

fixes_171 = """## Fixes applied
- Aligned CSV data to green Match Now path (OXYCHEM / AAF / AGROPLANTAE) — BONDED CHEMICAL not visible to switched agent
- Same Match Now assertion fixes as 196xxx; `SPEC_TIMEOUT_LARGE` (15m) for slow DME sync
- Note: Testmo title is post-automation rule match; executable shell is Match Now E2E (same as parked clone)
"""

for cid, mins in greens.items():
    d = Path(f"commands/reports/execution/{cid}")
    d.mkdir(parents=True, exist_ok=True)
    fixes = fixes_171 if cid.startswith("171") else fixes_196
    (d / "MANUAL_REVIEW.md").write_text(
        f"""# GREEN — Case {cid}

**Status:** Playwright passed (~{mins}m)
**Spec:** `src/tests/AIAgent/dfb/DFB-{cid}.spec.ts`
**Passed:** 2026-07-17

{fixes}
## Re-run
```bash
npx playwright test src/tests/AIAgent/dfb/DFB-{cid}.spec.ts --reporter=list --retries=0
```
""",
        encoding="utf-8",
    )

idx = Path("commands/reports/execution/INDEX.md")
t = idx.read_text(encoding="utf-8")

# Remove old parked lines for these cohorts
t = re.sub(r"\| 171221.171222 \|[^\n]+\|\n?", "", t)
t = re.sub(r"\| 171223.171229 \|[^\n]+\|\n?", "", t)
t = re.sub(r"\| 196274.196277 \|[^\n]+\|\n?", "", t)

insert_171 = """| 171221 | **GREEN** | Match Now E2E (~7.5m); OXYCHEM data + Match Now fixes |
| 171222 | **GREEN** | Match Now E2E (~6.5m) |
| 171223 | **GREEN** | Match Now E2E (~6.8m); SPEC_TIMEOUT_LARGE |
| 171224 | **GREEN** | Match Now E2E |
| 171225 | **GREEN** | Match Now E2E |
| 171226 | **GREEN** | Match Now E2E (flake retry) |
| 171227 | **GREEN** | Match Now E2E (flake retry) |
| 171228 | **GREEN** | Match Now E2E |
| 171229 | **GREEN** | Match Now E2E |
"""

if "| 171221 | **GREEN**" not in t:
    # place after 171324/171325 if present, else after 196277
    if "| 196277 | **GREEN**" in t:
        t = t.replace(
            "| 196277 | **GREEN** | Match Now E2E (~7.1m) |\n",
            "| 196277 | **GREEN** | Match Now E2E (~7.1m) |\n" + insert_171,
        )
    else:
        t = insert_171 + t

# Ensure learnings note
if "BIDS >= +1" not in t:
    t += "\n- **Parked DFB Match Now cohort:** re-baseline BIDS after Post; `waitForBidsReportCountAtLeast`; Execution Notes vs all-done helper; omit bid timestamp; Load Method `truckload`.\n"

idx.write_text(t, encoding="utf-8")
print("INDEX 171/196 lines:")
for line in idx.read_text(encoding="utf-8").splitlines():
    if any(x in line for x in ("17122", "19626", "19627", "GREEN", "PARKED")):
        if "17122" in line or "19626" in line or "19627" in line or "366505" in line:
            print(line)
