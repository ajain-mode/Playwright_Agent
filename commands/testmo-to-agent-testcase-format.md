# /testmo-gap-report — Testmo export → agent testcase format & gap analysis

Analyze Testmo repository exports (e.g. `testmo-export-repository_Will Automate.csv`) against the
gold agent input format in **`src/agent/examples/sample-testcases.csv`**. Produce **format guidance**,
**test-case quality gaps** (with `Issue Type`), and an **Input Sufficiency Verdict**.

**Analysis-only** for the gap pass — do **not** generate or execute Playwright specs in this command.

---

## Input

`$ARGUMENTS`

## Argument parsing (do this first)

Parse `$ARGUMENTS` as space-separated tokens:

```
INPUT   = first token         (REQUIRED — path to Testmo .csv, or already-converted 9-column CSV)
SCOPE   = second token or ALL (Case IDs: "117058", list "117058,27455", tag "billingtoggle", or ALL)
MODE    = third token or full (convert | analyze | full)
```

Resolve `INPUT` relative to repo root; also check `src/agent/examples/`. If empty, print usage and stop.

Echo: `[testmo-gap-report] file=<f> scope=<SCOPE> mode=<MODE> (analysis-only for gaps)`

**Output location:**

| Artifact | Path |
|----------|------|
| Converted 9-column CSV | `src/agent/examples/testmo-testcases.csv` (or caller-named path) |
| Consolidated HTML report | `commands/reports/Testmo-Gap-Analysis-Report.html` |
| Consolidated MD excerpt | optional: `commands/reports/Testmo-Gap-Analysis-Report.md` |

---

## Read first (agent pipeline reference)

1. This file — schema + detailing bar + Issue Type taxonomy  
2. Gold catalog: `src/agent/examples/sample-testcases.csv`  
3. Runtime data pattern: `src/data/<category>/*.csv` (must be **named** in steps, not left as “any”)  
4. `src/agent/parsers/TestCaseParser.ts` — what gets extracted from Precondition / Test Steps / Expected  
5. Category rules in `.cursor/rules/agent-architecture.mdc` (billingtoggle user switch, View Load vs View Billing, etc.)  
6. Reference specs under `src/tests/AIAgent/<category>/` when judging “already automated?”

---

## Target CSV schema (exact columns, exact order)

Gold header:

`Case ID,Automation Script ID,JiraId,Case,Precondition,Test Steps,Expected,Description,Tags`

| Column | Required? | Purpose |
|--------|-----------|---------|
| `Case ID` | Yes | Case key (parser may prefix `BT-` / `DFB-` …) |
| `Automation Script ID` | No | Usually empty |
| `JiraId` | Recommended | `FD-#####` |
| `Case` | Yes | Outcome-focused title |
| `Precondition` | Strongly recommended | State/roles/data that must already be true |
| `Test Steps` | Yes | Atomic UI actions (+ **embedded test data**) |
| `Expected` | Yes | Observable asserts (prefer step-tied) |
| `Description` | Optional | Sample often blank |
| `Tags` | Yes | Category routing (`billingtoggle`, `dfb`, …) |

Map from Testmo export; **drop** `Sno`, `Folder`, `Priority`, `State`, `Automation`, dates, etc.

```python
import csv
from pathlib import Path

SRC = Path("src/agent/examples/testmo-export-repository_Will Automate.csv")
DST = Path("src/agent/examples/testmo-testcases.csv")
COLS = [
    "Case ID", "Automation Script ID", "JiraId", "Case",
    "Precondition", "Test Steps", "Expected", "Description", "Tags",
]
with SRC.open(encoding="utf-8-sig", newline="") as f:
    rows = [{c: (r.get(c) or "") for c in COLS} for r in csv.DictReader(f)]
with DST.open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=COLS, lineterminator="\n")
    w.writeheader(); w.writerows(rows)
```

---

## How much detailing is needed (gold bar)

From **28** rows in `sample-testcases.csv`:

| Signal | Gold target |
|--------|-------------|
| Median `Test Steps` length | ~**3,700** chars |
| Median numbered actions | ~**50** |
| Median `Expected` length | ~**600** chars |
| Login / hover / click / enter | Essentially always present |
| **Concrete test data** in steps | **Always** — office codes, customer names, Field:Value blocks |
| Step-tied Expected (`Ensure after Step N`) | Common on complex cases |

