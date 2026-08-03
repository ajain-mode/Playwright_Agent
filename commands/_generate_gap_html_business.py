"""Business-facing Testmo blocker HTML (does NOT overwrite Testmo-Gap-Analysis-Report.html)."""
from __future__ import annotations

from pathlib import Path

OUT = (
    Path(__file__).resolve().parent
    / "reports"
    / "Testmo-Export-Repository-Critical-Automation-Blocker-Analysis.html"
)

# Four consolidated issue categories — volume-ranked after CSV-aligned recount (1,125 cases).
CATEGORIES = [
    {
        "key": "A",
        "rank": "1 · Largest volume",
        "title": "Missing CSV-bound test data (category data files)",
        "volume": "799 of 1,125 cases (71.0%)",
        "definition": (
            "The agent parses concrete values from Precondition / Test Steps / Expected "
            "(via FieldRegistry) and writes them into runtime category CSVs such as "
            "<code>billingtoggledata.csv</code> and <code>dfbdata.csv</code> "
            "(columns like officeName, customerName, shipperName, consigneeName, equipmentType, "
            "loadMethod, qty/weight, offerRate/linehaulRate, zips, Carrier, loadId). "
            "This issue flags cases that <em>need</em> that runtime testData (create load, rates, "
            "customer/office search, EDI, etc.) but do not supply enough extractable field values "
            "(fewer than 3 CSV field families), or cite EDI/Postman/Sterling with no payload values."
        ),
        "volume_note": "Largest backlog issue under this CSV-aligned definition (~925 cases imply needing category CSV data; only ~145 have ≥3 extractable field families).",
        "covers": "Clubs: missing fixtures for category CSV · external EDI/Postman/Sterling without values",
        "business": "Without those values the pipeline cannot fill testData.* / category CSV rows, so generated specs guess or skip data setup.",
        "unblock": "Author Field:Value (or explicit “enter X as Y”) for every CSV-bound field the flow needs — same density as gold-standard cases in sample-testcases.csv.",
        "issues_clubbed": ["Missing test data / fixtures", "External EDI / Postman / Sterling without payload"],
        "cards": [
            {
                "id": "27455",
                "title": "“Enter the valid values for all the fields”",
                "steps": "Step 4",
                "issue": "Unresolved variable / undefined data",
                "gap": "No extractable officeName, customerName, shipper/consignee, equipmentType, or rates for dfbdata/billingtoggle CSV columns.",
                "resolution": "Add Field:Value lines that map to CSV columns (customer, shipper, FLATBED, TL, qty, rates…).",
                "gold": "25103 — Concrete Field:Value block pushed into category test data",
            },
            {
                "id": "117058",
                "title": "“Any load” — no CSV keys",
                "steps": "Step 2",
                "issue": "Unresolved variable / undefined data",
                "gap": "No loadId, customerName, officeName, or rate fields the agent can parse into billingtoggledata.csv.",
                "resolution": "Name office, customer, create-load field values (or a stable loadId) as in gold-standard BT cases.",
                "gold": "67846 — CORP, customer, shipper/consignee, FLATBED, LH Rate in steps → CSV",
            },
            {
                "id": "117062",
                "title": "EDI invoice “available” with no CSV/payload values",
                "steps": "Precondition; Step 2",
                "issue": "Unresolved variable / undefined data",
                "gap": "EDI mentioned but no amounts, dates, or load keys to store in category data or drive the flow.",
                "resolution": "Document EDI fixture fields or UI-entered invoice amounts that map to testData/CSV.",
                "gold": "74454 — Explicit finance/setup values in prose",
            },
        ],
    },
    {
        "key": "B",
        "rank": "2 · Next largest volume",
        "title": "Incomplete test procedures (not automation-ready)",
        "volume": "744 of 1,125 cases (66.1%)",
        "definition": (
            "Steps are too short (&lt;200 characters), unnumbered, start UI actions without login/sign-in, "
            "or use “navigate to…” without hover→submenu language the agent maps to "
            "<code>hoverOverHeaderByText</code> / submenu clicks. This is about <em>how</em> the case is written, "
            "not about category CSV columns."
        ),
        "volume_note": "Second-largest issue. Often overlaps with missing CSV data.",
        "covers": "Clubs: thin / non-atomic steps · missing login · weak navigation language",
        "business": "The agent cannot assemble a reliable Playwright path from summary or observe-only steps.",
        "unblock": "Gold-standard shape: login → hover menu → click submenu → enter named fields — one action per step.",
        "issues_clubbed": ["Thin / non-atomic procedure", "Missing login / session", "Weak BTMS navigation language"],
        "cards": [
            {
                "id": "117058",
                "title": "Only three high-level steps (~155 characters)",
                "steps": "Steps 1–3",
                "issue": "Vague / ambiguous instruction",
                "gap": "Open any load → create invoice → observe. No atomic create-load / document / View Billing path.",
                "resolution": "Expand to numbered office → customer → create load → invoice → View Billing.",
                "gold": "67846 — ~57 numbered steps",
            },
            {
                "id": "121250",
                "title": "“Navigate to the Loads tab” without a clear path",
                "steps": "Step 2",
                "issue": "Vague / ambiguous instruction",
                "gap": "No hover/submenu distinction for Load Search vs open-by-ID.",
                "resolution": "Hover Loads → Search/Open → enter load ID → open load form.",
                "gold": "116909 — Hover Finance → Billing Queue",
            },
            {
                "id": "117061",
                "title": "“Navigate to any load” — no search or field atomics",
                "steps": "Steps 1–3",
                "issue": "Vague / ambiguous instruction",
                "gap": "Price-difference invoice path is summarized; no load ID, invoice amounts, or hover→submenu steps.",
                "resolution": "Number: open load by ID → add carrier invoice with named rate delta → assert NDF + PRICE on View Billing.",
                "gold": "74454 — Explicit rates/dates and finance tag Expected",
            },
        ],
    },
    {
        "key": "C",
        "rank": "3 · Next volume band",
        "title": "Missing role switch & cross-application handoff",
        "volume": "410 of 1,125 cases (36.4%)",
        "definition": (
            "Case requires a specific role / Switch User / Switch Account, but does not name the user "
            "(or USER_ROLES-style constant) to select; and/or jumps to DME, TNX, or carrier portal "
            "without capturing a Load ID (or equivalent search key) for the next app. "
            "Distinct from category CSV field values — this is session identity and multi-app continuity."
        ),
        "volume_note": "Third band by volume.",
        "covers": "Clubs: role / switch-user undefined · cross-app without load ID / handoff",
        "business": "Specs cannot switch account or find the load in DME/TNX without guessing.",
        "unblock": "Name the user + Switch Account steps; after create, record Load ID; document each app switch + search.",
        "issues_clubbed": ["Role / switch-user undefined", "Cross-app without load ID / handoff"],
        "cards": [
            {
                "id": "121250",
                "title": "Manager-or-less role with no named user",
                "steps": "Precondition / role requirement",
                "issue": "Missing precondition",
                "gap": "Requires Manager-or-less auth but never names the Switch Account user / USER_ROLES target.",
                "resolution": "Name BTMS user / role constant + Switch Account steps before opening the load.",
                "gold": "BT-74421 — Explicit USER_ROLES.BILLINGTOGGLE_USER switch after login",
            },
            {
                "id": "121256",
                "title": "FINANCE+ role with no named user",
                "steps": "Precondition / role requirement",
                "issue": "Missing precondition",
                "gap": "Case depends on FINANCE+ permissions but never names who to Switch Account to.",
                "resolution": "Name the FINANCE+ user (or USER_ROLES constant) + Switch Account steps before View Billing.",
                "gold": "BT-74454 — Post-login role switch then View Billing asserts",
            },
            {
                "id": "27460",
                "title": "Goto DME / TNX with no switch or carrier detail",
                "steps": "Steps 11–13",
                "issue": "Step dependency gap",
                "gap": "Jumps to DME and TNX with no documented app-switch sequence, named carrier for the TNX dropdown, or per-app status asserts (Matched / Booked).",
                "resolution": "Write BTMS → DME → TNX switch steps; name the carrier to select; assert status on each app before returning to BTMS.",
                "gold": "97739 — Multi-app handoff with concrete outcomes",
            },
        ],
    },
    {
        "key": "D",
        "rank": "4 · Remaining volume band",
        "title": "Unclear Expected results & ambiguous screens",
        "volume": "248 of 1,125 cases (22.0%)",
        "definition": (
            "Expected is soft (“accordingly”, “seems disabled”); or Waiting On / NDF / billing toggle "
            "is discussed without naming <strong>View Load (Load tab)</strong> vs <strong>View Billing</strong> "
            "(different POMs / fields). "
            "This is about assertable outcomes and screen identity — not category CSV columns."
        ),
        "volume_note": "Fourth band by volume.",
        "covers": "Clubs: soft / unverifiable Expected · View Load vs View Billing ambiguity",
        "business": "Agent cannot place hard expects or picks the wrong page object for Waiting On / finance tags.",
        "unblock": "Expected = control + value (Ensure after Step N). Name View Load vs View Billing.",
        "issues_clubbed": [
            "Soft / unverifiable Expected",
            "View Load vs View Billing ambiguity",
        ],
        "cards": [
            {
                "id": "117058",
                "title": "“Toggle updated accordingly”",
                "steps": "Expected",
                "issue": "Unverifiable assertion",
                "gap": "No Waiting On value or NDF wording to assert.",
                "resolution": "Expect Waiting On = Agent and Not Delivered Final as applicable.",
                "gold": "67846 — Explicit Agent + Not Delivered Final Expected",
            },
            {
                "id": "117062",
                "title": "Billing toggle vs finance issues — which page?",
                "steps": "Steps 3–4",
                "issue": "Ambiguous / contradictory phrasing",
                "gap": "Does not state View Billing vs View Load for Waiting On / tags.",
                "resolution": "Name the screen so the correct POM is used.",
                "gold": "74454 — Explicit View Load vs View Billing split",
            },
            {
                "id": "117063",
                "title": "NDF “set toggle accordingly” — no exact values",
                "steps": "Expected",
                "issue": "Unverifiable assertion",
                "gap": "Expected says set billing toggle “accordingly as per the date and price logic” — no Waiting On value, NDF tag, or finance message to assert.",
                "resolution": "Expect Waiting On = Agent, Not Delivered Final tagged, and the finance message on View Billing.",
                "gold": "74454 — Explicit Waiting On / NDF / finance message Expected",
            },
        ],
    },
]

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Testmo Export Repository — Critical Automation Blocker Analysis</title>
<style>
  :root{
    --bg:#f6f7f9; --panel:#ffffff; --ink:#1a1d23; --muted:#5b6472; --line:#e4e7ec;
    --accent:#3257e6; --shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.10);
    --crit:#c0392b; --crit-bg:#fdecec;
    --a:#8e44ad; --b:#b9770e; --c:#1f7a5a; --d:#2b6fb3;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --bg:#0f1115; --panel:#181b21; --ink:#e8eaed; --muted:#9aa4b2; --line:#2a2f38;
      --accent:#7d97ff; --shadow:0 1px 2px rgba(0,0,0,.4);
      --crit:#ff7a6b; --crit-bg:#3a1f1c;
      --a:#c99be6; --b:#e6b566; --c:#6fce9f; --d:#7fb2ea;
    }
  }
  :root[data-theme="dark"]{
    --bg:#0f1115; --panel:#181b21; --ink:#e8eaed; --muted:#9aa4b2; --line:#2a2f38;
    --accent:#7d97ff; --crit:#ff7a6b; --crit-bg:#3a1f1c;
    --a:#c99be6; --b:#e6b566; --c:#6fce9f; --d:#7fb2ea;
  }
  :root[data-theme="light"]{
    --bg:#f6f7f9; --panel:#ffffff; --ink:#1a1d23; --muted:#5b6472; --line:#e4e7ec;
    --accent:#3257e6; --crit:#c0392b; --crit-bg:#fdecec;
    --a:#8e44ad; --b:#b9770e; --c:#1f7a5a; --d:#2b6fb3;
  }
  *{box-sizing:border-box}
  body{
    margin:0; background:var(--bg); color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    line-height:1.55; -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:960px; margin:0 auto; padding:32px 20px 80px}

  header.hero{
    background:var(--panel); border:1px solid var(--line); border-radius:16px;
    padding:28px 30px; box-shadow:var(--shadow); margin-bottom:24px; position:relative; overflow:hidden;
  }
  .hero::before{content:""; position:absolute; inset:0 auto 0 0; width:5px; background:var(--accent);}
  .eyebrow{font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); font-weight:700; margin:0 0 6px}
  h1{font-size:26px; margin:0 0 8px; letter-spacing:-.01em}
  .sub{color:var(--muted); font-size:14.5px; margin:0 0 12px}
  .preface{
    font-size:14.5px; color:var(--ink); background:var(--bg); border:1px solid var(--line);
    border-radius:10px; padding:14px 16px; margin:14px 0 0;
  }
  .preface strong{color:var(--ink)}
  .meta{margin-top:16px; display:flex; flex-wrap:wrap; gap:8px}
  .chip{font-size:12px; background:var(--bg); border:1px solid var(--line); border-radius:999px; padding:4px 11px; color:var(--muted)}

  .stats{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:0 0 26px}
  @media (max-width:720px){ .stats{grid-template-columns:repeat(2,1fr)} }
  .stat{background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; box-shadow:var(--shadow)}
  .stat .n{font-size:22px; font-weight:750; letter-spacing:-.02em; line-height:1.15}
  .stat .l{font-size:12px; color:var(--muted); margin-top:6px}
  .stat.crit .n{color:var(--crit)}

  .callout{
    background:var(--crit-bg); border:1px solid color-mix(in srgb,var(--crit) 35%, transparent);
    border-radius:12px; padding:14px 18px; margin-bottom:28px; font-size:14px;
  }
  .callout b{color:var(--crit)}

  h2.cat{
    font-size:15px; letter-spacing:.02em; margin:34px 0 4px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  }
  .catdot{width:11px; height:11px; border-radius:3px; flex:none}
  .vol{font-size:11.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--muted); background:var(--bg); border:1px solid var(--line); padding:3px 8px; border-radius:999px}
  .cat-desc{color:var(--muted); font-size:13.5px; margin:0 0 8px}
  .biz{font-size:14px; margin:0 0 10px}
  .clubs{font-size:12.5px; color:var(--muted); margin:0 0 14px}
  .A .catdot{background:var(--a)} .B .catdot{background:var(--b)}
  .C .catdot{background:var(--c)} .D .catdot{background:var(--d)}

  .card{
    background:var(--panel); border:1px solid var(--line); border-radius:12px;
    padding:18px 20px; margin-bottom:14px; box-shadow:var(--shadow); border-left:4px solid var(--line);
  }
  .A .card{border-left-color:var(--a)} .B .card{border-left-color:var(--b)}
  .C .card{border-left-color:var(--c)} .D .card{border-left-color:var(--d)}
  .card h3{margin:0 0 4px; font-size:16px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
  .tkt{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; background:var(--bg); border:1px solid var(--line); padding:2px 8px; border-radius:6px; color:var(--accent); font-weight:600}
  .badge{font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; background:var(--crit); padding:3px 8px; border-radius:999px; white-space:nowrap}
  .itype{font-size:10.5px; font-weight:600; color:var(--muted); background:var(--bg); border:1px solid var(--line); padding:3px 8px; border-radius:999px}
  .ttl{font-size:15px; font-weight:600}
  dl{margin:10px 0 0; display:grid; grid-template-columns:130px 1fr; gap:6px 16px}
  @media (max-width:560px){ dl{grid-template-columns:1fr; gap:2px 0} dl dt{margin-top:8px} }
  dt{font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:700; padding-top:2px}
  dd{margin:0; font-size:14px}
  dd code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; background:var(--bg); padding:1px 5px; border-radius:4px; border:1px solid var(--line)}
  .res{color:var(--ink)}
  .res::before{content:"→ "; color:var(--accent); font-weight:700}
  .goldline{font-size:12.5px; color:var(--muted); margin-top:8px}
  .goldline::before{content:"Gold standard · "; font-weight:700; color:var(--c)}

  .tablewrap{overflow-x:auto; margin:30px 0 10px; border:1px solid var(--line); border-radius:12px}
  table{border-collapse:collapse; width:100%; min-width:640px; background:var(--panel); font-size:13.5px}
  th,td{text-align:left; padding:11px 14px; border-bottom:1px solid var(--line); vertical-align:top}
  th{background:var(--bg); font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted)}
  tr:last-child td{border-bottom:none}

  h2.section{font-size:18px; margin:40px 0 6px; letter-spacing:-.01em}
  .sec-sub{color:var(--muted); font-size:13.5px; margin:0 0 12px}
  .toggle{position:fixed; top:16px; right:16px; background:var(--panel); border:1px solid var(--line); color:var(--muted); border-radius:8px; padding:7px 11px; font-size:12px; cursor:pointer; box-shadow:var(--shadow); z-index:5}
  footer{margin-top:40px; color:var(--muted); font-size:12.5px; text-align:center; border-top:1px solid var(--line); padding-top:20px}
  .k{font-weight:600; color:var(--ink)}
