// Puzzle difficulty rating, worked out from the puzzle itself (not from where it ranks in a batch).
// What makes a puzzle hard: more moves to find, a quiet or sacrificial first move, and moves the
// arcade's own engine needs to search deeply to spot. What makes it easy: grabbing a free piece,
// a cheap piece taking an expensive one, or a mate in one.
// Usage: const rate = require('./rate.js'); rate(E, fen, movesString, themesArray) -> { rating, f }
const V = [0, 1, 3, 3, 5, 9, 100];

function attacks(E, from, to) { // does the piece on `from` attack `to` (ignores pins, good enough here)
  const B = E.board, p = B[from], t = Math.abs(p), c = p > 0 ? 1 : -1, d = to - from;
  if (!p || from === to) return false;
  if (t === 1) return d === 15 * c || d === 17 * c;
  if (t === 2) return [33, 31, 18, 14, -33, -31, -18, -14].includes(d);
  if (t === 6) return [17, 16, 15, 1, -1, -15, -16, -17].includes(d);
  const dirs = t === 3 ? [17, 15, -17, -15] : t === 4 ? [16, -16, 1, -1] : [17, 16, 15, 1, -1, -15, -16, -17];
  for (const s of dirs) for (let x = from + s; !(x & 0x88); x += s) { if (x === to) return true; if (B[x]) break; }
  return false;
}
function defendedBy(E, sq, side) { // cheapest piece of `side` that defends sq, or 0
  const B = E.board; let best = 0;
  for (let s = 0; s < 120; s++) { if (s & 0x88) { s += 7; continue; } const p = B[s]; if (p && (p > 0) === (side > 0) && attacks(E, s, sq)) { const v = V[Math.abs(p)]; if (!best || v < best) best = v; } }
  return best;
}
// how deep the arcade engine has to look before it plays this move (1..6, or 8 if it never does)
function depthToFind(E, uci) {
  for (let d = 1; d <= 6; d++) { const r = E.think({ time: 8000, depth: d, noise: 0, random: 0 }); if (r.move && E.uci(r.move) === uci) return d; }
  return 8;
}
const DEPTH_PTS = [0, 0, 70, 160, 270, 390, 500, 0, 640];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

module.exports = function rate(E, fen, moves, themes = []) {
  const mv = typeof moves === 'string' ? moves.split(' ') : moves;
  E.load(fen);
  E.make(E.fromUci(mv[0])); // the opponent's mistake; the solver moves next
  const solver = E.side;
  const steps = [];
  let made = 1;
  try {
    for (let i = 1; i < mv.length; i++) {
      const m = E.fromUci(mv[i]); if (!m) break;
      if (i % 2 === 1) {
        const from = E.from(m), to = E.to(m), mover = Math.abs(E.board[from]), victim = Math.abs(E.board[to]);
        const s = { d: depthToFind(E, mv[i]), cap: !!victim || !!(E.flag(m) & 2), mover, victim };
        if (victim) {
          const def = defendedBy(E, to, -solver); // can they take back?
          s.free = !def;                          // a hanging piece
          s.upTrade = V[victim] >= V[mover] + 2;  // e.g. pawn takes knight, knight takes rook
          s.even = !s.free && !s.upTrade && V[victim] >= V[mover];
        }
        E.make(m); made++;
        s.check = E.inCheck();
        const st = E.status(); s.mate = !!(st && st.reason === 'checkmate');
        steps.push(s);
      } else { E.make(m); made++; }
    }
  } finally { for (let i = 0; i < made; i++) E.unmake(); }

  const n = steps.length, first = steps[0] || { d: 1 };
  const obvious = first.cap && (first.free || first.upTrade);
  const quiet = !first.cap && !first.check;
  const sacrifice = themes.includes('sacrifice');
  const ds = steps.map(s => DEPTH_PTS[s.d]);
  const dMax = Math.max(0, ...ds), dRest = ds.reduce((a, b) => a + b, 0) - dMax;

  let r = 550;
  r += [0, 0, 450, 800, 1050][Math.min(n, 4)] + Math.max(0, n - 4) * 200; // moves to find
  r += dMax + 0.35 * dRest;                                                  // how hard they are to see
  if (quiet) r += 280;                                                       // no capture or check to hint at it
  else if (first.check && !first.cap) r += 60;
  else if (obvious) r -= first.free ? 140 : 90;                              // free piece / cheap takes expensive
  else if (first.cap && !first.even) r += 160;                               // capture that gives up material
  if (sacrifice) r += 220;
  if (steps.some(s => s.mate) && n === 1) r -= 150;                          // mate in one
  // single-move puzzles have hard ceilings
  if (n === 1) r = Math.min(r, obvious ? 950 : steps[0] && steps[0].mate ? 1150 : quiet ? 1700 : 1450);
  r += (hash(fen + mv.join('')) - 0.5) * 120; // small, fixed spread so equal puzzles aren't all one number
  return { rating: Math.round(Math.max(400, Math.min(2800, r))), f: { n, d: steps.map(s => s.d), obvious, quiet, sacrifice } };
};
