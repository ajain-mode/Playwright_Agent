"""Deep extract change-order / stop-details / parse-EDI form controls."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path("src/agent/.cache/mono-temp/btms/php/src")


def snippet(txt: str, needle: str, pad: int = 500) -> None:
    for m in re.finditer(re.escape(needle), txt, re.I):
        start = max(0, m.start() - pad)
        end = min(len(txt), m.end() + pad)
        print("-" * 40, needle)
        print(re.sub(r"\s+", " ", txt[start:end])[:1200])
        print()


def main() -> None:
    prefs = (BASE / "cust_edi_prefs.php").read_text(encoding="utf-8", errors="ignore")
    for needle in [
        "Apply 204 Change Orders",
        "Change Order Types",
        "Stop Details",
        "including fees",
        "Replace Stops",
        "Change Order Options",
        "edi204_apply",
        "change_order",
        "stop_detail",
        "replace_stop",
    ]:
        if re.search(needle, prefs, re.I):
            snippet(prefs, needle, 600)

    # name= attributes containing change/stop/replace/apply
    print("=" * 60, "NAME ATTRS")
    for m in re.finditer(r"""name=['"]([^'"]+)['"]""", prefs, re.I):
        n = m.group(1)
        if re.search(r"change|stop|replace|apply|order|fee|item", n, re.I):
            print(n)

    tools = (BASE / "admintools.php").read_text(encoding="utf-8", errors="ignore")
    print("=" * 60, "ADMINTOOLS edi_204")
    # find edi_204 section
    idx = tools.lower().find("edi_204")
    print("first edi_204 at", idx)
    for needle in ["edi_204", "sender", "receiver", "raw", "Submit", "textarea", "Parse EDI"]:
        snippet(tools, needle, 400)

    # also search fats or similar
    for path in BASE.glob("*edi*204*"):
        print("file", path)


if __name__ == "__main__":
    main()