</style>
</head>
<body>
<button class="toggle" id="tg" type="button">◐ Theme</button>
<div class="wrap">

  <header class="hero">
    <p class="eyebrow">Business readiness review · QA AI Agent pipeline</p>
    <h1>Testmo Export Repository — Critical Automation Blocker Analysis</h1>
    <p class="sub">What in the Testmo test case export prevents reliable Playwright spec generation via the agent pipeline — and what to fix first.</p>
    <div class="preface">
      This review compares the Testmo export backlog (<strong>1,125</strong> cases) to the
      <strong>gold standard</strong>: <strong>28 executable test cases</strong> the agent has already completed,
      catalogued in <code>sample-testcases.csv</code>. Those 28 define the step detail, test data, and Expected
      results needed for dependable generation.
      <br><br>
      <span class="k">What we analysed:</span> whether each Testmo case is agent-ready (procedure depth, login/navigation language,
      fixtures, role/cross-app handoff, Expected clarity, and View Load vs View Billing wording).
      <br>
      <span class="k">How:</span> converted the export to the same columns as <code>sample-testcases.csv</code>; scored all
      <strong>1,125</strong> cases against the gold standard in <code>sample-testcases.csv</code>; detected extractable values that the agent would push into
      category CSVs (<code>billingtoggledata.csv</code>, <code>dfbdata.csv</code>, … via FieldRegistry);
      grouped blockers into <strong>four clearly defined, volume-ranked issues</strong>; and measured closeness to gold-standard procedure depth.
    </div>
    <div class="meta">
      <span class="chip">Source: testmo-export-repository_Will Automate.csv</span>
      <span class="chip">1,125 Testmo cases scored</span>
      <span class="chip">Gold standard: 28 cases in sample-testcases.csv</span>
      <span class="chip">Generated 2026-07-15</span>
    </div>
  </header>

  <h2 class="section">Issue volume across the 1,125 Testmo cases</h2>
  <p class="sec-sub">Each row is a consolidated blocker issue. Counts overlap — one case may hit more than one issue.</p>
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Issue</th>
          <th>Test cases affected</th>
          <th>% of 1,125</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="k">Missing CSV-bound test data</span> (values for <code>billingtoggledata.csv</code> / <code>dfbdata.csv</code> etc.)</td>
          <td>799</td>
          <td>71.0%</td>
        </tr>
        <tr>
          <td><span class="k">Incomplete procedures</span> (thin steps, weak navigation, missing login)</td>
          <td>744</td>
          <td>66.1%</td>
        </tr>
        <tr>
          <td><span class="k">Missing role switch &amp; cross-app handoff</span></td>
          <td>410</td>
          <td>36.4%</td>
        </tr>
        <tr>
          <td><span class="k">Unclear Expected results &amp; ambiguous screens</span></td>
          <td>248</td>
          <td>22.0%</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="stats">
    <div class="stat crit">
      <div class="n">4</div>
      <div class="l">Consolidated blocker issues (largest backlog volume first)</div>
    </div>
    <div class="stat">
      <div class="n">799</div>
      <div class="l">Cases affected by the top issue — missing CSV-bound test data (71.0% of 1,125)</div>
    </div>
    <div class="stat">
      <div class="n">111 · 75%</div>
      <div class="l">Closest to gold standard: 111 of 1,125 cases (~10%) are nearest in Test Steps detail to the 28 gold-standard cases; those 111 average about 75% of gold-standard procedure depth</div>
    </div>
    <div class="stat">
      <div class="n">2</div>
      <div class="l">Highest-leverage unblockers (see bottom line below)</div>
    </div>
  </div>

  <div class="callout">
    <b>Bottom line — two unblockers.</b>
    (1) <span class="k">Supply CSV-bound test data in the case prose</span> — office, customer, shipper/consignee, equipment, rates, etc. so the agent can populate <code>billingtoggledata.csv</code> / <code>dfbdata.csv</code> (clears most of the 799 cases).
    (2) <span class="k">Write automation-ready procedures + assertable Expected</span> — login, hover→submenu, numbered steps, and Expected as control + value on the named screen.
    Target the <span class="k">gold standard</span> in <code>sample-testcases.csv</code> (28 already-executed agent cases). Only <strong>111</strong> Testmo cases are closest in procedure detail to that gold standard, averaging about <strong>75%</strong> of its depth.
    Even among the <strong>145</strong> cases that already have CSV-bound data, <strong>122 (84%)</strong> still fail on Expected, role/cross-app, or procedure — only <strong>23</strong> clear the other three issues.
  </div>

  <h2 class="section">Even cases that already have CSV data still need work</h2>
  <p class="sec-sub">
    Only <strong>145</strong> of <strong>1,125</strong> cases (~13%) have enough extractable values to populate category CSVs
    (≥3 field families such as office, customer, shipper, rates). Having data is not enough for agent-ready specs.
  </p>
  <div class="stats">
    <div class="stat crit">
      <div class="n">122</div>
      <div class="l">Of those 145 (84%) still hit at least one of the other three issues</div>
    </div>
    <div class="stat">
      <div class="n">111</div>
      <div class="l">Also have unclear Expected / ambiguous screens (77% of the 145)</div>
    </div>
    <div class="stat">
      <div class="n">77</div>
      <div class="l">Also missing role switch or cross-app handoff (53% of the 145)</div>
    </div>
    <div class="stat">
      <div class="n">23</div>
      <div class="l">Only 23 of 145 (~16%) avoid all three other issues — the small “data-ready and cleaner” set</div>
    </div>
  </div>
