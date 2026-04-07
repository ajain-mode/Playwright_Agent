const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/reporting/allure-results');
const file = process.argv[2] || '4930ff55-4b93-46a9-8b47-56fd2ba81f35-result.json';
const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

console.log('=== TOP LEVEL ===');
console.log('name:', d.name);
console.log('status:', d.status);
console.log('message:', (d.statusDetails || {}).message?.substring(0, 800));
console.log('');

console.log('=== ATTACHMENTS ===');
(d.attachments || []).forEach(a => {
  console.log(`  ${a.name}: ${a.source}`);
});
console.log('');

console.log('=== STEPS ===');
function printSteps(steps, indent) {
  (steps || []).forEach(s => {
    const statusMark = s.status === 'passed' ? 'PASS' : s.status === 'failed' ? 'FAIL' : s.status === 'broken' ? 'BROKEN' : s.status;
    console.log(`${' '.repeat(indent)}[${statusMark}] ${s.name}`);
    if (s.statusDetails && s.statusDetails.message) {
      console.log(`${' '.repeat(indent+2)}ERROR: ${s.statusDetails.message.substring(0, 400)}`);
    }
    if (s.attachments && s.attachments.length) {
      s.attachments.forEach(a => {
        console.log(`${' '.repeat(indent+2)}ATTACHMENT: ${a.name}: ${a.source}`);
      });
    }
    printSteps(s.steps, indent + 4);
  });
}
printSteps(d.steps, 0);

// Search for keywords
console.log('\n=== KEYWORD SEARCH ===');
const text = JSON.stringify(d);
['dialog', 'alert', 'INVOICED', 'Override BTF', 'btf_override', 'Override', 'invoice'].forEach(kw => {
  const idx = text.toLowerCase().indexOf(kw.toLowerCase());
  if (idx >= 0) {
    console.log(`Found "${kw}" at index ${idx}: ...${text.substring(Math.max(0,idx-50), idx+100)}...`);
  } else {
    console.log(`"${kw}" NOT found`);
  }
});
