import csv
import html
from pathlib import Path

out = Path("commands/reports/execution/_case_briefs.txt")
p = Path("src/agent/examples/sample-testcases.csv")
ids = (
    ["171324"]
    + [str(i) for i in range(196261, 196265)]
    + [str(i) for i in range(196274, 196278)]
    + [str(i) for i in range(171221, 171230)]
)
lines = []
with p.open(encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):
        if row.get("Case ID") not in ids:
            continue
        lines.append("=" * 60)
        lines.append(f"ID={row['Case ID']} Tags={row.get('Tags')}")
        lines.append(f"Case={html.unescape(row.get('Case') or '')}")
        lines.append("PRE:")
        lines.append(html.unescape(row.get("Precondition") or "")[:900])
        lines.append("STEPS:")
        lines.append(html.unescape(row.get("Test Steps") or "")[:1500])
        lines.append("EXP:")
        lines.append(html.unescape(row.get("Expected") or "")[:900])
        lines.append("")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out} bytes={out.stat().st_size}")
