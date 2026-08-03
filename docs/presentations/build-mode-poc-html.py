#!/usr/bin/env python3
"""Build Mode QA AI POC.html with embedded workflow SVG and reusability section."""
import re
from pathlib import Path

BASE = Path(__file__).parent
HTML_PATH = BASE / "Mode QA AI POC.html"
SVG_PATH = BASE / "qa-agent-architecture-workflow.svg"

html = HTML_PATH.read_text(encoding="utf-8")
svg = SVG_PATH.read_text(encoding="utf-8").strip()

pattern = r'    <div class="diagram-wrap">.*?</div>\s*\n\s*<div class="level-grid">'
replacement = f'''    <div class="diagram-wrap">
      <div class="diagram-title">Agent Architecture Workflow</div>
      {svg}
      <p style="font-size:12px;color:var(--text-light);text-align:center;margin-top:12px;">Workflow source: <code>qa-agent-architecture-workflow.svg</code> (embedded for standalone sharing)</p>
    </div>

    <div class="level-grid">'''
html = re.sub(pattern, replacement, html, count=1, flags=re.DOTALL)

html = html.replace(
    "<title>QA AI POC — Summary and Progression Timeline</title>",
    "<title>Mode QA AI POC</title>",
)
html = html.replace(
    '<a href="#architecture" class="nav-link">→ Agent architecture &amp; pipeline diagram</a>',
    '<a href="#architecture" class="nav-link">→ Agent architecture workflow</a> &nbsp;·&nbsp; '
    '<a href="#reusability" class="nav-link">→ QA daily reuse guide</a>',
)
html = html.replace(
    "<h2>Agent Architecture — What the Pipeline Does at Each Level</h2>",
    "<h2>Agent Architecture Workflow — What the Pipeline Does at Each Level</h2>",
)
html = html.replace("max-width: 920px;", "max-width: 880px;")

reusability_css = """
  /* Reusability */
  .reuse-summary { background: linear-gradient(135deg, #ebf8ff 0%, #f0fff4 100%); border: 1px solid #90cdf4; border-radius: 12px; padding: 28px 32px; margin-bottom: 28px; font-size: 15px; }
  .reuse-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
  .reuse-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 22px; border-top: 3px solid var(--accent); }
  .reuse-card h3 { font-size: 15px; color: var(--primary); margin-bottom: 8px; }
  .reuse-card p, .reuse-card li { font-size: 13px; }
  .reuse-card ul { padding-left: 18px; margin-top: 8px; }
  .reuse-card li { margin-bottom: 6px; }
  .reuse-card code { font-size: 12px; background: var(--bg); padding: 2px 6px; border-radius: 4px; }
  .daily-flow { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; margin: 20px 0 28px; }
  .daily-step { background: #fffaf0; border: 1px solid #fbd38d; border-radius: 10px; padding: 12px 14px; font-size: 12px; font-weight: 600; color: #c05621; text-align: center; max-width: 140px; }
  @media (max-width: 900px) { .reuse-grid { grid-template-columns: 1fr; } }
"""

html = html.replace(
    "  @media (max-width: 900px) { .phase-grid",
    reusability_css + "  @media (max-width: 900px) { .phase-grid",
)

