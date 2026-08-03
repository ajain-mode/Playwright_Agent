import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _recalc_issue_defs import (
    EX,
    body,
    extract_csv_fields,
    issue_expected_screens,
    issue_incomplete_procedure,
    issue_missing_test_data,
    issue_role_cross_app,
    load,
)

OUT = Path(__file__).resolve().parent / "reports" / "testmo-cases-clean-of-four-issues.csv"


def main() -> None:
    rows = load(EX / "testmo-testcases.csv")
    # Original "23" = has CSV data AND none of other 3 issues
    # Also compute truly clean of all 4 for clarity
    clean_other3 = []
    clean_all4 = []
    for r in rows:
        b = body(r)
        has_csv = len(extract_csv_fields(b)) >= 3
        i = issue_incomplete_procedure(r, b)
        ro = issue_role_cross_app(r, b)
        e = issue_expected_screens(r, b)
        m = issue_missing_test_data(r, b)
        if has_csv and not i and not ro and not e:
            clean_other3.append(r)
        if not m and not i and not ro and not e:
            clean_all4.append(r)

    print(f"Has CSV data AND none of other 3 issues: {len(clean_other3)}")
    print(f"Outside all 4 issue categories: {len(clean_all4)}")
    print("\n--- 23 (CSV data, clear of other 3) ---")
    for r in clean_other3:
        print(
            f"{r.get('Case ID')}\t{r.get('Tags') or ''}\t{(r.get('Case') or '')[:90]}"
        )

    import csv

    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["Case ID", "JiraId", "Tags", "Case"],
            lineterminator="\n",
        )
        w.writeheader()
        for r in clean_other3:
            w.writerow(
                {
                    "Case ID": r.get("Case ID") or "",
                    "JiraId": r.get("JiraId") or "",
                    "Tags": r.get("Tags") or "",
                    "Case": r.get("Case") or "",
                }
            )
    print(f"\nWrote {OUT}")
    print("IDs:", ", ".join(r["Case ID"] for r in clean_other3))


if __name__ == "__main__":
    main()
