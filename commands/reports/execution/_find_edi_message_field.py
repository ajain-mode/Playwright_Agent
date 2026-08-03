from pathlib import Path
import re

for p in Path("src/agent/.cache/mono-temp/btms/php/src").rglob("*"):
    if p.suffix.lower() not in {".php", ".inc", ".phtml", ".html"}:
        continue
    try:
        t = p.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        continue
    if "edi_204_mesage" not in t:
        continue
    print("FILE", p)
    attrs = sorted(
        set(re.findall(r"""(?:id|name)=['"]([^'"]+)['"]""", t, re.I))
    )
    for a in attrs:
        if re.search(r"edi|sender|receiver|message|submit|provider", a, re.I):
            print(" ", a)
    # print form region
    i = t.find("edi_204_mesage")
    print(re.sub(r"\s+", " ", t[max(0, i - 800) : i + 1200])[:1800])
    print()
