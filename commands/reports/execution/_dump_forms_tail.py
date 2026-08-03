from pathlib import Path
import re

t = Path("src/agent/.cache/mono-temp/btms/php/src/admintools.php").read_text(encoding="utf-8", errors="ignore")
# find the HTML form after flash for parse
i = t.find("Admin Tools: Parse EDI Messages")
print(t[i : i + 3500])
print("==== PREFS SAVE ====")
prefs = Path("src/agent/.cache/mono-temp/btms/php/src/cust_edi_prefs.php").read_text(encoding="utf-8", errors="ignore")
for m in re.finditer(r"type=['\"]submit['\"][^>]*>|value=['\"][^'\"]*Save[^'\"]*['\"]|name=['\"]p['\"][^>]*>", prefs, re.I):
    print(re.sub(r"\s+", " ", m.group(0)))
# hidden p values
for m in re.finditer(r"name=['\"]p['\"][^>]*>", prefs, re.I):
    print("P", m.group(0))
