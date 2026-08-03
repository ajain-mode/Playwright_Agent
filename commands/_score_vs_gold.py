"""Score 1125 Testmo cases vs gold standard; used for business HTML KPI."""
from __future__ import annotations

import csv
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EX = ROOT / "src" / "agent" / "examples"


def load(p: Path):
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            with p.open(encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise RuntimeError(p)


def step_count(txt: str) -> int:
    txt = (txt or "").strip()
    if not txt:
        return 0
    return max(
        len(re.findall(r"(?i)\bstep\s*\d+", txt)),
        len(re.findall(r"(?m)^\s*\d+[\.\)]\s+", txt)),
    )


def body(r: dict) -> str:
    return "\n".join((r.get(c) or "") for c in ("Precondition", "Test Steps", "Expected"))


def score_case(r: dict, gold_steps_med: float, gold_step_n_med: float, gold_exp_med: float) -> dict:
    steps = (r.get("Test Steps") or "").strip()
    exp = (r.get("Expected") or "").strip()
    pre = (r.get("Precondition") or "").strip()
    b = body(r)
    sc = len(steps)
    sn = step_count(steps)
    ec = len(exp)

    # Ratio caps at 1.0 when meeting/exceeding gold median
    depth_ratio = min(1.0, sc / gold_steps_med) if gold_steps_med else 0
    step_n_ratio = min(1.0, sn / gold_step_n_med) if gold_step_n_med else 0
    exp_ratio = min(1.0, ec / gold_exp_med) if gold_exp_med else 0

    login = 1.0 if re.search(r"(?i)\blogin\b|\bsign in\b", b) else 0.0
    hover = 1.0 if re.search(r"(?i)\bhover\b", b) else 0.0
    click = 1.0 if re.search(r"(?i)\bclick\b", steps) else 0.0
    enter = 1.0 if re.search(r"(?i)\b(enter|select|fill)\b", steps) else 0.0
    numbered = 1.0 if sn >= 10 else (0.5 if sn >= 5 else (0.25 if sn >= 1 else 0.0))
    # concrete-ish literals
    literal = 1.0 if re.search(
        r"(?i)\b(CORP|TX-[A-Z0-9]+|FLATBED|YES|NO|Central|AGENT RESPONSE|:\s*\d{5})\b",
        b,
    ) else (0.4 if re.search(r"(?i)[A-Za-z][^:\n]{2,40}:\s*\S+", b) else 0.0)
    soft_penalty = 0.15 if re.search(r"(?i)\b(any load|valid values for all|accordingly|seems)\b", b) else 0.0
    blank_penalty = 0.5 if (not steps or not exp) else 0.0

    # Weighted closeness 0-100
    raw = (
        0.28 * depth_ratio
        + 0.22 * step_n_ratio
        + 0.12 * exp_ratio
        + 0.10 * login
        + 0.08 * hover
        + 0.06 * click
        + 0.06 * enter
        + 0.05 * numbered
        + 0.03 * literal
    ) * 100
    closeness = max(0.0, min(100.0, raw - soft_penalty * 100 - blank_penalty * 100))

    return {
        "id": r.get("Case ID"),
        "closeness": closeness,
        "steps_chars": sc,
        "step_n": sn,
        "exp_chars": ec,
        "depth_ratio_pct": round(100 * depth_ratio, 1),
    }


def issue_flags(r: dict) -> dict[str, bool]:
    b = body(r)
    steps = (r.get("Test Steps") or "").strip()
    exp = (r.get("Expected") or "").strip()
    return {
        "Incomplete procedures (thin steps / weak nav / missing login)": (
            (re.search(r"(?i)\bnavigate to\b", steps) and not re.search(r"(?i)\bhover\b", b))
            or (0 < len(steps) < 200)
            or (steps and not re.search(r"(?m)^\s*\d+[\.\)]|Step\s*\d+", steps))
            or (
                re.search(r"(?i)\b(hover|click|navigate)\b", steps)
                and not re.search(r"(?i)\blogin\b|\bsign in\b", b)
            )
        ),
        "Missing role switch & cross-app handoff": bool(
            re.search(r"(?i)switch user|manager or less|auth level|\brole\b|permission", b)
            or (
                re.search(r"(?i)\b(DME|TNX|carrier portal)\b", b)
                and not re.search(r"(?i)load\s*(id|number|#)", b)
            )
        ),
        "Unclear Expected results & ambiguous screens / blank records": (
            not steps
            or not exp
            or bool(re.search(r"(?i)accordingly|seems disabled|as per the|updated correctly", exp))
            or (
                re.search(r"(?i)waiting on|billing toggle|NDF|view billing", b)
                and not re.search(r"(?i)view load|load tab", b)
            )
            or (
                len(exp) > 80
                and not re.search(r"(?i)ensure after|after step", exp)
                and step_count(steps) >= 10
            )
        ),
        "Missing test data & external EDI / Postman / Sterling dependency": bool(
            re.search(
                r"(?i)\bany\b.{0,40}(load|customer|office|invoice|value)|navigate to any|valid values for all|enter the valid values",
                b,
            )
            or re.search(r"(?i)\b(EDI|Postman|Sterling)\b", b)
        ),
    }


def main() -> None:
    sample = load(EX / "sample-testcases.csv")
    testmo = load(EX / "testmo-testcases.csv")
    assert len(sample) == 28, len(sample)
    assert len(testmo) == 1125, len(testmo)

    gold_steps_med = statistics.median(len((r.get("Test Steps") or "").strip()) for r in sample)
    gold_step_n_med = statistics.median(step_count(r.get("Test Steps") or "") for r in sample)
    gold_exp_med = statistics.median(len((r.get("Expected") or "").strip()) for r in sample)

    scored = [score_case(r, gold_steps_med, gold_step_n_med, gold_exp_med) for r in testmo]
    scored.sort(key=lambda x: x["closeness"], reverse=True)

    # Gold-standard self-score for calibration
    gold_scores = [score_case(r, gold_steps_med, gold_step_n_med, gold_exp_med)["closeness"] for r in sample]
    gold_self_avg = statistics.mean(gold_scores)

    # Closest cohort: score >= 70% of average gold-standard self-score, OR top natural break
    threshold = 0.70 * gold_self_avg
    closest = [s for s in scored if s["closeness"] >= threshold]
    # If too many/few, also report top-percentile: scores within 40 points of max among testmo
    if len(closest) < 5 or len(closest) > 100:
        # use elbow: top cases until closeness drops below 60% of best testmo score
        best = scored[0]["closeness"]
        cut = 0.60 * best
        closest = [s for s in scored if s["closeness"] >= cut]
    if len(closest) > 80:
        closest = scored[:40]  # keep interpretable "closest set"

    avg_close = statistics.mean(s["closeness"] for s in closest) if closest else 0
    # Express "by what %" as closeness to gold (already 0-100 scale calibrated to gold features)
    # Also relative to gold_self_avg
    pct_of_gold = 100 * avg_close / gold_self_avg if gold_self_avg else 0

    print("GOLD_STEPS_MED", gold_steps_med)
    print("GOLD_STEP_N_MED", gold_step_n_med)
    print("GOLD_EXP_MED", gold_exp_med)
    print("GOLD_SELF_AVG", round(gold_self_avg, 1))
    print("THRESHOLD_USED", round(threshold, 1))
    print("CLOSEST_COUNT", len(closest))
    print("CLOSEST_AVG_CLOSENESS", round(avg_close, 1))
    print("CLOSEST_PCT_OF_GOLD_SELF", round(pct_of_gold, 1))
    print("TESTMO_AVG_CLOSENESS", round(statistics.mean(s["closeness"] for s in scored), 1))
    print("TESTMO_MED_CLOSENESS", round(statistics.median(s["closeness"] for s in scored), 1))
    print("TOP10", [(s["id"], round(s["closeness"], 1), s["steps_chars"], s["step_n"]) for s in scored[:10]])
    print("BOTTOM5", [(s["id"], round(s["closeness"], 1)) for s in scored[-5:]])

    # Issue table counts
    n = len(testmo)
    print("\nISSUE_COUNTS")
    issues = [
        "Incomplete procedures (thin steps / weak nav / missing login)",
        "Missing role switch & cross-app handoff",
        "Unclear Expected results & ambiguous screens / blank records",
        "Missing test data & external EDI / Postman / Sterling dependency",
    ]
    for name in issues:
        cnt = sum(1 for r in testmo if issue_flags(r)[name])
        print(f"{cnt}\t{100*cnt/n:.1f}\t{name}")

    # Also check tier at ~40% closeness absolute
    near40 = [s for s in scored if s["closeness"] >= 40]
    near50 = [s for s in scored if s["closeness"] >= 50]
    near60 = [s for s in scored if s["closeness"] >= 60]
    print("\nABSOLUTE_BANDS")
    print(">=40", len(near40), "avg", round(statistics.mean(s["closeness"] for s in near40), 1) if near40 else 0)
    print(">=50", len(near50), "avg", round(statistics.mean(s["closeness"] for s in near50), 1) if near50 else 0)
    print(">=60", len(near60), "avg", round(statistics.mean(s["closeness"] for s in near60), 1) if near60 else 0)


if __name__ == "__main__":
    main()
