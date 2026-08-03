"""Recalculate 4 issue categories with explicit definitions + CSV-aligned test data."""
from __future__ import annotations

import csv
import re
from pathlib import Path

EX = Path(__file__).resolve().parents[1] / "src" / "agent" / "examples"


def load(p: Path):
    for enc in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            with p.open(encoding=enc, newline="") as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise RuntimeError(p)


def body(r: dict) -> str:
    return "\n".join((r.get(c) or "") for c in ("Precondition", "Test Steps", "Expected"))


def step_count(txt: str) -> int:
    txt = (txt or "").strip()
    if not txt:
        return 0
    return max(
        len(re.findall(r"(?i)\bstep\s*\d+", txt)),
        len(re.findall(r"(?m)^\s*\d+[\.\)]\s+", txt)),
    )


# Fields the agent extracts into category CSVs (billingtoggledata.csv / dfbdata.csv style)
CSV_FIELD_PATTERNS: dict[str, list[str]] = {
    "officeName": [
        r"(?i)\boffice\s+code\b.{0,20}\b([A-Z]{2,5}-[A-Z0-9]{2,5}|CORP)\b",
        r"(?i)\b(CORP|TX-[A-Z0-9]{2,5}|STK)\b",
    ],
    "customerName": [
        r"(?i)customer\s*name\s*[:=]\s*([^\n,]+)",
        r"(?i)customer(?:\s+field)?\s+[\"'(]?([A-Z][A-Za-z0-9 &'/.-]{3,})",
        r"(?i)\b(AGENT RESPONSE[^\n,]{0,40}|BONDED CHEMICAL|MillerCoors[^\n,]{0,40})\b",
    ],
    "shipperName": [
        r"(?i)shipper(?:name)?(?:/city)?\s*[:=]\s*([^\n]+)",
        r"(?i)\bshipper\b.{0,40}[\"'(]([A-Z][^\"'\n]{2,})",
    ],
    "consigneeName": [
        r"(?i)consignee(?:name)?(?:/city)?\s*[:=]\s*([^\n]+)",
        r"(?i)\bconsignee\b.{0,40}[\"'(]([A-Z][^\"'\n]{2,})",
    ],
    "equipmentType": [
        r"(?i)equipment(?:\s*type)?\s*[:=]\s*([A-Z0-9 /_-]+)",
        r"(?i)\b(FLATBED|VAN|REEFER|STEP\s*DECK)\b",
    ],
    "loadMethod": [r"(?i)\b(load\s*method|type)\s*[:=]\s*(TL|LTL|IMDL)\b", r"(?i)\b\b(TL|LTL)\b"],
    "shipmentCommodityQty": [r"(?i)\bqty\b.{0,20}(\d+)", r"(?i)quantity.{0,15}(\d+)"],
    "shipmentCommodityWeight": [r"(?i)\bweight\b.{0,20}(\d+)"],
    "offerRate_or_linehaul": [
        r"(?i)(offer\s*rate|lh\s*rate|linehaul|bid\s*amount|customer\s*rate|carrier\s*rate).{0,20}(\d+)",
        r"(?i)rate\s+as\s+(\d+)",
    ],
    "shipperZip_or_consigneeZip": [r"(?i)\bzip(?:/postal)?\b.{0,20}(\d{5})", r"(?i)\b(\d{5})\b"],
    "Carrier": [r"(?i)carrier(?:\s*name)?\s*[:=]\s*[\"']?([A-Za-z0-9][^\n\"']{2,})", r"(?i)\b(XPO TRANS|ECHO)\b"],
    "loadId": [r"(?i)load\s*(?:id|number|#)\s*[:=]?\s*([A-Z0-9-]{4,})"],
}


def extract_csv_fields(text: str) -> set[str]:
    found: set[str] = set()
    for key, pats in CSV_FIELD_PATTERNS.items():
        for p in pats:
            if re.search(p, text or ""):
                found.add(key)
                break
    return found


def needs_category_csv_data(r: dict, b: str) -> bool:
    """Case implies runtime testData that should land in category CSVs."""
    tags = (r.get("Tags") or "").lower()
    if re.search(
        r"(?i)create\s+(a\s+)?load|enter new load|create tl|new load|post automation|"
        r"enter (the )?valid values|fill .{0,20}field|customer search|office search|"
        r"shipper|consignee|offer rate|invoice|carrier tab|include carrier",
        b,
    ):
        return True
    if re.search(r"(?i)billingtoggle|dfb|loads|carriers|edi|payabletoggle", tags):
        return True
    if re.search(r"(?i)\bany\b.{0,30}(load|customer|value)|valid values for all", b):
        return True
    return False


