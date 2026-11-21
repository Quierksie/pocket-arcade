// Adds the newer tactic tags (themes.js) to puzzles already in puzzles.json. Keeps every existing tag.
// Usage: node retag.js [--write]
const fs = require('fs'), path = require('path');
const ENGINE = require('./engine.js'), { tactics } = require('./themes.js');
const PZ = path.join(__dirname, '../../puzzles.json');
const data = JSON.parse(fs.readFileSync(PZ, 'utf8')), E = ENGINE(), count = {};
let changed = 0;
for (const a of data.p) {
  let extra = [];
  try { extra = tactics(E, a[0], a[1]); } catch (e) { continue; }
  const have = new Set((a[3] || '').split(' ').filter(Boolean));
  const before = have.size;
  for (const t of extra) { have.add(t); count[t] = (count[t] || 0) + 1; }
  if (have.size !== before) { a[3] = [...have].join(' '); changed++; }
}
console.log('changed', changed, 'of', data.p.length, count);
if (process.argv.includes('--write')) fs.writeFileSync(PZ, JSON.stringify(data));
