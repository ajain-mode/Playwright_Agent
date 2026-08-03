from pathlib import Path
import re

edi = Path("src/agent/.cache/mono-temp/btms/php/src/edi.inc.php").read_text(encoding="utf-8", errors="ignore")
for needle in ["edi_204_mesage", "edi_parse", "Parse EDI Messages", "sender_id", "receiver_id"]:
    print("====", needle, edi.lower().count(needle.lower()))
    i = edi.lower().find(needle.lower())
    if i >= 0:
        print(re.sub(r"\s+", " ", edi[max(0, i - 200) : i + 800])[:900])
        print()

# find function definitions containing parse and 204
for m in re.finditer(r"function\s+(\w*parse\w*|\w*204\w*)\s*\(", edi, re.I):
    print("FN", m.group(1), "at", m.start())
