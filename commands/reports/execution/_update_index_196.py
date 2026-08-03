from pathlib import Path
import re

# MANUAL reviews for greens
for cid, mins in [
    ("196261", "7.8"),
    ("196262", "7.2"),
    ("196263", "6.8"),
    ("196264", "8.1"),
]:
    d = Path(f"commands/reports/execution/{cid}")
    d.mkdir(parents=True, exist_ok=True)
    (d / "MANUAL_REVIEW.md").write_text(
        f"""# GREEN — Case {cid}

**Status:** Playwright passed (~{mins}m)
**Spec:** `src/tests/AIAgent/dfb/DFB-{cid}.spec.ts`
**Passed:** 2026-07-17

## Fixes applied
- Assert Load Method as `truckload` (UI label)
- Re-baseline BIDS after Post (exact +1 after Match Now)
- Omit bid-history timestamp (server clock skew)
- `validateExecutionNotesOrMatchComplete` (Progress all-done vs Execution Notes race)

## Re-run
```bash
npx playwright test src/tests/AIAgent/dfb/DFB-{cid}.spec.ts --reporter=list --retries=0
```
""",
        encoding="utf-8",
    )

idx = Path("commands/reports/execution/INDEX.md")
t = idx.read_text(encoding="utf-8")
# Replace any 196261-196264 block lines
t = re.sub(
    r"\| 196261[^\n]*\n\| 196262[^\n]*\n\| 196263[^\n]*\n",
    "",
    t,
)
t = re.sub(
    r"\| 196261.196264 \|[^\n]+\|\n?",
    "",
    t,
)
t = re.sub(
    r"\| 196263.196264 \|[^\n]+\|\n?",
    "",
    t,
)
# Insert after 171324 line if present
insert = """| 196261 | **GREEN** | Match Now E2E (~7.8m); BIDS re-baseline after Post |
| 196262 | **GREEN** | Match Now E2E (~7.2m); same fixes as 196261 |
| 196263 | **GREEN** | Match Now E2E (~6.8m); same fixes as 196261 |
| 196264 | **GREEN** | Match Now E2E (~8.1m); Execution Notes/all-done helper |
"""
if "| 196261 | **GREEN**" not in t:
    t = re.sub(
        r"(\| 171324 \| \*\*GREEN\*\*[^\n]+\|\n)",
        r"\1" + insert,
        t,
        count=1,
    )
idx.write_text(t, encoding="utf-8")
print([l for l in t.splitlines() if "19626" in l or "19627" in l])
