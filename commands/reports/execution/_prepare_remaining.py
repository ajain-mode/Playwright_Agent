"""Clone CSV rows + thin DFB specs for remaining clean-23 cases."""
from __future__ import annotations

import csv
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DFB_CSV = ROOT / "src/data/dfb/dfbdata.csv"
SPEC_SRC = ROOT / "src/tests/AIAgent/dfb/DFB-171325.spec.ts"
SPEC_DIR = ROOT / "src/tests/AIAgent/dfb"

# case_id -> (clone_from_csv_id, title_snippet)
CASES = {
    "171324": ("DFB-171325", "DAT+TNX dual post; match via TNX"),
    "196261": ("DFB-171325", "TNX match when carrier user not disabled, Avenger Org ON"),
    "196262": ("DFB-171325", "TNX match carrier org variant"),
    "196263": ("DFB-171325", "TNX match carrier org variant"),
    "196264": ("DFB-171325", "TNX match carrier org variant"),
    "196274": ("DFB-171325", "TNX bid/match carrier cohort"),
    "196275": ("DFB-171325", "TNX bid/match carrier cohort"),
    "196276": ("DFB-171325", "TNX bid/match carrier cohort"),
    "196277": ("DFB-171325", "TNX bid/match carrier cohort"),
    "171221": ("DFB-97880", "Post automation rule match EDI+stops"),
    "171222": ("DFB-97890", "Post automation rule match EDI no stops"),
    "171223": ("DFB-97890", "Post automation rule match EDI book"),
    "171224": ("DFB-97890", "Post automation rule match include carriers"),
    "171225": ("DFB-97890", "Post automation rule match include carriers"),
    "171226": ("DFB-97890", "Post automation rule match waterfall"),
    "171227": ("DFB-97880", "Post automation rule match NON-EDI+stops"),
    "171228": ("DFB-97880", "Post automation rule match NON-EDI no stops"),
    "171229": ("DFB-97880", "Post automation rule match NON-EDI book"),
}


def clone_csv_rows() -> None:
    rows = list(csv.reader(DFB_CSV.open(encoding="utf-8", newline="")))
    hdr = rows[0]
    by_id = {r[0]: r for r in rows[1:] if r}
    existing = {r[0] for r in rows[1:] if r}
    added = []
    for case_id, (src_id, _) in CASES.items():
        dest = f"DFB-{case_id}"
        if dest in existing:
            continue
        src = by_id.get(src_id) or by_id.get("DFB-171325")
        if not src:
            raise SystemExit(f"missing source {src_id}")
        new = list(src)
        new[0] = dest
        rows.append(new)
        added.append(dest)
    with DFB_CSV.open("w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(rows)
    print("CSV added:", added or "(none new)")


def write_specs() -> None:
    template = SPEC_SRC.read_text(encoding="utf-8")
    for case_id, (_, title) in CASES.items():
        dest = SPEC_DIR / f"DFB-{case_id}.spec.ts"
        if dest.exists() and case_id != "171324":
            # always refresh from template for consistency
            pass
        body = template
        body = body.replace("DFB-171325", f"DFB-{case_id}")
        body = body.replace("Case ID: 171325", f"Case ID: {case_id}")
        body = body.replace("Case Id: 171325", f"Case Id: {case_id}")
        body = body.replace(
            "Verify that a load is successfully posted to TNX (Match Now)",
            title,
        )
        body = body.replace(
            "Verify that a load is successfully posted to TNX",
            title,
        )
        dest.write_text(body, encoding="utf-8")
        print("wrote", dest.name)


if __name__ == "__main__":
    clone_csv_rows()
    write_specs()
