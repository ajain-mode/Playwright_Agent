from pathlib import Path
import re

cm = Path("src/agent/.cache/mono-temp/btms/php/src/classes/CustomerMaster.php").read_text(encoding="utf-8", errors="ignore")
for name in [
    "EDI204_CHANGE_ORDER_TYPES",
    "EDI204_CHANGE_ORDER_STOP",
    "EDI204_CHANGE_ORDER_LOAD",
    "REPLACE",
]:
    print("====", name)
    for m in re.finditer(rf"{name}[A-Z_]*\s*=\s*\[[^\]]{{0,2000}}\]", cm):
        print(m.group(0)[:1500])
        print()

# broader search
for m in re.finditer(r"EDI204_CHANGE_ORDER_[A-Z_]+\s*=\s*\[[^\]]*\]", cm, re.S):
    print("CONST", m.group(0)[:800])
    print()

tools = Path("src/agent/.cache/mono-temp/btms/php/src/admintools.php").read_text(encoding="utf-8", errors="ignore")
# find p==edi_204 block
m = re.search(r"case\s+['\"]edi_204['\"].{0,8000}", tools, re.S | re.I)
if m:
    block = m.group(0)
    print("==== ADMINTOOLS BLOCK LEN", len(block))
    for attr in re.findall(r"""(?:id|name)=['"]([^'"]+)['"]""", block, re.I):
        print("ATTR", attr)
    for mm in re.finditer(r"<textarea[^>]*>|<input[^>]{0,250}>|<select[^>]{0,250}>", block, re.I):
        print("CTRL", re.sub(r"\s+", " ", mm.group(0))[:250])
else:
    print("no case edi_204")
    # try function
    for mm in re.finditer(r".{0,60}edi_204.{0,200}", tools, re.I):
        print(re.sub(r"\s+", " ", mm.group(0))[:250])