**Test data is first-class.** The agent extracts literals into `explicitValues` / category CSV. Phrases like *any load*, *valid values for all fields*, *enter any numeric value* (without a fixture) are **not** agent-ready.

Minimum E2E UI bar: ~**15–20** atomic steps, login, named menus, **named fixtures**, assertable Expected. Short exceptions only for tiny reports (e.g. sample `116909` still names SSO path + exact column labels).

### Author template

```text
Test Steps:
1. Log in to BTMS …
2. Hover over ADMIN → OFFICE SEARCH
3. Enter Office Code as CORP
…
Field:Value (inside steps or as indented block):
Customer Name: …
Shipper: …
Equipment: FLATBED
LH Rate: 500

Expected:
1. View Billing Waiting On = "Agent"
2. Ensure after Step N: …
```

---

## Stage 1 — Parse each case (INTENT)

For each `SCOPE` row extract Case ID, Case, Tags, Precondition, Test Steps, Expected. Record what is present and what is blank/vague:

- navigation path (header / submenu / page / tab)  
- concrete UI action per step  
- **test data** (office, customer, load, carrier, rates, EDI payload keys)  
- preconditions (role, load status, office flags)  
- expected UI outcome per step  
- step ↔ expected linkage  

Also compute depth metrics (chars, numbered steps) vs gold medians.

---

## Stage 2 — Reconcile against agent source of truth

1. **Gold sample** — pick a same-tag sample case (e.g. billingtoggle `67846` / `74454`) and compare depth + data density.  
2. **Reference AIAgent spec** (if any) — note “already automated?” outside the gap table.  
3. **Category rules** — e.g. billingtoggle user switch, View Load vs View Billing Waiting On.  
4. **Do not invent** fixtures — mark missing data as `Unresolved variable / undefined data`.

Default is **static** analysis (CSV + repo). No Playwright run unless the user asks.

---

## Stage 3 — Deliverables (per case) — NO test scripts

### A) TEST-CASE QUALITY GAPS

Review as a **specification**. One row per issue:

`| Step | Issue Type | What Testmo Says | Why It's a Problem | How to Fix It |`

**`Issue Type` is one of:**

- **Vague / ambiguous instruction** — open to more than one interpretation  
- **Unresolved variable / undefined data** — “any load”, “valid values”, placeholders, no guaranteed fixture  
- **Missing precondition** — assumes state/account/data no step establishes  
- **Step dependency gap** — needs a prior result never guaranteed (e.g. load ID for DME search)  
- **Non-deterministic / untestable** — timing/behavior with no defined trigger  
- **Unverifiable assertion** — no concrete observable pass criteria (“updated accordingly”, “seems disabled”)  
- **Missing / blank expected result** — empty Expected or step with no outcome  
- **Out-of-scope step** — unrelated to the stated purpose  
- **Ambiguous / contradictory phrasing** — double negatives; action vs expected mismatch  

Order by step; end with whole-case issues (e.g. no test data anywhere).

**Do not** put locators / POM method names in the gap table (automator job). You may note PO/spec existence in the Summary only.

### B) INPUT SUFFICIENCY VERDICT

Per Case ID:

| Verdict | Meaning |
|---------|---------|
| **ROBUST** | Competent automator / agent could script from this CSV alone |
| **ADEQUATE** | Usable with repo reference specs / known patterns filling gaps |
| **INSUFFICIENT** | Too vague; heavy guessing — fix before `agent:file` / `agent:batch` |

One blunt justification + **top-3 fields/data** to add (almost always: office, customer/load fixture, exact Expected values).

---

## Stage 4 — Write HTML report + say the path

Create `commands/reports/` if needed. Write:

`commands/reports/Testmo-Gap-Analysis-Report.html`

**HTML shape must follow the ECS blocker-report pattern** (see reference `ECS-7793-automation-gap-analysis.html`), not a raw notebook dump:

