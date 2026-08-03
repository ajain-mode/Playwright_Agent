from pathlib import Path
import re

edi = Path("src/agent/.cache/mono-temp/btms/php/src/edi.inc.php").read_text(encoding="utf-8", errors="ignore")
m = re.search(r"function edi_parse_204\s*\([^)]*\)\s*\{", edi)
if not m:
    print("not found")
else:
    start = m.start()
    # brace match
    i = edi.find("{", start)
    depth = 0
    end = i
    for j in range(i, min(len(edi), i + 30000)):
        if edi[j] == "{":
            depth += 1
        elif edi[j] == "}":
            depth -= 1
            if depth == 0:
                end = j + 1
                break
    block = edi[start:end]
    print(block[:8000])
    print("==== ATTRS ====")
    for a in sorted(set(re.findall(r"""(?:id|name)=['"]([^'"]+)['"]""", block, re.I))):
        print(a)

# customer link to edi prefs
for path in Path("src/agent/.cache/mono-temp/btms/php/src").glob("cust*.php"):
    t = path.read_text(encoding="utf-8", errors="ignore")
    if "cust_edi_prefs" in t:
        for mm in re.finditer(r".{0,100}cust_edi_prefs.{0,150}", t):
            print(path.name, "=>", re.sub(r"\s+", " ", mm.group(0))[:220])
