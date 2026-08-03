/**
 * Capture HTML presentation sections as PNGs for PPT v2 assembly.
 * In-page element screenshots — exact text and styling from agentic-system-slides.html.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const HTML = path.join(ROOT, 'agentic-system-slides.html');
const OUT_DIR = path.join(ROOT, 'pptx-v2-captures');

/** @type {{ name: string; selector: string }[]} */
const CAPTURES = [
  { name: '01-cover', selector: '.cover' },
  { name: '02-toc', selector: '.toc' },
  { name: '04-agents', selector: '#pipeline .card-grid-4' },
  { name: '05-coverage-ensurer', selector: '#pipeline > .card.agent-card' },
  { name: '06-kpis', selector: '#pipeline .kpi-grid' },
  { name: '07-diagram', selector: '#pipeline .diagram-container' },
  { name: '08-ai-calls', selector: '#pipeline > .card:nth-child(8)' },
  { name: '09-agent-roster', selector: '#pipeline > .card:nth-child(9)' },
  { name: '10-in-out', selector: '#pipeline > .card-grid' },
  { name: '11-governance', selector: '#pipeline > .card:nth-child(11)' },
  { name: '12-section2-header', selector: '#upstream-gaps .section-header' },
  { name: '13-impact-banner', selector: '#upstream-gaps .impact-banner' },
  { name: '14-gap-1', selector: '#upstream-gaps .issue-card:nth-child(1)' },
  { name: '15-gap-2', selector: '#upstream-gaps .issue-card:nth-child(2)' },
  { name: '16-gap-3', selector: '#upstream-gaps .issue-card:nth-child(3)' },
  { name: '17-gap-4', selector: '#upstream-gaps .issue-card:nth-child(4)' },
  { name: '18-next-steps', selector: '#upstream-gaps > .card' },
  { name: '19-footer', selector: '.footer' },
];

async function captureSection(page, selector, outPath) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 15000 });
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await loc.screenshot({ path: outPath, type: 'png' });
}

(async () => {
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT_DIR, f));
    }
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const fileUrl = `file:///${HTML.replace(/\\/g, '/')}`;
  await page.goto(fileUrl, { waitUntil: 'load' });

  for (const { name, selector } of CAPTURES) {
    const outPath = path.join(OUT_DIR, `${name}.png`);
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await captureSection(page, selector, outPath);
      console.log(`Captured: ${name}`);
    } catch (err) {
      console.error(`Failed ${name} (${selector}): ${err.message}`);
    }
  }

  // Section 1 intro: header + success banner + paragraph
  try {
    await page.locator('#pipeline .section-header').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await page.evaluate(() => {
      const header = document.querySelector('#pipeline .section-header');
      const banner = document.querySelector('#pipeline .success-banner');
      const intro = document.querySelector('#pipeline > p');
      if (!header || !banner || !intro) return null;
      const rects = [header, banner, intro].map((el) => el.getBoundingClientRect());
      const top = Math.min(...rects.map((r) => r.top));
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      return {
        x: Math.max(0, left - 8),
        y: Math.max(0, top - 8),
        width: right - left + 16,
        height: bottom - top + 16,
      };
    });
    if (box && box.height > 0) {
      await page.screenshot({
        path: path.join(OUT_DIR, '03-section1-header.png'),
        clip: box,
        type: 'png',
      });
      console.log('Captured: 03-section1-header');
    } else {
      console.error('Failed 03-section1-header: could not compute clip region');
    }
  } catch (err) {
    console.error(`Failed 03-section1-header: ${err.message}`);
  }

  await browser.close();
  console.log(`Done. Images in ${OUT_DIR}`);
})();
