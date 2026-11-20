// Checks every trainer line is legal and has one note per trainee move. Run: node check-lines.js
const ENGINE = require('../puzzlegen/engine.js'), L = require('./lines.js');
const E = ENGINE(); let bad = 0;
for (const o of L) {
  E.load(E.START); const mv = o.line.split(' '); let ok = true;
  for (const t of mv) { const m = E.legalMoves().find(x => E.san(x).replace(/[+#]/g, '') === t.replace(/[+#]/g, '')); if (!m) { console.log(o.id, 'ILLEGAL', t); ok = false; bad++; break; } E.make(m); }
  const mine = mv.filter((_, i) => (i % 2 === 0) === (o.side === 'w')).length;
  if (mine !== o.notes.length) { console.log(o.id, 'notes', o.notes.length, 'but trainee moves', mine); bad++; }
  else if (ok) console.log('ok', o.id, mv.length + ' plies');
}
process.exit(bad ? 1 : 0);
