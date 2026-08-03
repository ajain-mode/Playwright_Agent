"""Extract locators from EDI prefs and Admin Parse EDI sources in mono-temp."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path("src/agent/.cache/mono-temp/btms/php/src")


def extract_attrs(html: str) -> list[str]:
    return sorted(
        set(
            re.findall(r"""(?:id|name)=['"]([^'"]+)['"]""", html, flags=re.I)
        )
    )


def dump_file(rel: str) -> None:
    path = BASE / rel
    txt = path.read_text(encoding="utf-8", errors="ignore")
    print("=" * 70)
    print(path)
    print("len", len(txt))
    ids = extract_attrs(txt)
    interesting = [
        i
        for i in ids
        if re.search(
            r"204|stop|change|apply|replace|order|pref|fee|item|parse|sender|receiver|raw|edi",
            i,
            re.I,
        )
    ]
    print("interesting attrs:", len(interesting))
    for i in interesting:
        print(" ", i)
    for m in re.finditer(
        r"(Apply 204|Stop Details|Replace Stops|Change Order|including fees|Parse an EDI)[^<\n]{0,100}",
        txt,
        re.I,
    ):
        print("LABEL:", m.group(0)[:140])
    for m in re.finditer(r"<input[^>]{0,400}>", txt, re.I):
        s = m.group(0)
        if re.search(r"204|stop|change|replace|apply|fee|parse|edi", s, re.I):
            print("INPUT:", re.sub(r"\s+", " ", s)[:300])
    for m in re.finditer(r"<select[^>]{0,300}>", txt, re.I):
        s = m.group(0)
        if re.search(r"204|stop|change|replace|apply|edi|sender|receiver", s, re.I):
            print("SELECT:", re.sub(r"\s+", " ", s)[:300])
    for m in re.finditer(r"<textarea[^>]{0,300}>", txt, re.I):
        print("TEXTAREA:", re.sub(r"\s+", " ", m.group(0))[:300])


def find_parse_ui() -> None:
    print("=" * 70)
    print("SEARCH parse UI links")
    for path in BASE.rglob("*"):
        if path.suffix.lower() not in {".php", ".inc", ".phtml", ".html", ".twig"}:
            continue
        try:
            txt = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if re.search(r"Parse an EDI 204|parse.?edi.?204|edi_parse|parseedi", txt, re.I):
            print("HIT", path)
            for m in re.finditer(
                r".{0,80}Parse an EDI.{0,80}|.{0,80}parse.?edi.{0,80}",
                txt,
                re.I | re.S,
            ):
                print("  ", re.sub(r"\s+", " ", m.group(0))[:200])


if __name__ == "__main__":
    dump_file("cust_edi_prefs.php")
    # related includes often hold form body
    for rel in [
        "custmastform.php",
        "edi.inc.php",
        "edi_loads.php",
        "app/templates/admin/index.html.twig",
    ]:
        p = BASE / rel
        if p.exists():
            dump_file(rel)
    find_parse_ui()
