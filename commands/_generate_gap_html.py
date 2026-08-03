"""Generate ECS-style Testmo vs sample gap HTML report (10 primary themes)."""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent / "reports" / "Testmo-Gap-Analysis-Report.html"

# 10 primary blocker themes (option A). Gold bar: sample-testcases.csv = 28 rows.
# Portfolio hits on Will Automate (1,125) are approximate and may overlap.
THEMES = [
    {
        "key": "A",
        "title": "A · Missing Test Data / Fixtures",
        "desc": "Office/customer/load/carrier/EDI values undefined — agent cannot populate category CSV or FieldRegistry extractions. (~101 “any load/X”; ~26 “valid values for all fields”)",
        "unblock": "Require Field:Value or named load ID on every create/search path — gold sample density",
        "tickets": "117058, 117062, 27455, 27460",
        "hit": "~127+",
        "cards": [
            {
                "id": "117058",
                "title": "Add Invoice without document → Paperwork Received / NDF",
                "steps": "Steps 2–3; Expected; Precondition",
                "issue": "Unresolved variable / undefined data",
                "gap": "Navigate to <b>any load</b> and create invoice with no office, customer, load ID, rates, or invoice fixture.",
                "resolution": "Spell create-load like gold <code>67846</code> (<code>CORP</code>, <code>AGENT RESPONSE TEST CUSTOMER</code>, shipper/consignee, <code>FLATBED</code>, LH Rate) + exact Waiting On / NDF asserts.",
                "gold": "67846 — 57 steps, full fixture chain to View Billing Agent + Not Delivered Final",
            },
            {
                "id": "117062",
                "title": "Carrier invoice via EDI triggers NDF",
                "steps": "Precondition; Step 2",
                "issue": "Unresolved variable / undefined data",
                "gap": "Precondition only <b>EDI invoice data available</b> — no message type, amounts, dates, or load key; step uses <b>any load</b>.",
                "resolution": "Document EDI fixture columns + create-load baselines; assert exact toggle/tags — gold <code>74454</code>.",
                "gold": "74454 — Explicit rates/dates and finance tag Expected",
            },
            {
                "id": "27455",
                "title": "TNX match + carrier auto accept",
                "steps": "Step 4; Steps 7–9",
                "issue": "Unresolved variable / undefined data",
                "gap": "<b>Enter the valid values for all the fields</b> — zero extractable fixtures; carrier/contact unnamed.",
                "resolution": "Field:Value block like gold <code>25103</code> / <code>97739</code>; name include-carrier + auto-accept contact.",
                "gold": "25103 — BONDED CHEMICAL, FLATBED, zips…",
            },
            {
                "id": "27460",
                "title": "Auto post minimum fields — TNX match",
                "steps": "Step 4",
                "issue": "Unresolved variable / undefined data",
                "gap": "Minimum-fields scenario never lists the minimum set; still “valid values for all fields”.",
                "resolution": "Enumerate each minimum field + value before save/post.",
                "gold": "97739 — Named customer + concrete form values",
            },
        ],
    },
    {
        "key": "B",
        "title": "B · Thin / Non-Atomic Procedure",
        "desc": "Steps collapsed into short or unnumbered mush — StepMappings cannot bind atomic actions. (~220 Steps &lt;200 chars; ~183 unnumbered)",
        "unblock": "Number every atomic UI action; target gold-like depth for E2E flows",
        "tickets": "117058, 121250",
        "hit": "~220",
        "cards": [
            {
                "id": "117058",
                "title": "Three-step observe flow (~155 chars)",
                "steps": "Steps 1–3",
                "issue": "Vague / ambiguous instruction",
                "gap": "Login → any load → observe. No create-load atomics; gold median procedure is ~3.7k chars.",
                "resolution": "Expand to numbered path (office → customer → CREATE TL → invoice → View Billing) like <code>67846</code>.",
                "gold": "67846 — ~57 numbered steps",
            },
            {
                "id": "121250",
                "title": "Four short steps for role×status scenario",
                "steps": "Steps 1–4",
                "issue": "Vague / ambiguous instruction",
                "gap": "Complex auth+status rule compressed into four steps without fixtures or UI atomics.",
                "resolution": "Split switch-user, open known load, attempt Billing/Neutral, assert disabled with criteria.",
                "gold": "116909 — Nine clear SSO→Finance→assert steps",
            },
        ],
    },
    {
        "key": "C",
        "title": "C · Soft / Unverifiable Expected (+ no Ensure after Step)",
        "desc": "Expected uses “accordingly / seems / correctly” or long flows lack step-tied asserts. (~37 soft Expected; ~224 long flows without Ensure after Step N)",
        "unblock": "Every Expected names control + value; use Ensure after Step N on multi-check flows",
        "tickets": "117058, 121250, 27455",
        "hit": "~224",
        "cards": [
            {
                "id": "117058",
                "title": "Toggle updated accordingly",
                "steps": "Expected",
                "issue": "Unverifiable assertion",
                "gap": "No Waiting On value (Agent/Billing) and no NDF checkbox/tag wording.",
                "resolution": "Expect Waiting On = <code>Agent</code>; Not Delivered Final / Not Deliv. Final checked.",
                "gold": "67846 Expected — Agent + Not Delivered Final",
            },
            {
                "id": "121250",
                "title": "Dropdown seems disabled",
                "steps": "Expected",
                "issue": "Unverifiable assertion",
                "gap": "<b>Seems</b> is subjective — no option-level pass criterion.",
                "resolution": "Billing/Neutral not selectable (or control disabled) for the stated role/status.",
                "gold": "116909 — Exact column labels after Step 9",
            },
            {
                "id": "27455",
                "title": "Booked + confirmation with no Ensure after Step",
                "steps": "Expected",
                "issue": "Unverifiable assertion",
                "gap": "One sentence for multi-app outcome; no mid-flow Ensure after Step N.",
                "resolution": "Per-app Ensure after Step blocks with message/status text — gold <code>97739</code>.",
                "gold": "97739 — Ensure after Step + exact alert",
            },
        ],
    },
    {
        "key": "D",
        "title": "D · Blank / Incomplete Case Record",
        "desc": "Missing Test Steps and/or Expected — nothing to map or assert. (~26 cases)",
        "unblock": "Gate empty shells out of the automation queue until authored",
        "tickets": "349949",
        "hit": "26",
        "cards": [
            {
                "id": "349949",
                "title": "Payment Module — dropdowns enabled (empty shell)",
                "steps": "All columns",
                "issue": "Missing / blank expected result",
                "gap": "Title + tags only — blank Precondition, Test Steps, Expected.",
                "resolution": "Author full procedure + invoice fixture + Expected before agent enqueue.",
                "gold": "Any of 28 gold rows — Steps and Expected always filled",
            },
        ],
    },
    {
        "key": "E",
        "title": "E · Missing Login / Session Preamble",
        "desc": "Click/hover/navigate without establishing BTMS (or other app) login in steps/pre. (~219 cases)",
        "unblock": "Start every UI case with login/SSO (or explicit “already logged in” precondition + how)",
        "tickets": "7903, 24734",
        "hit": "~219",
        "cards": [
            {
                "id": "7903",
                "title": "Admin Tools Banayan link / status records",
                "steps": "Test Steps start",
                "issue": "Missing precondition",
                "gap": "Procedure starts at hover/Admin Tools with login only weakly assumed in Precondition (“Agent must be logged into BTMS”) — no SSO atomics for agent mandatory-login bands.",
                "resolution": "Add explicit Login/SSO steps like gold samples, then Admin Tools path.",
                "gold": "116909 / 74454 — SSO steps 1–5 before first header hover",
            },
            {
                "id": "24734",
                "title": "Click/hover path without login in body",
                "steps": "Test Steps + Precondition",
                "issue": "Missing precondition",
                "gap": "Navigation actions present while login/sign-in language absent from steps+pre (portfolio pattern).",
                "resolution": "Inject BTMSLogin-equivalent step prose before first header action.",
                "gold": "All 28 gold cases include login/sign-in wording",
            },
        ],
    },
    {
        "key": "F",
        "title": "F · Weak BTMS Navigation Language",
        "desc": "“Navigate to X” without hover header → click submenu — weak POM binding for <code>hoverOverHeaderByText</code> / submenus. (~507 cases)",
        "unblock": "Prefer Hover &lt;HEADER&gt; → Click &lt;SUBMENU&gt; → page/field language",
        "tickets": "117058, 121250, 27455",
        "hit": "~507",
        "cards": [
            {
                "id": "121250",
                "title": "Navigate to the Loads tab…",
                "steps": "Step 2",
                "issue": "Vague / ambiguous instruction",
                "gap": "Does not distinguish Load Search vs open-by-ID vs other Loads entry points.",
                "resolution": "Hover Loads → Search/Open → enter load ID → open load form.",
                "gold": "116909 — Hover Finance → Billing Queue",
            },
            {
                "id": "27455",
                "title": "Navigate to the load tab / Create load",
                "steps": "Steps 2–3",
                "issue": "Vague / ambiguous instruction",
                "gap": "Run-on navigations without Customers → CREATE TL *NEW* style used in gold DFB/billing paths.",
                "resolution": "Match gold create-load entry (Customers search → CREATE TL *NEW*) when that is the real path.",
                "gold": "97739 / 67846 — Customers → CREATE TL *NEW*",
            },
        ],
    },
    {
        "key": "G",
        "title": "G · Role / Switch-User Undefined",
        "desc": "Role, Manager-or-less, permission, or switch-user language without named account / USER_ROLES steps. (~288 cases)",
        "unblock": "Name the user + Switch Account steps (billingtoggle: BILLINGTOGGLE_USER pattern)",
        "tickets": "121250",
        "hit": "~288",
        "cards": [
            {
                "id": "121250",
                "title": "Manager or less cannot set Billing/Neutral",
                "steps": "Precondition; Steps after login",
                "issue": "Missing precondition",
                "gap": "Requires Manager-or-less auth but no username or switch-account atomics after login.",
                "resolution": "Name BTMS user / role constant + click switch account → select user — same explicitness as billingtoggle user switch rules.",
                "gold": "Billingtoggle gold specs always encode post-login role switch when required",
            },
        ],
    },
    {
        "key": "H",
        "title": "H · Cross-App Without Load ID / Handoff",
        "desc": "DME/TNX/portal steps without capturing load ID or documenting app switch. (~286 cross-app; ~175 without load-ID capture)",
        "unblock": "After create: capture Load ID; spell switchToDME/TNX + search field values",
        "tickets": "27455, 27460",
        "hit": "~175",
        "cards": [
            {
                "id": "27460",
                "title": "Goto DME / Goto TNX after save",
                "steps": "Steps 11–13",
                "issue": "Step dependency gap",
                "gap": "Searches “the load” in DME/TNX but prior steps never say to note Load ID or how to switch apps.",
                "resolution": "Capture Load ID after create; document app switch + search — gold <code>97739</code> multi-app pattern.",
                "gold": "97739 / DFB-97739 — Explicit BTMS↔DME/TNX handoff in curated specs",
            },
            {
                "id": "27455",
                "title": "Goto DME and search that the load is posted",
                "steps": "Step 11",
                "issue": "Step dependency gap",
                "gap": "No search key; status “come a…” incomplete; agent cannot bind MultiAppManager steps safely.",
                "resolution": "Named load ID + assert posted status on named DME surface.",
                "gold": "97739 — Ensure after Step with concrete outcomes",
            },
        ],
    },
    {
        "key": "I",
        "title": "I · External EDI / Postman / Sterling Oracle",
        "desc": "Pass/fail depends on EDI, Postman, Sterling, or outbound enqueue without a harness-visible oracle or fixture. (~141 cases)",
        "unblock": "Commit EDI/Postman fixtures + in-app observable asserts (or declare out-of-scope for UI agent)",
        "tickets": "117062, 8026",
        "hit": "~141",
        "cards": [
            {
                "id": "117062",
                "title": "EDI invoice without document",
                "steps": "Precondition; Step 2",
                "issue": "Unresolved variable / undefined data",
                "gap": "EDI invoice “available” with no payload; UI steps assume injection the harness cannot see.",
                "resolution": "Document tool/payload or seed via documented UI path; assert in-app NDF/toggle after.",
                "gold": "74454 — In-app finance asserts after documented setup",
            },
            {
                "id": "8026",
                "title": "EDI outbound 204/214/404/990/210 to Sterling",
                "steps": "Steps + Expected",
                "issue": "Non-deterministic / untestable",
                "gap": "Expected worker enqueue (<code>edi_outbound_0_high</code>) is infra-level — not a BTMS UI assert the agent normally generates.",
                "resolution": "Split UI creates vs infra verification; supply API/queue check ownership or re-scope Expected to on-screen status.",
                "gold": "UI gold samples assert on-screen messages/fields, not worker queues",
            },
        ],
    },
    {
        "key": "J",
        "title": "J · View Load vs View Billing Surface Ambiguity",
        "desc": "Waiting On / NDF / toggle checks without saying View Load (Load tab) vs View Billing — wrong POM if blurred. (~109 billing-toggle related; ~15 clear ambiguous)",
        "unblock": "Name the screen: View Load + Load tab helpers vs View Billing finance block",
        "tickets": "117058, 117062",
        "hit": "~109",
        "cards": [
            {
                "id": "117058",
                "title": "Observe the View Billing screen (NDF / toggle)",
                "steps": "Step 3; Expected",
                "issue": "Ambiguous / contradictory phrasing",
                "gap": "Mentions View Billing but Expected speaks generically of NDF/toggle; does not separate Load-tab Waiting On vs billing.php Waiting On.",
                "resolution": "After View Billing open → LoadBillingPage-style asserts; if also Load tab → say so (gold <code>74454</code>).",
                "gold": "74454 — Explicit View Billing vs View Load Waiting On split",
            },
            {
                "id": "117062",
                "title": "Observe Billing toggle and Finance issues",
                "steps": "Steps 3–4",
                "issue": "Ambiguous / contradictory phrasing",
                "gap": "Finance issues / toggle without naming which page owns <code>#fi_waiting_on</code> display.",
                "resolution": "State View Billing for billing issues block; View Load Load tab for select Waiting On display.",
                "gold": "74454 REFERENCE_PATTERNS billing toggle View Load vs View Billing",
            },
        ],
    },
]

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Testmo Export Repository · Critical Automation Blocker Analysis</title>
<style>
  :root{
    --bg:#f6f7f9; --panel:#ffffff; --ink:#1a1d23; --muted:#5b6472; --line:#e4e7ec;
    --accent:#3257e6; --shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.10);
    --crit:#c0392b; --crit-bg:#fdecec;
    --a:#8e44ad; --b:#b9770e; --c:#1f7a5a; --d:#2b6fb3;
    --e:#c0392b; --f:#16a085; --g:#d35400; --h:#2980b9; --i:#7f8c8d; --j:#8e44ad;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --bg:#0f1115; --panel:#181b21; --ink:#e8eaed; --muted:#9aa4b2; --line:#2a2f38;
      --accent:#7d97ff; --shadow:0 1px 2px rgba(0,0,0,.4);
      --crit:#ff7a6b; --crit-bg:#3a1f1c;
      --a:#c99be6; --b:#e6b566; --c:#6fce9f; --d:#7fb2ea;
      --e:#ff8a7a; --f:#5ee0c5; --g:#ffb070; --h:#7ec0ee; --i:#c0c6ca; --j:#d2a8f0;
    }
  }
  :root[data-theme="dark"]{
    --bg:#0f1115; --panel:#181b21; --ink:#e8eaed; --muted:#9aa4b2; --line:#2a2f38;
    --accent:#7d97ff; --crit:#ff7a6b; --crit-bg:#3a1f1c;
    --a:#c99be6; --b:#e6b566; --c:#6fce9f; --d:#7fb2ea;
    --e:#ff8a7a; --f:#5ee0c5; --g:#ffb070; --h:#7ec0ee; --i:#c0c6ca; --j:#d2a8f0;
  }
  :root[data-theme="light"]{
    --bg:#f6f7f9; --panel:#ffffff; --ink:#1a1d23; --muted:#5b6472; --line:#e4e7ec;
    --accent:#3257e6; --crit:#c0392b; --crit-bg:#fdecec;
    --a:#8e44ad; --b:#b9770e; --c:#1f7a5a; --d:#2b6fb3;
    --e:#c0392b; --f:#16a085; --g:#d35400; --h:#2980b9; --i:#7f8c8d; --j:#8e44ad;
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
  .sub{color:var(--muted); font-size:14.5px; margin:0}
  .meta{margin-top:16px; display:flex; flex-wrap:wrap; gap:8px}
  .chip{font-size:12px; background:var(--bg); border:1px solid var(--line); border-radius:999px; padding:4px 11px; color:var(--muted)}

  .stats{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:0 0 26px}
  @media (max-width:640px){ .stats{grid-template-columns:repeat(2,1fr)} }
  .stat{background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; box-shadow:var(--shadow)}
  .stat .n{font-size:28px; font-weight:750; letter-spacing:-.02em}
  .stat .l{font-size:12px; color:var(--muted); margin-top:2px}
  .stat.crit .n{color:var(--crit)}

  .callout{
    background:var(--crit-bg); border:1px solid color-mix(in srgb,var(--crit) 35%, transparent);
    border-radius:12px; padding:14px 18px; margin-bottom:28px; font-size:14px;
  }
  .callout b{color:var(--crit)}

  h2.cat{
    font-size:15px; letter-spacing:.02em; margin:34px 0 4px; display:flex; align-items:center; gap:10px;
  }
  .catdot{width:11px; height:11px; border-radius:3px; flex:none}
  .cat-desc{color:var(--muted); font-size:13.5px; font-style:italic; margin:0 0 14px}
  .A .catdot{background:var(--a)} .B .catdot{background:var(--b)}
  .C .catdot{background:var(--c)} .D .catdot{background:var(--d)}
  .E .catdot{background:var(--e)} .F .catdot{background:var(--f)}
  .G .catdot{background:var(--g)} .H .catdot{background:var(--h)}
  .I .catdot{background:var(--i)} .J .catdot{background:var(--j)}

  .card{
    background:var(--panel); border:1px solid var(--line); border-radius:12px;
    padding:18px 20px; margin-bottom:14px; box-shadow:var(--shadow); border-left:4px solid var(--line);
  }
  .A .card{border-left-color:var(--a)} .B .card{border-left-color:var(--b)}
  .C .card{border-left-color:var(--c)} .D .card{border-left-color:var(--d)}
  .E .card{border-left-color:var(--e)} .F .card{border-left-color:var(--f)}
  .G .card{border-left-color:var(--g)} .H .card{border-left-color:var(--h)}
  .I .card{border-left-color:var(--i)} .J .card{border-left-color:var(--j)}
  .card h3{margin:0 0 4px; font-size:16px; display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
  .tkt{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; background:var(--bg); border:1px solid var(--line); padding:2px 8px; border-radius:6px; color:var(--accent); font-weight:600}
  .badge{font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; background:var(--crit); padding:3px 8px; border-radius:999px; white-space:nowrap}
  .itype{font-size:10.5px; font-weight:600; letter-spacing:.02em; color:var(--muted); background:var(--bg); border:1px solid var(--line); padding:3px 8px; border-radius:999px}
  .ttl{font-size:15px; font-weight:600}
  dl{margin:10px 0 0; display:grid; grid-template-columns:130px 1fr; gap:6px 16px}
  @media (max-width:560px){ dl{grid-template-columns:1fr; gap:2px 0} dl dt{margin-top:8px} }
  dt{font-size:11.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:700; padding-top:2px}
  dd{margin:0; font-size:14px}
  dd code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; background:var(--bg); padding:1px 5px; border-radius:4px; border:1px solid var(--line)}
  .res{color:var(--ink)}
  .res::before{content:"→ "; color:var(--accent); font-weight:700}
  .goldline{font-size:12.5px; color:var(--muted); margin-top:8px}
  .goldline::before{content:"Gold bar · "; font-weight:700; color:var(--c)}

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
    <p class="eyebrow">Automation Readiness Review · Agent Pipeline</p>
    <h1>Testmo Export Repository — Critical Automation Blocker Analysis</h1>
    <p class="sub">Ten primary blocker themes that prevent reliable agent generation from Testmo prose versus gold
    <code>sample-testcases.csv</code> (28 cases). Deep cards are representative; hit counts are portfolio-wide on Will Automate (1,125). Analysis-only.</p>
    <div class="meta">
      <span class="chip">Source: testmo-export-repository_Will Automate.csv</span>
      <span class="chip">1,125 Testmo backlog</span>
      <span class="chip">10 primary themes</span>
      <span class="chip">Gold bar: 28 sample-testcases</span>
      <span class="chip">Platform: BTMS QA AI Agent</span>
      <span class="chip">Generated 2026-07-15</span>
    </div>
  </header>

  <div class="stats">
    <div class="stat crit"><div class="n">10</div><div class="l">Primary blocker themes</div></div>
    <div class="stat"><div class="n">~593</div><div class="l">Cases with ≥3 theme hits</div></div>
    <div class="stat"><div class="n">~9%</div><div class="l">Median steps depth vs gold</div></div>
    <div class="stat"><div class="n">2</div><div class="l">Highest-leverage fixes</div></div>
  </div>

  <div class="callout">
    <b>Bottom line.</b> Two unblockers clear most agent failures:
    (1) <span class="k">concrete fixtures</span> (Field:Value / named load — themes A, G, H, I), and
    (2) <span class="k">atomic steps + assertable Expected</span> (themes B, C, E, F, J).
    Themes D–J are not optional extras — login, nav language, role switch, cross-app handoff, EDI oracles, and View Load vs View Billing surface naming regularly block generation even when some data exists.
  </div>

__THEME_SECTIONS__

  <h2 class="section">All 10 themes at a glance</h2>
  <p class="sec-sub">Single unblocking action + approximate Will Automate hit count (overlapping).</p>
  <div class="tablewrap">
    <table>
      <thead>
        <tr><th>Theme</th><th>~Hits</th><th>Example Case IDs</th><th>Single unblocking action</th></tr>
      </thead>
      <tbody>
__GLANCE_ROWS__
      </tbody>
    </table>
  </div>

  <footer>
    Testmo Export Repository · Critical Automation Blocker Analysis · 10 primary themes · Gold catalog: 28 sample-testcases.<br>
    Representative blocker cards + portfolio hit estimates. Not a live execution report.
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


def theme_section(theme: dict) -> str:
    cards = "".join(card_html(c) for c in theme["cards"])
    return f"""
  <section class="{theme["key"]}">
    <h2 class="cat"><span class="catdot"></span>{theme["title"]}</h2>
    <p class="cat-desc">{theme["desc"]}</p>
    {cards}
  </section>
"""


def glance_row(theme: dict) -> str:
    return f"""
        <tr>
          <td><span class="k">{theme["title"]}</span></td>
          <td>{theme["hit"]}</td>
          <td>{theme["tickets"]}</td>
          <td>{theme["unblock"]}</td>
        </tr>
"""


def main() -> None:
    sections = "".join(theme_section(t) for t in THEMES)
    glances = "".join(glance_row(t) for t in THEMES)
    html = HTML.replace("__THEME_SECTIONS__", sections).replace("__GLANCE_ROWS__", glances)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print("Wrote", OUT)
    print("Themes:", len(THEMES))


if __name__ == "__main__":
    main()