1. **Hero** — eyebrow, title, scope subtitle, chips (source CSV, backlog size, gold bar = **28** `sample-testcases`, date)  
2. **Stat strip** — critical findings · Case IDs affected · root-cause themes · highest-leverage fixes  
3. **Bottom-line callout** — 1–2 unblockers that clear most reviewed tickets  
4. **Theme sections (A–J)** — ten primary color-coded themes; each Case ID card has `Step ref` / `Gap` / `Resolution`, **Blocker** badge, `Issue Type` chip, and a **Gold bar** comparator line  
5. **Themes at a glance** table — theme · ~hit count · Case IDs · single unblocking action  
6. Theme toggle (light/dark)

**Primary themes (HTML sections):**

| Theme | Focus |
|-------|--------|
| A | Missing test data / fixtures |
| B | Thin / non-atomic procedure |
| C | Soft / unverifiable Expected (+ no Ensure after Step) |
| D | Blank / incomplete case record |
| E | Missing login / session preamble |
| F | Weak BTMS navigation language (no hover→submenu) |
| G | Role / switch-user undefined |
| H | Cross-app without load ID / handoff |
| I | External EDI / Postman / Sterling oracle |
| J | View Load vs View Billing surface ambiguity |


Regenerate the seeded Will Automate example report with:

```bash
python commands/_generate_gap_html.py
```

Print Stage 3 tables in chat **and** point to the HTML path.

---

## Worked examples — Will Automate vs sample (detailing + missing data)

There is **no Case ID overlap** between the **28** gold samples and the 1,125 Will Automate rows. Comparisons use **same-domain pairs** (billingtoggle / dfb). Analysis date: **2026-07-15**.

**Portfolio signal (Will Automate):** median Test Steps ~**338** chars vs gold ~**3,742** (~**9%**); ~**258** cases with vague-data markers (`any load` / observe…); ~**182** with no detected fixture literals; **26** missing Steps or Expected.

### Example 1 — `117058` (Testmo) vs gold `67846`

| | Gold `67846` | Testmo `117058` |
|--|--------------|-----------------|
| Theme | Not Delivered Final → View Billing Agent + NDF | Invoice without document → Paperwork Received / NDF |
| Steps | **57** (~3.7k chars) | **3** (~155 chars) |
| Test data | `CORP`, `AGENT RESPONSE TEST CUSTOMER`, shipper/consignee, `FLATBED`, `LH Rate 500`… | **None** — “any load” |
| Expected | `"Agent"` + `"Not Delivered Final"` | “toggle updated **accordingly**” |
| **Verdict** | ROBUST | **INSUFFICIENT** |

| Step | Issue Type | What Testmo Says | Why It's a Problem | How to Fix It |
|------|------------|------------------|--------------------|---------------|
| 2 | Unresolved variable / undefined data | Navigate to **any load** and create invoice… | No office/customer/load/invoice fixture → empty `testData` | Spell create-load or load ID + invoice path like `67846` |
| 2–3 | Vague / ambiguous instruction | …Observe the View Billing screen | Observe ≠ assert; path undefined | Atomic nav + open View Billing |
| Expected | Unverifiable assertion | NDF logic… toggle updated accordingly | No Waiting On / tag value | Expect Waiting On `Agent` + NDF tag/checkbox |
| Case | Missing precondition | Load Status is not Delivered Final | No steps establish that load or billingtoggle user | Add role switch + status-producing steps |

### Example 2 — `117062` (Testmo) vs gold `74454`

| | Gold `74454` | Testmo `117062` |
|--|--------------|-----------------|
| Steps | **68** + Ensure after Step N | **4** observe steps |
| Test data | Full TL create + rates; View Load vs View Billing called out | Pre: “EDI invoice data available” — **no fields** |
| **Verdict** | ROBUST | **INSUFFICIENT** |

| Step | Issue Type | What Testmo Says | Why It's a Problem | How to Fix It |
|------|------------|------------------|--------------------|---------------|
| Pre | Unresolved variable / undefined data | EDI invoice data available | No amounts/dates/load key | Document EDI fixture columns + values |
| 2 | Unresolved variable / undefined data | any load + EDI without document | Date/price NDF logic needs known baselines | Create load with explicit delivered/rate/docs dates |
| Expected | Unverifiable assertion | set toggle accordingly as per date and price logic | Not assertable | Exact Agent/Billing + which tags on/off |

### Example 3 — `121250` (Testmo) vs gold `116909`

