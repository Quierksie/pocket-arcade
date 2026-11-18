// Adds newly generated puzzles to puzzles.json without changing existing ones (puzzle IDs are array positions).
// Usage: node merge.js out1.jsonl out2.jsonl ...
const fs = require('fs');
const path = require('path');
const ENGINE = require('./engine.js');
const E = ENGINE();

const PZ = path.join(__dirname, '../../puzzles.json');
const CAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'calib.json'), 'utf8'));
// rating by rank: where this score falls among the reference puzzles' scores -> the rating at the same rank
function ratingFor(sc) {
  const S = CAL.scores, R = CAL.ratings, n = S.length;
  let lo = 0; while (lo < n && S[lo] < sc) lo++;
  let hi = lo; while (hi < n && S[hi] === sc) hi++;
  if (hi > lo) { let sum = 0; for (let k = lo; k < hi; k++) sum += R[k]; return sum / (hi - lo); } // same score: average of those ratings
  if (lo === 0) return R[0] - (S[0] - sc) * 150;
  if (lo === n) return R[n - 1] + (sc - S[n - 1]) * 150;
  const t = (sc - S[lo - 1]) / (S[lo] - S[lo - 1]);
  return R[lo - 1] + t * (R[lo] - R[lo - 1]);
}
const MAX = 15000;

// difficulty score from the generator's data (same formula used for the first batch)
function score(r) {
  const d = r.diffs, n = d.length, th = r.themes || [];
  const mx = Math.max(...d), mean = d.reduce((a, b) => a + b, 0) / n;
  return mx + 0.5 * mean + 0.8 * (n - 1) + (r.quietFirst ? 1 : 0) + (th.includes('sacrifice') ? 1.2 : 0) + (th.includes('hangingPiece') ? -1 : 0) + (th.includes('mate') && n === 1 ? -0.4 : 0);
}
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
  // keep one-move "grab the hanging piece" puzzles to about a quarter of each batch
  const th = r.themes || [];
  if (th.includes('oneMove') && th.includes('hangingPiece')) { if (easy > added * 0.25 + 2) { skipped++; continue; } easy++; }
  const rating = Math.max(350, Math.min(2800, Math.round(ratingFor(score(r)) + (Math.random() - 0.5) * 160)));
  data.p.push([r.fen, r.moves, rating, th.join(' '), today]);
  have.add(k);
  added++;
}
fs.writeFileSync(PZ, JSON.stringify(data));
console.log(`added ${added} puzzles (skipped ${skipped}), total ${data.p.length}`);
