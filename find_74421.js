const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'reporting', 'allure-results');
const files = fs.readdirSync(dir).filter(f => f.endsWith('-result.json'));

const bt74421Files = [];
for (const f of files) {
  const c = fs.readFileSync(path.join(dir, f), 'utf8');
  if (c.includes('BT-74421')) {
    const d = JSON.parse(c);
    bt74421Files.push({ file: f, data: d, mtime: fs.statSync(path.join(dir, f)).mtimeMs });
  }
}

// Sort by stop time (most recent first)
bt74421Files.sort((a, b) => (b.data.stop || 0) - (a.data.stop || 0));

const out = [];
out.push(`Total BT-74421 results: ${bt74421Files.length}`);
out.push('');

// Show top 3 most recent
for (let i = 0; i < Math.min(3, bt74421Files.length); i++) {
  const { file, data } = bt74421Files[i];
  out.push(`=== Result #${i + 1}: ${file} ===`);
  out.push(`Name: ${data.name}`);
  out.push(`Status: ${data.status}`);
  out.push(`Start: ${new Date(data.start).toISOString()}`);
  out.push(`Stop: ${new Date(data.stop).toISOString()}`);

  if (data.statusDetails) {
    out.push(`Error Message: ${data.statusDetails.message}`);
    out.push(`Error Trace: ${data.statusDetails.trace}`);
  }

  // Find failed step
  function findFailedSteps(steps, indent = '') {
    for (const s of steps) {
      if (s.status === 'failed' || s.status === 'broken') {
        out.push(`${indent}FAILED STEP: ${s.name} [${s.status}]`);
        if (s.statusDetails && s.statusDetails.message) {
          out.push(`${indent}  Error: ${s.statusDetails.message}`);
        }
      }
      if (s.steps) findFailedSteps(s.steps, indent + '  ');
    }
  }
  if (data.steps) findFailedSteps(data.steps);

  // All steps summary
  function printAllSteps(steps, indent = '') {
    for (const s of steps) {
      out.push(`${indent}[${s.status || 'N/A'}] ${s.name}`);
      if (s.steps) printAllSteps(s.steps, indent + '  ');
    }
  }
  out.push('\nAll Steps:');
  if (data.steps) printAllSteps(data.steps);

  // Attachments
  out.push('\nTop-level Attachments:');
  if (data.attachments) {
    for (const a of data.attachments) {
      out.push(`  ${a.name} | ${a.source} | ${a.type}`);
    }
  }

  // Step attachments
  function findStepAttachments(steps) {
    for (const s of steps) {
      if (s.attachments && s.attachments.length > 0) {
        for (const a of s.attachments) {
          out.push(`  Step "${s.name}": ${a.name} | ${a.source} | ${a.type}`);
        }
      }
      if (s.steps) findStepAttachments(s.steps);
    }
  }
  out.push('\nStep Attachments:');
  if (data.steps) findStepAttachments(data.steps);

  out.push('\n---\n');
}

fs.writeFileSync(path.join(__dirname, 'bt74421_summary.txt'), out.join('\n'), 'utf8');
console.log('Written to bt74421_summary.txt');
