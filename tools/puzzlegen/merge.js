// Adds newly generated puzzles to puzzles.json without changing existing ones (puzzle IDs are array positions).
// Usage: node merge.js out1.jsonl out2.jsonl ...
const fs = require('fs');
const path = require('path');
const ENGINE = require('./engine.js');
const E = ENGINE();

const PZ = path.join(__dirname, '../../puzzles.json');
const rate = require('./rate.js'); // rating from the puzzle itself: moves to find, how obvious the first move is, engine depth
const MAX = 15000;

const key = (fen, moves) => fen.split(' ').slice(0, 4).join(' ') + '|' + moves;

const data = JSON.parse(fs.readFileSync(PZ, 'utf8'));
const have = new Set(data.p.map(a => key(a[0], a[1])));
const today = +new Date().toISOString().slice(0, 10).replace(/-/g, '');

const recs = [];
for (const f of process.argv.slice(2)) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) { if (line.trim()) try { recs.push(JSON.parse(line)); } catch (e) { } }
}
for (let i = recs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [recs[i], recs[j]] = [recs[j], recs[i]]; }

let added = 0, easy = 0, skipped = 0;
let easyPool = data.p.filter(a => a[2] > 0 && a[3] && a[3].includes('oneMove') && a[2] < 700).length;
for (const r of recs) {
  if (data.p.length >= MAX) break;
  const k = key(r.fen, r.moves);
  if (have.has(k)) { skipped++; continue; }
  // must replay legally
  E.load(r.fen);
  const mv = r.moves.split(' ');
  let ok = true;
  for (const u of mv) { const m = E.fromUci(u); if (!m) { ok = false; break; } E.make(m); }
  if (!ok || mv.length < 2) { skipped++; continue; }
  // no "they checked you with a piece you can just take" puzzles
  E.load(r.fen); const b = E.fromUci(mv[0]); E.make(b); const s1 = E.fromUci(mv[1]);
  if (E.inCheck() && E.to(s1) === E.to(b)) { skipped++; continue; }
  const th = r.themes || [];
  const rt = rate(E, r.fen, r.moves, th);
  // there are already plenty of easy one-movers (free piece, cheap piece takes a big one), so only add more while there are few
  if (rt.f.n === 1 && rt.f.obvious && easyPool >= 150) { skipped++; continue; }
  // keep one-move puzzles to about a fifth of each batch so the pool keeps getting harder ones
  if (rt.f.n === 1) { if (easy > added * 0.2 + 2) { skipped++; continue; } easy++; }
  if (rt.f.n === 1 && rt.f.obvious) easyPool++;
  const rating = rt.rating;
  data.p.push([r.fen, r.moves, rating, th.join(' '), today]);
  have.add(k);
  added++;
}
fs.writeFileSync(PZ, JSON.stringify(data));
console.log(`added ${added} puzzles (skipped ${skipped}), total ${data.p.length}`);