reusability_section = """
<!-- QA REUSABILITY -->
<div class="section" id="reusability" style="background:#fff; border-top:1px solid var(--border); max-width:none;">
  <div style="max-width:1100px;margin:0 auto;">
    <h2>Agent Reusability — How QA Uses This in Daily Test Execution</h2>

    <div class="reuse-summary">
      <strong>Summary:</strong> The QA AI Agent is not a one-time POC deliverable — it is a <strong>repeatable production tool</strong> wired into the same Playwright framework QA already runs.
      Every new detailed testcase can flow through the same workflow (Steps 0–5) to produce a validated script; every execution cycle makes the next generation better.
      The 28 POC scripts are the starting regression suite in CI; the agent, CLI, patterns, and governance rules stay in the repo for ongoing use by Mode Global QA after July handover.
    </div>

    <h3 style="font-size:18px;color:var(--primary);margin-bottom:12px;">Daily QA workflow with the agent</h3>
    <div class="daily-flow">
      <div class="daily-step">1. Write or export testcase with full steps and expected results</div>
      <span class="flow-arrow">→</span>
      <div class="daily-step">2. Run agent CLI to generate or preview the spec</div>
      <span class="flow-arrow">→</span>
      <div class="daily-step">3. Review generated script and run locally or in CI</div>
      <span class="flow-arrow">→</span>
      <div class="daily-step">4. Check Allure report and Testmo results</div>
      <span class="flow-arrow">→</span>
      <div class="daily-step">5. Log feedback; retrain patterns or regenerate</div>
    </div>

    <div class="reuse-grid">
      <div class="reuse-card">
        <h3>Run existing POC suites (regression)</h3>
        <ul>
          <li>Execute all 28 AI-generated specs already deployed in CI — 24 billing toggle + 4 DFB under <code>src/tests/AIAgent/</code></li>
          <li>Run a single spec: <code>npx playwright test src/tests/AIAgent/billingtoggle/BT-74454.spec.ts</code></li>
          <li>Full suite with Allure: <code>npm run test:allure</code> then submit to Testmo: <code>npm run submit:testmo</code></li>
        </ul>
      </div>
      <div class="reuse-card">
        <h3>Generate a new script from a testcase</h3>
        <ul>
          <li>Interactive (recommended for first use): <code>npm run agent:cli</code></li>
          <li>From CSV / Excel / JSON: <code>npm run agent -- --file path/to/testcase.csv</code></li>
          <li>Preview without saving: <code>npm run agent:preview "Login BTMS and verify load status"</code></li>
          <li>Batch for a folder: <code>npm run agent:batch ./path/to/testcases/</code></li>
        </ul>
      </div>
      <div class="reuse-card">
        <h3>Prepare testcases the agent can reuse</h3>
        <ul>
          <li>Include <strong>numbered steps and explicit expected results</strong> — the Coverage Ensurer maps these 1:1 to assertions</li>
          <li>Add runtime data to the category CSV under <code>src/data/&lt;category&gt;/</code> or let the agent enrich missing fields</li>
          <li>Maintain canonical steps in <code>src/agent/examples/sample-testcases.csv</code> for traceability</li>
          <li>Similar cases adapt faster from reference specs in the same category (billing toggle, DFB, etc.)</li>
        </ul>
      </div>
      <div class="reuse-card">
        <h3>Continuous improvement (the POC feedback loop)</h3>
        <ul>
          <li>When a generated script fails or needs a manual fix, document the gap — pattern library and guardrails are updated so the <strong>next</strong> generation is correct</li>
          <li>Analyze before generating: <code>npm run agent:analyze "your testcase description"</code></li>
          <li>Governance rules in <code>.cursor/rules/</code> and SpecValidator guardrails keep output consistent with team standards</li>
          <li>Handover doc <code>docs/handover/QA-AI-Agent-Handover.docx</code> covers setup, env vars, and full CLI reference</li>
        </ul>
      </div>
    </div>

    <div class="closure-banner" style="margin-top:8px;">
      <strong>Takeaway for Mode Global QA:</strong> Use the agent for <em>new</em> automation (generate → review → CI), use the 28 POC specs for <em>ongoing</em> regression, and keep feeding execution feedback into the pipeline so each sprint needs less manual script work than the last.
    </div>
  </div>
</div>

"""

if 'id="reusability"' not in html:
    html = html.replace('<div class="footer">', reusability_section + '<div class="footer">')
html = html.replace(
    "QA AI POC — Summary and Progression Timeline · SunTeck TMS · June 2026",
    "Mode QA AI POC · SunTeck TMS · July 2026",
)

HTML_PATH.write_text(html, encoding="utf-8")
print(f"Updated {HTML_PATH}")
