"""Copy Playwright test-results + write MANUAL_REVIEW stub for a case."""
from __future__ import annotations

import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TR = ROOT / "test-results"
OUT = ROOT / "commands/reports/execution"


def park(case_id: str, how_far: str, blocker: str, spec: str) -> Path:
    dest = OUT / case_id
    dest.mkdir(parents=True, exist_ok=True)
    matches = sorted(TR.glob(f"*{case_id}*"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        matches = sorted(TR.glob("*DFB*"), key=lambda p: p.stat().st_mtime, reverse=True)[:1]
    if matches:
        src = matches[0]
        for f in src.iterdir():
            if f.is_file():
                shutil.copy2(f, dest / f.name)
    md = dest / "MANUAL_REVIEW.md"
    md.write_text(
        f"""# PARKED — Case {case_id}

**Status:** Not green after automated attempts.  
**Spec:** `{spec}`  
**Parked:** {datetime.now().isoformat(timespec="seconds")}

## How far execution got

{how_far}

## Blocker

{blocker}

## Re-run

```bash
npx playwright test {spec} --reporter=list --retries=0
```

Do **not** submit to Testmo until green.
""",
        encoding="utf-8",
    )
    print(f"parked -> {dest}")
    return dest


if __name__ == "__main__":
    case_id = sys.argv[1]
    how_far = sys.argv[2] if len(sys.argv) > 2 else "See terminal / test-results"
    blocker = sys.argv[3] if len(sys.argv) > 3 else "See error-context.md"
    spec = sys.argv[4] if len(sys.argv) > 4 else f"src/tests/AIAgent/dfb/DFB-{case_id}.spec.ts"
    park(case_id, how_far, blocker, spec)
