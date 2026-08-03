from pathlib import Path
import re

t = Path("src/agent/.cache/mono-temp/btms/php/src/admintools.php").read_text(encoding="utf-8", errors="ignore")
i = t.find("function edi_parse_204")
print(t[i : i + 7000])

prefs = Path("src/agent/.cache/mono-temp/btms/php/src/cust_edi_prefs.php").read_text(encoding="utf-8", errors="ignore")
for needle in ["type=\"submit\"", "value=\"Save", "value='Save", "name=\"sv\"", "p=sv"]:
    for m in re.finditer(needle, prefs, re.I):
        print("PREF", re.sub(r"\s+", " ", prefs[max(0, m.start() - 80) : m.end() + 80]))