| | Gold `116909` | Testmo `121250` |
|--|---------------|-----------------|
| Detail | SSO → Finance → Billing Queue → columns named | Manager role → any load → try Billing/Neutral |
| Data | Filter preset `Last Week`; column labels in Expected | **Any** load; Expected “**seems** disabled” |
| **Verdict** | ROBUST (for its scope) | **INSUFFICIENT** |

| Step | Issue Type | What Testmo Says | Why It's a Problem | How to Fix It |
|------|------------|------------------|--------------------|---------------|
| 2 | Unresolved variable / undefined data | open any existing load | Status/role scenario needs known load | Load ID or create-to-status recipe |
| Pre | Missing precondition | Manager or less auth level | No username / switch-user steps | Name user + Switch Account steps |
| Expected | Unverifiable assertion | Drop down seems disabled | Subjective | Disabled/not selectable criteria |

### Example 4 — `27455` (Testmo) vs gold `25103`

| | Gold `25103` | Testmo `27455` |
|--|--------------|----------------|
| Data | **Field:Value** block (`BONDED CHEMICAL`, zips, `FLATBED`…) | “Enter the **valid values for all the fields**” |
| Expected | Exact alert about email for notifications | Booked + rate confirmation (no message text / app surface) |
| **Verdict** | ROBUST | **INSUFFICIENT** (data gap dominates) |

| Step | Issue Type | What Testmo Says | Why It's a Problem | How to Fix It |
|------|------------|------------------|--------------------|---------------|
| 4 | Unresolved variable / undefined data | valid values for all the fields | Largest agent blocker — zero extractable CSV fields | Add Field:Value lines like `25103` / `97739` |
| 7–9 | Unresolved variable / undefined data | add a carrier / select contact | Carrier auto-accept needs named contact | Name carrier + contact |
| Expected | Unverifiable assertion | status Booked… confirmation sent | No UI/message constants | Assert status + message + app |

### Example 5 — `27460` (Testmo) vs gold `97739`

Gold `97739` names customer (`MillerCoors Accessorial`), multi-app path, **Ensure after Step** with exact alert. Testmo `27460` still uses “valid values for all fields”, skips stable load ID before DME/TNX, Expected is one sentence for the whole cross-app flow → **INSUFFICIENT** (`Unresolved variable`, `Step dependency gap`, weak Expected).

### Example 6 — `349949` (Testmo) empty shell

Title only; **blank** Precondition / Test Steps / Expected → **INSUFFICIENT** (`Missing / blank expected result` + `Unresolved variable / undefined data`). Gold sample has **0%** empty core columns.

---

## Aggregate gap summary (Will Automate)

| Gap theme | Evidence |
|-----------|----------|
| **Missing test case data** | “any load”, “valid values for all fields”, empty EDI preconditions; ~182+ cases without fixture literals |
| Procedure thinness | Median steps ~9% of gold; ~220 cases with Steps &lt; 200 chars |
| Weak Expected | ~1,019 with no numbered expects; “accordingly” / “observe” language |
| Incomplete records | 26 missing Steps or Expected |
| Schema | After convert, 9 columns match gold — **not** the quality bottleneck |

**Conclusion:** convert columns, then **enrich data + atomics** to sample depth before agent generation. Prefer ROBUST/ADEQUATE only after fixtures and assertable Expected exist.

---

## Constraints

- Gap MODE is analysis-only — do not write `src/tests/**` or run Playwright unless user asks.  
- Reports only under `commands/reports/`.  
- Never invent office/customer/load values — flag as Issue Type **Unresolved variable / undefined data**.  
- Keep `sample-testcases.csv` as the gold catalog; Testmo files are an **import queue**.

---

## Related paths

| Path | Notes |
|------|------|
| `src/agent/examples/sample-testcases.csv` | Gold format + detail |
| `src/agent/examples/testmo-export-repository_Will Automate.csv` | Raw Will Automate export |
| `src/agent/examples/testmo-testcases.csv` | Converted 9-column queue |
| `commands/reports/Testmo-Gap-Analysis-Report.html` | ECS-style blocker HTML (themes A–J, gold bar = 28 samples) |
| `commands/_generate_gap_html.py` | Regenerates the example HTML report |
| `src/data/<category>/*.csv` | Runtime `testData` — must be referenced by step literals |
| `src/tests/AIAgent/<category>/*.spec.ts` | Reference / generated specs |
