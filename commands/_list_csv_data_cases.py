"""List Testmo cases with extractable CSV-bound field families (>=3)."""
from __future__ import annotations

import csv
import re
from pathlib import Path

from _recalc_issue_defs import extract_csv_fields, body, load, EX

OUT = Path(__file__).resolve().parent / "reports" / "testmo-cases-with-csv-data.csv"


def main() -> None:
    rows = load(EX / "testmo-testcases.csv")
    hits = []
    for r in rows:
        fields = extract_csv_fields(body(r))
        if len(fields) >= 3:
            hits.append(
                {
                    "Case ID": r.get("Case ID", ""),
                    "Field family count": str(len(fields)),
                    "CSV field families detected": ", ".join(sorted(fields)),
                    "Tags": r.get("Tags") or "",
                    "Case": (r.get("Case") or "")[:120],
                    "JiraId": r.get("JiraId") or "",
                }
            )
    hits.sort(key=lambda x: (-int(x["Field family count"]), x["Case ID"]))

    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "Case ID",
                "Field family count",
                "CSV field families detected",
                "Tags",
                "Case",
                "JiraId",
            ],
            lineterminator="\n",
        )
        w.writeheader()
        w.writerows(hits)

    print(f"COUNT {len(hits)} / {len(rows)}")
    print(f"Wrote {OUT}")
    print("Case IDs:")
    print(", ".join(h["Case ID"] for h in hits))


if __name__ == "__main__":
    main()
