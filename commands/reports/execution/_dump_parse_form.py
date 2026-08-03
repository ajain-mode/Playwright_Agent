from pathlib import Path
import re

tools = Path("src/agent/.cache/mono-temp/btms/php/src/admintools.php").read_text(encoding="utf-8", errors="ignore")
needle = "elseif($p == 'edi_204')"
i = tools.find(needle)
print(tools[i : i + 5000])

prefs = Path("src/agent/.cache/mono-temp/btms/php/src/cust_edi_prefs.php").read_text(encoding="utf-8", errors="ignore")
m = re.search(r"function make_edi204_change_order_options.{0,900}", prefs, re.S)
print("==== OPTIONS FN ====")
print(m.group(0) if m else "none")

# link from customer view
for path in [
    Path("src/agent/.cache/mono-temp/btms/php/src/custmastform.php"),
    Path("src/agent/.cache/mono-temp/btms/php/src/custform.php"),
]:
    if not path.exists():
        continue
    t = path.read_text(encoding="utf-8", errors="ignore")
    for mm in re.finditer(r".{0,80}cust_edi_prefs.{0,120}", t):
        print("LINK", path.name, re.sub(r"\s+", " ", mm.group(0))[:200])
