"""Analyze the 181 Testmo cases that neither hit Issue 1 nor have >=3 CSV fields.

These are cases where needs_category_csv_data=False — they do not imply runtime
category CSV fixtures. Question: can the agent pipeline automate them directly?
"""
from __future__ import annotations

import csv
import re
import statistics
from collections import Counter
from pathlib import Path

from _recalc_issue_defs import (
    EX,
    body,
    extract_csv_fields,
    issue_expected_screens,
    issue_incomplete_procedure,
    issue_missing_test_data,
    issue_role_cross_app,
    load,
    needs_category_csv_data,
    step_count,
)
from _score_vs_gold import score_case

OUT = Path(__file__).resolve().parent / "reports" / "testmo-cases-no-csv-needed-181-analysis.csv"
OUT_CLEAN = Path(__file__).resolve().parent / "reports" / "testmo-cases-no-csv-needed-clean.csv"

# Agent pipeline categories that have StepMappings / reference specs / data CSVs
AGENT_CATEGORIES = {
    "billingtoggle",
    "dfb",
    "edi",
    "commission",
    "saleslead",
    "banyan",
    "carrier",
    "bulkchange",
    "dat",
    "nonoperationalloads",
    "api",
    "payabletoggle",
    "loads",
}


def primary_tag(tags: str) -> str:
    parts = [t.strip().lower() for t in (tags or "").split(",") if t.strip()]
    return parts[0] if parts else "(none)"


def has_agent_category(tags: str) -> bool:
    parts = {t.strip().lower().replace(" ", "") for t in (tags or "").split(",") if t.strip()}
    # normalize common variants
    normalized = set()
    for p in parts:
        normalized.add(p)
        normalized.add(p.replace("-", ""))
    return bool(normalized & AGENT_CATEGORIES or any(
        a in p for p in parts for a in ("billingtoggle", "dfb", "edi", "carrier", "dat", "commission")
    ))


