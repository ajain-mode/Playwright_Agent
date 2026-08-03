import csv
import re
from pathlib import Path

# LoadStatusHelper ACTIVE value
for p in Path("src/agent/.cache/mono-temp/btms/php/src").rglob("LoadStatusHelper.php"):
    t = p.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r"STATUS_ACTIVE\s*=\s*([^;]+);", t)
    print("ACTIVE", m.group(1) if m else "?", "in", p)
    break

p = Path("src/data/edi/edidata.csv")
with p.open(encoding="utf-8", newline="") as f:
    rows = list(csv.reader(f))
header = rows[0]
src = next(r for r in rows[1:] if r and r[0] == "EDI-25169")
h = {header[i]: i for i in range(len(header))}

def mk(case_id: str) -> list[str]:
    r = list(src)
    r[0] = case_id
    r[h["senderAsID"]] = "STKT"
    r[h["sender204ID"]] = "PSKL"
    r[h["customerName"]] = "FORD MOTOR C/O CASS INFO SYSTEMS"
    r[h["customerMasterID"]] = '"38041"'
    return r

existing = {r[0] for r in rows[1:] if r}
with p.open("a", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\n")
    for cid in ["EDI-27450", "EDI-27451", "EDI-27452"]:
        if cid in existing:
            print("exists", cid)
            continue
        w.writerow(mk(cid))
        print("appended", cid)