def issue_incomplete_procedure(r: dict, b: str) -> bool:
    """DEFINITION: Steps too thin / unnumbered / no login / navigate without hover menu mapping."""
    steps = (r.get("Test Steps") or "").strip()
    if not steps:
        return True
    if 0 < len(steps) < 200:
        return True
    if not re.search(r"(?m)^\s*\d+[\.\)]|Step\s*\d+", steps):
        return True
    if re.search(r"(?i)\bnavigate to\b", steps) and not re.search(r"(?i)\bhover\b", b):
        return True
    if re.search(r"(?i)\b(hover|click|navigate)\b", steps) and not re.search(
        r"(?i)\blogin\b|\bsign in\b", b
    ):
        return True
    return False


def issue_role_cross_app(r: dict, b: str) -> bool:
    """DEFINITION: Role/switch-user or DME/TNX/portal without named user or load-ID handoff."""
    roleish = bool(
        re.search(
            r"(?i)switch user|switch account|manager or less|auth level|\brole\b|"
            r"permission|billingtoggle",
            b,
        )
    )
    named_user = bool(
        re.search(
            r"(?i)click on .{0,40}\([A-Z]{2}-[A-Z]+\)|USER_ROLES|username|switch.{0,20}to\s+[A-Z]",
            b,
        )
    )
    cross = bool(re.search(r"(?i)\b(DME|TNX|carrier portal)\b", b))
    load_id = bool(re.search(r"(?i)load\s*(?:id|number|#)|note the load|capture.{0,15}load", b))
    if roleish and not named_user:
        return True
    if cross and not load_id:
        return True
    return False


def issue_expected_screens(r: dict, b: str) -> bool:
    """DEFINITION: Soft Expected, blank Expected/Steps, or Waiting On/toggle without naming View Load vs View Billing."""
    steps = (r.get("Test Steps") or "").strip()
    exp = (r.get("Expected") or "").strip()
    if not steps or not exp:
        return True
    if re.search(r"(?i)accordingly|seems disabled|as per the|updated correctly|behave correctly", exp):
        return True
    if re.search(r"(?i)waiting on|billing toggle|NDF|not deliv|finance issue", b) and not re.search(
        r"(?i)view load|load tab|view billing", b
    ):
        return True
    if (
        len(exp) > 80
        and not re.search(r"(?i)ensure after|after step", exp)
        and step_count(steps) >= 10
    ):
        return True
    return False


def issue_missing_test_data(r: dict, b: str) -> bool:
    """
    DEFINITION: Agent cannot populate category CSV rows (e.g. billingtoggledata.csv, dfbdata.csv)
    via FieldRegistry extraction — prose lacks concrete values for CSV-bound fields
    (officeName, customerName, shipper/consignee, equipmentType, loadMethod, rates, zips, Carrier, loadId)
    when the scenario needs that runtime testData; OR EDI/Postman/Sterling with no payload/values.
    """
    fields = extract_csv_fields(b)
    external = bool(re.search(r"(?i)\b(EDI|Postman|Sterling)\b", b))
    external_without_payload = external and len(fields) < 2

    if needs_category_csv_data(r, b):
        # Gold-style create-load needs several CSV columns; <3 distinct field families = missing
        if len(fields) < 3:
            return True
    # Explicit placeholders even if some fields exist
    if re.search(r"(?i)\bany\b.{0,40}(load|customer|office|invoice|value)|valid values for all|enter the valid values", b):
        if len(fields) < 4:
            return True
    if external_without_payload:
        return True
    return False


def main() -> None:
    rows = load(EX / "testmo-testcases.csv")
    n = len(rows)
    counts = {
        "Incomplete procedures": 0,
        "Missing role switch & cross-app handoff": 0,
        "Unclear Expected / ambiguous screens / blank records": 0,
        "Missing CSV-bound test data (billingtoggledata/dfbdata fields)": 0,
    }
    field_hist = []
    for r in rows:
        b = body(r)
        fields = extract_csv_fields(b)
        field_hist.append(len(fields))
        if issue_incomplete_procedure(r, b):
            counts["Incomplete procedures"] += 1
        if issue_role_cross_app(r, b):
            counts["Missing role switch & cross-app handoff"] += 1
        if issue_expected_screens(r, b):
            counts["Unclear Expected / ambiguous screens / blank records"] += 1
        if issue_missing_test_data(r, b):
            counts["Missing CSV-bound test data (billingtoggledata/dfbdata fields)"] += 1

    print("n", n)
    for k, v in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"{v:4}  {100*v/n:5.1f}%  {k}")
    print("median fields found", sorted(field_hist)[n // 2], "avg", sum(field_hist) / n)
    print("cases with 0 extractable CSV fields", sum(1 for x in field_hist if x == 0))
    print("cases with >=3 extractable CSV fields", sum(1 for x in field_hist if x >= 3))
    print("needs csv data", sum(1 for r in rows if needs_category_csv_data(r, body(r))))


if __name__ == "__main__":
    main()