__CATEGORY_SECTIONS__

  <h2 class="section">Issue categories — detail &amp; fixes (volume order)</h2>
  <p class="sec-sub">Same four issues as the volume table above, with the original ten blockers clubbed in and the business fix for each.</p>
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Volume rank</th>
          <th>Consolidated issue</th>
          <th>~Cases affected</th>
          <th>Original issues clubbed</th>
          <th>Business fix</th>
        </tr>
      </thead>
      <tbody>
__GLANCE_ROWS__
      </tbody>
    </table>
  </div>

  <footer>
    Testmo Export Repository · Critical Automation Blocker Analysis · business view.<br>
    Gold standard = 28 executable cases already completed by the agent · Does not replace
    <code>Testmo-Gap-Analysis-Report.html</code> (detailed technical companion).
  </footer>

</div>
<script>
  (function(){
    var btn=document.getElementById('tg');
    var root=document.documentElement;
    btn.addEventListener('click',function(){
      var cur=root.getAttribute('data-theme');
      if(!cur){ cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light'; }
      root.setAttribute('data-theme', cur==='dark'?'light':'dark');
    });
  })();
</script>
</body>
</html>
"""


def card_html(card: dict) -> str:
    return f"""
    <div class="card">
      <h3>
        <span class="tkt">{card["id"]}</span>
        <span class="ttl">{card["title"]}</span>
        <span class="badge">Blocker</span>
        <span class="itype">{card["issue"]}</span>
      </h3>
      <dl>
        <dt>Step ref</dt><dd>{card["steps"]}</dd>
        <dt>Gap</dt><dd>{card["gap"]}</dd>
        <dt>Resolution</dt><dd class="res">{card["resolution"]}</dd>
      </dl>
      <p class="goldline">{card["gold"]}</p>
    </div>
"""


def category_section(cat: dict) -> str:
    clubs = " · ".join(cat["issues_clubbed"])
    cards = "".join(card_html(c) for c in cat["cards"])
    return f"""
  <section class="{cat["key"]}">
    <h2 class="cat">
      <span class="catdot"></span>
      {cat["title"]}
      <span class="vol">{cat["rank"]} · {cat["volume"]}</span>
    </h2>
    <p class="cat-desc"><span class="k">Definition:</span> {cat["definition"]}</p>
    <p class="biz">{cat["business"]} {cat["volume_note"]}</p>
    <p class="clubs"><span class="k">Fix:</span> {cat["unblock"]}<br><span class="k">Clubs:</span> {clubs}</p>
    {cards}
  </section>
"""


def glance_row(cat: dict) -> str:
    clubs = "<br>".join(cat["issues_clubbed"])
    return f"""
        <tr>
          <td>{cat["rank"]}</td>
          <td><span class="k">{cat["title"]}</span></td>
          <td>{cat["volume"]}</td>
          <td>{clubs}</td>
          <td>{cat["unblock"]}</td>
        </tr>
"""


def main() -> None:
    sections = "".join(category_section(c) for c in CATEGORIES)
    glances = "".join(glance_row(c) for c in CATEGORIES)
    html = HTML.replace("__CATEGORY_SECTIONS__", sections).replace("__GLANCE_ROWS__", glances)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("Wrote", OUT)
    print("Left untouched: commands/reports/Testmo-Gap-Analysis-Report.html")


if __name__ == "__main__":
    main()
