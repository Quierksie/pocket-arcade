// Extra tactic tags for a puzzle: pin, skewer, discovered attack (not just discovered check), quiet move.
// Each one only counts if the solver actually cashes in on it later in the line (captures the piece).
// Usage: tactics(E, fen, movesArrayOrString) -> ['pin', ...]
const V = [0, 1, 3, 3, 5, 9, 100];
const DIRS = { 3: [17, 15, -17, -15], 4: [16, -16, 1, -1], 5: [17, 15, -17, -15, 16, -16, 1, -1] };
const off = x => !!(x & 0x88);

// from a slider on sq, look down each line: first enemy piece A, then the next piece B behind it
function lines(E, sq) {
  const B = E.board, p = B[sq], t = Math.abs(p), c = p > 0 ? 1 : -1, out = [];
  if (!DIRS[t]) return out;
  for (const d of DIRS[t]) {
    let x = sq + d, a = -1;
    for (; !off(x); x += d) if (B[x]) { a = x; break; }
    if (a < 0 || (B[a] > 0) === (c > 0)) continue;
    let b = -1;
    for (x = a + d; !off(x); x += d) if (B[x]) { b = x; break; }
    out.push({ a, b: b >= 0 && (B[b] > 0) !== (c > 0) ? b : -1 });
  }
  return out;
}
// every square the piece on sq attacks (any piece type)
function attacksFrom(E, sq) {
  const B = E.board, p = B[sq], t = Math.abs(p), c = p > 0 ? 1 : -1, out = [];
  if (t === 1) { for (const d of [15, 17]) { const x = sq + d * c; if (!off(x)) out.push(x); } }
  else if (t === 2 || t === 6) for (const d of t === 2 ? [33, 31, 18, 14, -33, -31, -18, -14] : [17, 16, 15, 1, -1, -15, -16, -17]) { const x = sq + d; if (!off(x)) out.push(x); }
  else for (const d of DIRS[t]) for (let x = sq + d; !off(x); x += d) { out.push(x); if (B[x]) break; }
  return out;
}
// enemy squares this slider attacks
function sliderHits(E, sq) { return lines(E, sq).map(l => l.a); }

function tactics(E, fen, moves) {
  moves = Array.isArray(moves) ? moves : moves.split(' ');
  const th = new Set();
  E.load(fen);
  E.make(E.fromUci(moves[0]));
  const solver = E.side;
  // squares the solver captures on, at which solver-move index
  const caps = [];
  {
    let made = 0;
    for (let i = 1; i < moves.length; i++) { const m = E.fromUci(moves[i]); if (i % 2 === 1 && E.board[E.to(m)]) caps.push({ i, sq: E.to(m) }); E.make(m); made++; }
    for (let k = 0; k < made; k++) E.unmake();
  }
  const capLater = (sq, i) => caps.some(c => c.sq === sq && c.i > i);
  const mine = s => E.board[s] && (E.board[s] > 0) === (solver > 0);
  const val = s => V[Math.abs(E.board[s])];
  const sliders = () => { const o = []; for (let s = 0; s < 120; s++) { if (off(s)) { s += 7; continue; } if (mine(s) && DIRS[Math.abs(E.board[s])]) o.push(s); } return o; };

  // is the enemy piece on sq pinned to its king by one of our sliders right now
  const pinnedToKing = sq => sliders().some(s => lines(E, s).some(l => l.a === sq && l.b >= 0 && Math.abs(E.board[l.b]) === 6));
  const skew = []; // { by: square of the skewering piece, sq: piece behind }

  let made = 0;
  for (let i = 1; i < moves.length; i++) {
    const m = E.fromUci(moves[i]);
    if (i % 2 === 0) { E.make(m); made++; continue; }
    const from = E.from(m), to = E.to(m), isCap = !!E.board[to], promo = E.promo(m), wasCheck = E.inCheck();
    if (isCap && Math.abs(E.board[to]) !== 6 && val(to) >= 3 && pinnedToKing(to)) th.add('pin'); // winning a pinned piece
    if (isCap && skew.some(k => k.by === from && k.sq === to)) th.add('skewer');
    const before = new Map(); for (const s of sliders()) if (s !== from) before.set(s, new Set(sliderHits(E, s)));
    E.make(m); made++;
    const check = E.inCheck();
    // quiet: no capture, no check, and the moved piece doesn't even attack anything bigger than a pawn yet
    if (i === 1 && !wasCheck && !isCap && !check && !promo && !attacksFrom(E, to).some(x => E.board[x] && (E.board[x] > 0) !== (solver > 0) && Math.abs(E.board[x]) > 1)) th.add('quietMove');
    // the moved piece pins or skewers something
    if (DIRS[Math.abs(E.board[to])]) for (const l of lines(E, to)) {
      if (l.b < 0) continue;
      const ta = Math.abs(E.board[l.a]), tb = Math.abs(E.board[l.b]);
      if (ta !== 6 && (tb === 6 || V[tb] > V[ta]) && capLater(l.a, i)) th.add('pin');
      if (ta === 6 || V[ta] > V[tb]) skew.push({ by: to, sq: l.b }); // counts if this piece later takes the one behind
    }
    // another piece's line opens up through the square we left, and we win what it hits
    for (const s of sliders()) {
      if (s === to) continue;
      const was = before.get(s) || new Set();
      for (const h of sliderHits(E, s)) if (!was.has(h) && Math.abs(E.board[h]) !== 6 && val(h) >= 3 && capLater(h, i)) th.add('discoveredAttack');
    }
  }
  for (let k = 0; k < made; k++) E.unmake();
  return [...th];
}
module.exports = { tactics };