def main() -> None:
    rows = load(EX / "testmo-testcases.csv")
    sample = load(EX / "sample-testcases.csv")

    gold_steps_med = statistics.median(len((r.get("Test Steps") or "").strip()) for r in sample)
    gold_step_n_med = statistics.median(step_count(r.get("Test Steps") or "") for r in sample)
    gold_exp_med = statistics.median(len((r.get("Expected") or "").strip()) for r in sample)
    gold_self = [
        score_case(r, gold_steps_med, gold_step_n_med, gold_exp_med)["closeness"] for r in sample
    ]
    gold_self_avg = statistics.mean(gold_self)

    remaining = []
    for r in rows:
        b = body(r)
        fields = extract_csv_fields(b)
        if len(fields) >= 3:
            continue
        if issue_missing_test_data(r, b):
            continue
        remaining.append(r)

    assert len(remaining) == 181, f"expected 181, got {len(remaining)}"

    # Score each
    records = []
    for r in remaining:
        b = body(r)
        steps = (r.get("Test Steps") or "").strip()
        exp = (r.get("Expected") or "").strip()
        i = issue_incomplete_procedure(r, b)
        ro = issue_role_cross_app(r, b)
        e = issue_expected_screens(r, b)
        sc = score_case(r, gold_steps_med, gold_step_n_med, gold_exp_med)
        tags = r.get("Tags") or ""
        other_count = (1 if i else 0) + (1 if ro else 0) + (1 if e else 0)
        clean = other_count == 0
        records.append(
            {
                "Case ID": r.get("Case ID") or "",
                "JiraId": r.get("JiraId") or "",
                "Tags": tags,
                "Primary tag": primary_tag(tags),
                "Case": (r.get("Case") or "")[:120],
                "Issue2 Incomplete procedure": "Y" if i else "N",
                "Issue3 Role/cross-app": "Y" if ro else "N",
                "Issue4 Unclear Expected/screens": "Y" if e else "N",
                "Other-issue count": str(other_count),
                "Clean of issues 2-4": "Y" if clean else "N",
                "Agent category tag?": "Y" if has_agent_category(tags) else "N",
                "Steps chars": str(len(steps)),
                "Step count": str(step_count(steps)),
                "Expected chars": str(len(exp)),
                "Has login wording": "Y" if re.search(r"(?i)\blogin\b|\bsign in\b", b) else "N",
                "Has hover wording": "Y" if re.search(r"(?i)\bhover\b", b) else "N",
                "CSV field count": str(len(extract_csv_fields(b))),
                "Gold closeness": f"{sc['closeness']:.1f}",
                "Depth % of gold median": str(sc["depth_ratio_pct"]),
            }
        )

    records.sort(
        key=lambda x: (
            0 if x["Clean of issues 2-4"] == "Y" else 1,
            -float(x["Gold closeness"]),
            x["Case ID"],
        )
    )

    # --- Console analysis ---
    n = len(records)
    clean = [r for r in records if r["Clean of issues 2-4"] == "Y"]
    i2 = sum(1 for r in records if r["Issue2 Incomplete procedure"] == "Y")
    i3 = sum(1 for r in records if r["Issue3 Role/cross-app"] == "Y")
    i4 = sum(1 for r in records if r["Issue4 Unclear Expected/screens"] == "Y")
    any_other = sum(1 for r in records if int(r["Other-issue count"]) > 0)
    agent_tag = sum(1 for r in records if r["Agent category tag?"] == "Y")
    clean_agent = sum(1 for r in clean if r["Agent category tag?"] == "Y")

    closeness = [float(r["Gold closeness"]) for r in records]
    clean_close = [float(r["Gold closeness"]) for r in clean]
    steps_chars = [int(r["Steps chars"]) for r in records]
    step_ns = [int(r["Step count"]) for r in records]

    tag_all = Counter(r["Primary tag"] for r in records)
    tag_clean = Counter(r["Primary tag"] for r in clean)
    combo = Counter(r["Other-issue count"] for r in records)

    print("=" * 72)
    print(f"ANALYSIS: {n} cases that do NOT need category CSV data")
    print("         (not Issue 1, and <3 extractable CSV field families)")
    print("=" * 72)
    print()
    print("VERDICT: These are NOT automatically agent-pipeline-ready.")
    print("         Skipping Issue 1 only means fixtures aren't required —")
    print("         procedure / role / Expected quality still gate generation.")
    print()
    print("--- vs Issues 2 / 3 / 4 ---")
    print(f"  Hit Issue 2 (incomplete procedures):     {i2:3}  ({100*i2/n:.0f}%)")
    print(f"  Hit Issue 3 (role / cross-app):           {i3:3}  ({100*i3/n:.0f}%)")
    print(f"  Hit Issue 4 (unclear Expected/screens):   {i4:3}  ({100*i4/n:.0f}%)")
    print(f"  Hit at least one of Issues 2-4:           {any_other:3}  ({100*any_other/n:.0f}%)")
    print(f"  Clean of Issues 2-4 (all-clear):          {len(clean):3}  ({100*len(clean)/n:.0f}%)")
    print(f"  Other-issue count distribution: {dict(sorted(combo.items()))}")
    print()
    print("--- Agent pipeline category coverage ---")
    print(f"  Tagged with known agent category:         {agent_tag:3}  ({100*agent_tag/n:.0f}%)")
    print(f"  Clean AND agent-category tagged:          {clean_agent:3}")
    print(f"  Outside agent categories (admin/portal/…):{n-agent_tag:3}  ({100*(n-agent_tag)/n:.0f}%)")
    print()
    print("--- Procedure depth vs gold standard ---")
    print(f"  Gold median steps chars / step#: {gold_steps_med:.0f} / {gold_step_n_med:.0f}")
    print(f"  Gold self-score avg closeness:   {gold_self_avg:.1f}")
    print(f"  This cohort avg / med closeness: {statistics.mean(closeness):.1f} / {statistics.median(closeness):.1f}")
    print(f"  Clean subset avg closeness:      {statistics.mean(clean_close):.1f}" if clean_close else "  Clean subset: n/a")
    print(f"  Avg / med steps chars:           {statistics.mean(steps_chars):.0f} / {statistics.median(steps_chars):.0f}")
    print(f"  Avg / med numbered steps:        {statistics.mean(step_ns):.1f} / {statistics.median(step_ns):.0f}")
    print(f"  Cases with login wording:        {sum(1 for r in records if r['Has login wording']=='Y')}")
    print(f"  Cases with hover wording:        {sum(1 for r in records if r['Has hover wording']=='Y')}")
    print(f"  Closeness >= 40: {sum(1 for c in closeness if c>=40)} | >=50: {sum(1 for c in closeness if c>=50)} | >=60: {sum(1 for c in closeness if c>=60)}")
    print()
    print("--- Top primary tags (all 181) ---")
    for tag, cnt in tag_all.most_common(15):
        print(f"  {cnt:3}  {tag}")
    print()
    print("--- Top primary tags among clean-of-2/3/4 ---")
    for tag, cnt in tag_clean.most_common(15):
        print(f"  {cnt:3}  {tag}")
    print()
    print("--- Clean cases (candidate for direct generation) ---")
    for r in clean:
        print(
            f"  {r['Case ID']:>8}  close={r['Gold closeness']:>5}  "
            f"agentCat={r['Agent category tag?']}  tags={r['Tags'][:40]!r}"
        )
        print(f"           {(r['Case'] or '')[:90]}")
    print()

    # Write CSVs
    fieldnames = list(records[0].keys())
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        w.writeheader()
        w.writerows(records)
    print(f"Wrote full analysis: {OUT}")

    with OUT_CLEAN.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "Case ID",
                "JiraId",
                "Tags",
                "Case",
                "Agent category tag?",
                "Gold closeness",
                "Steps chars",
                "Step count",
                "Expected chars",
            ],
            lineterminator="\n",
        )
        w.writeheader()
        for r in clean:
            w.writerow({k: r[k] for k in w.fieldnames})
    print(f"Wrote clean subset:  {OUT_CLEAN}  ({len(clean)} rows)")


if __name__ == "__main__":
    main()
