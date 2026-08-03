import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _recalc_issue_defs import (
    EX,
    body,
    extract_csv_fields,
    issue_expected_screens,
    issue_incomplete_procedure,
    issue_role_cross_app,
    load,
)


def main() -> None:
    rows = load(EX / "testmo-testcases.csv")
    has_csv = [r for r in rows if len(extract_csv_fields(body(r))) >= 3]
    n = len(has_csv)

    inc = role = exp = any_other = 0
    combo = {0: 0, 1: 0, 2: 0, 3: 0}
    details = {
        "none": 0,
        "inc_only": 0,
        "role_only": 0,
        "exp_only": 0,
        "inc_role": 0,
        "inc_exp": 0,
        "role_exp": 0,
        "all3": 0,
    }

    for r in has_csv:
        b = body(r)
        i = issue_incomplete_procedure(r, b)
        ro = issue_role_cross_app(r, b)
        e = issue_expected_screens(r, b)
        if i:
            inc += 1
        if ro:
            role += 1
        if e:
            exp += 1
        k = (1 if i else 0) + (1 if ro else 0) + (1 if e else 0)
        combo[k] += 1
        if k > 0:
            any_other += 1
        if k == 0:
            details["none"] += 1
        elif i and ro and e:
            details["all3"] += 1
        elif i and ro:
            details["inc_role"] += 1
        elif i and e:
            details["inc_exp"] += 1
        elif ro and e:
            details["role_exp"] += 1
        elif i:
            details["inc_only"] += 1
        elif ro:
            details["role_only"] += 1
        elif e:
            details["exp_only"] += 1

    print(f"Has CSV data (>=3 fields): {n}")
    print(f"Also incomplete procedures: {inc} ({100*inc/n:.1f}%)")
    print(f"Also role/cross-app: {role} ({100*role/n:.1f}%)")
    print(f"Also unclear Expected/screens: {exp} ({100*exp/n:.1f}%)")
    print(f"In at least one of the other 3: {any_other} ({100*any_other/n:.1f}%)")
    print(f"In none of the other 3: {details['none']} ({100*details['none']/n:.1f}%)")
    print(f"Overlap count distribution (how many of the other 3): {combo}")
    print(f"Breakdown: {details}")


if __name__ == "__main__":
    main()
