// Puzzle generator: bots play each other, Stockfish finds blunders that leave a winning tactic
// with a single correct answer at every step. Output: JSON lines.
const fs = require('fs');
const SF = require('./sfwrap.js');
const ENGINE = require('./engine.js');
const { tactics } = require('./themes.js');
const TE = ENGINE(); // separate board for tagging pins, skewers and the like

const OUT = process.argv[2] || 'out.jsonl';
const MINUTES = +(process.argv[3] || 60);
const END = Date.now() + MINUTES * 60000;
const V = [0, 1, 3, 3, 5, 9, 0];

const wc = r => r.mate != null ? (r.mate > 0 ? 1 : -1) : 2 / (1 + Math.exp(-0.00368208 * r.cp)) - 1;
const cpOf = r => r.mate != null ? (r.mate > 0 ? 10000 - r.mate : -10000 - r.mate) : r.cp;

function material(E, side) { let s = 0; const B = E.board; for (let sq = 0; sq < 120; sq++) { if (sq & 0x88) { sq += 7; continue; } const p = B[sq]; if (p) s += (p > 0 ? 1 : -1) * V[Math.abs(p)]; } return s * side; }
function nonPawn(E, c) { let s = 0; const B = E.board; for (let sq = 0; sq < 120; sq++) { if (sq & 0x88) { sq += 7; continue; } const p = B[sq]; if (p && (p > 0) === (c > 0) && Math.abs(p) > 1 && Math.abs(p) < 6) s += V[Math.abs(p)]; } return s; }
// squares attacked by the piece on sq
function attacksFrom(E, sq) {
  const B = E.board, p = B[sq], t = Math.abs(p), c = p > 0 ? 1 : -1, out = [];
  const ok = x => !(x & 0x88);
  if (t === 1) { for (const d of [15, 17]) { const x = sq + d * c; if (ok(x)) out.push(x); } }
  else if (t === 2 || t === 6) for (const d of t === 2 ? [33, 31, 18, 14, -33, -31, -18, -14] : [17, 16, 15, 1, -1, -15, -16, -17]) { const x = sq + d; if (ok(x)) out.push(x); }
  else for (const d of t === 3 ? [17, 15, -17, -15] : t === 4 ? [16, -16, 1, -1] : [17, 16, 15, 1, -1, -15, -16, -17]) for (let x = sq + d; ok(x); x += d) { out.push(x); if (B[x]) break; }
  return out;
}
function defended(E, sq) { // is the piece on sq defended by its own side
  const B = E.board, c = B[sq] > 0 ? 1 : -1;
  for (let s = 0; s < 120; s++) { if (s & 0x88) { s += 7; continue; } if (s !== sq && B[s] && (B[s] > 0) === (c > 0) && attacksFrom(E, s).includes(sq)) return true; }
  return false;
}
function enemyAttackers(E, sq, c) { const B = E.board, out = []; for (let s = 0; s < 120; s++) { if (s & 0x88) { s += 7; continue; } if (B[s] && (B[s] > 0) !== (c > 0) && attacksFrom(E, s).includes(sq)) out.push(s); } return out; }

let seed = (process.pid * 2654435761) >>> 0;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

const PROFILES = [
  { time: 30, depth: 2, noise: 140, random: 0.05 }, { time: 40, depth: 3, noise: 80, random: 0.02 },
  { time: 50, depth: 4, noise: 45, random: 0 }, { time: 60, depth: 5, noise: 25, random: 0 },
  { time: 80, depth: 6, noise: 12, random: 0 },
];

async function evalPos(sf, fen, depth = 10) { const r = await sf.analyse(fen, { depth, multipv: 1 }); return r[0]; }

async function buildLine(sf, E, startPly) {
  // E is at the position right after the blunder; solver = side to move
  const solver = E.side, start = material(E, solver);
  const line = [], diffs = [];
  let mateMode = false, made = 0;
  try {
    for (let k = 0; k < 5; k++) {
      const legal = E.legalMoves();
      const r = await sf.analyse(E.fen(), { depth: 16, multipv: 2 });
      const best = r[0], second = r[1];
      if (!best) return null;
      if (k === 0) {
        if (best.mate != null) { if (best.mate <= 0 || best.mate > 5) return null; mateMode = true; }
        else if (best.cp < 250) return null;
      }
      if (mateMode && (best.mate == null || best.mate <= 0)) return null;
      if (second && legal.length > 1) {
        if (second.mate != null && second.mate > 0) { if (!(mateMode && best.mate === 1)) return null; } // alternative mates only allowed on the final move
        if (!mateMode && wc(best) - wc(second) < 0.38) return null;
        if (mateMode && second.mate == null && wc(second) > 0.75 && k === 0) return null;
      }
      const m = E.fromUci(best.move); if (!m) return null;
      // our engine: shallowest depth that finds this move (difficulty)
      let d = 0; for (let dd = 1; dd <= 7; dd++) { const t = E.think({ time: 20000, depth: dd, noise: 0, random: 0 }); if (E.uci(t.move) === best.move) { d = dd; break; } }
      diffs.push(d || 9);
      const isCap = !!(E.flag(m) & 1), san = E.san(m);
      line.push({ uci: best.move, san, cap: isCap, check: san.includes('+') || san.includes('#') });
      E.make(m); made++;
      const st = E.status();
      if (st && st.reason === 'checkmate') return { line, diffs, mate: true, solver, start, made };
      if (st) return null;
      if (mateMode) { const rr = await sf.analyse(E.fen(), { depth: 14, multipv: 1 }); const om = E.fromUci(rr[0].move); if (!om) return null; line.push({ uci: rr[0].move, opp: true }); E.make(om); made++; continue; }
      const rr = await sf.analyse(E.fen(), { depth: 14, multipv: 1 });
      if (!rr[0]) return null;
      const om = E.fromUci(rr[0].move); if (!om) return null;
      E.make(om); made++;
      const gain = material(E, solver) - start;
      if (gain >= 2) { E.unmake(); made--; return { line, diffs, mate: false, solver, start, made, gain }; }
      line.push({ uci: rr[0].move, opp: true });
    }
    return null;
  } finally { for (let i = 0; i < made; i++) E.unmake(); }
}

function themesFor(E, p) {
  // E is at the puzzle start (before the blunder). Replays to tag themes.
  const th = new Set();
  const sol = p.line.filter(x => !x.opp);
  const n = sol.length;
  if (p.mate) { th.add('mate'); th.add('mateIn' + n); }
  th.add(n === 1 ? 'oneMove' : n === 2 ? 'short' : n === 3 ? 'long' : 'veryLong');
  let made = 0;
  const bl = E.fromUci(p.blunder); E.make(bl); made++;
  const solver = E.side;
  // phase
  const np = nonPawn(E, 1) + nonPawn(E, -1);
  th.add(p.ply < 18 ? 'opening' : np <= 26 ? 'endgame' : 'middlegame');
  let matBefore = material(E, solver);
  for (let i = 0; i < p.line.length; i++) {
    const step = p.line[i], m = E.fromUci(step.uci);
    if (!step.opp) {
      const from = E.from(m), to = E.to(m), captured = E.board[to];
      if (i === 0 && captured && !defended(E, to)) th.add('hangingPiece');
      if (E.promo(m)) th.add('promotion');
      if (E.flag(m) & 2) th.add('enPassant');
      if (E.flag(m) & 4) th.add('castling');
      E.make(m); made++;
      // fork: moved piece attacks 2+ enemy pieces worth more than it, or king + undefended piece
      const mover = Math.abs(E.board[to]);
      const hits = attacksFrom(E, to).filter(x => E.board[x] && (E.board[x] > 0) !== (E.board[to] > 0)).map(x => ({ x, t: Math.abs(E.board[x]) }));
      const juicy = hits.filter(h => h.t === 6 || V[h.t] > V[mover] || (h.t !== 1 && !defended(E, h.x)));
      if (juicy.length >= 2 && !E.status()) th.add('fork');
      // discovered check / double check
      if (E.inCheck()) {
        const ksq = E.king[E.side === 1 ? 0 : 1];
        const checkers = enemyAttackers(E, ksq, E.side);
        if (checkers.length >= 2) th.add('doubleCheck');
        else if (checkers.length === 1 && checkers[0] !== to) th.add('discoveredAttack');
      }
      const st = E.status();
      if (st && st.reason === 'checkmate') {
        const ksq = E.king[E.side === 1 ? 0 : 1], kr = ksq >> 4;
        if (mover === 2) {
          const around = [17, 16, 15, 1, -1, -15, -16, -17].map(d => ksq + d).filter(x => !(x & 0x88));
          if (around.every(x => E.board[x] && (E.board[x] > 0) === (E.side > 0))) th.add('smotheredMate');
        }
        if ((kr === 0 || kr === 7) && (mover === 4 || mover === 5) && (to >> 4) === kr) th.add('backRankMate');
      }
      // sacrifice: after the opponent's reply the solver is down material vs before this move
      const next = p.line[i + 1];
      if (next && next.opp) {
        const om = E.fromUci(next.uci); E.make(om); made++;
        if (material(E, solver) <= matBefore - 2) th.add('sacrifice');
        matBefore = material(E, solver);
        i++;
      }
    } else { E.make(m); made++; }
  }
  if (!p.mate) th.add(p.gain >= 5 ? 'crushing' : 'advantage');
  for (let i = 0; i < made; i++) E.unmake();
  return [...th];
}

// moves that look fine to a shallow search (depth 1 + captures), best first
function shallowTop(E, n) {
  const out = [];
  for (const m of E.legalMoves()) {
    E.make(m);
    let sc;
    if (E.status()) sc = E.inCheck() ? 99999 : 0;
    else { const r = E.think({ time: 2000, depth: 1, noise: 0, random: 0 }); sc = r.score == null ? 0 : -r.score; }
    E.unmake();
    out.push({ m, sc });
  }
  out.sort((a, b) => b.sc - a.sc);
  const top = out.length ? out[0].sc : 0;
  // only moves that still look fine after a shallow look (so the refutation is a real tactic)
  return out.filter(x => x.sc >= top - 60).slice(0, n).map(x => x.m);
}

const stats = { cand: 0, built: 0 };
async function tryPuzzle(sf, E, seen, ply, blunderUci) {
  // E is at the position after the blunder
  const key = E.fen().split(' ').slice(0, 4).join(' ');
  if (seen.has(key)) return null;
  seen.add(key);
  // skip "they checked you with a piece you can just take" puzzles
  if (E.inCheck()) { const r = await sf.analyse(E.fen(), { depth: 10, multipv: 1 }); if (r[0] && r[0].move.slice(2, 4) === blunderUci.slice(2, 4)) return null; }
  stats.cand++;
  const p = await buildLine(sf, E, ply);
  if (!p) return null;
  stats.built++;
  E.unmake();
  const startFen = E.fen();
  const rec = { fen: startFen, blunder: blunderUci, line: p.line, mate: p.mate, gain: p.gain || 0, ply, diffs: p.diffs };
  try { rec.themes = themesFor(E, rec); } catch (e) { rec.themes = []; }
  E.make(E.fromUci(blunderUci));
  const sol = p.line.filter(x => !x.opp);
  rec.quietFirst = !sol[0].cap && !sol[0].check;
  rec.moves = [blunderUci, ...p.line.map(x => x.uci)].join(' ');
  try { rec.themes = [...new Set([...rec.themes, ...tactics(TE, rec.fen, rec.moves)])]; } catch (e) { }
  delete rec.line;
  return rec;
}

(async () => {
  const sf = new SF(); await sf.init();
  const E = ENGINE();
  const seen = new Set();
  let games = 0, found = 0;
  const STRONG = [{ time: 50, depth: 4, noise: 30, random: 0 }, { time: 60, depth: 5, noise: 18, random: 0 }, { time: 80, depth: 6, noise: 10, random: 0 }, { time: 40, depth: 3, noise: 50, random: 0 }];
  while (Date.now() < END) {
    games++;
    E.load(E.START);
    const pw = pick(STRONG), pb = pick(STRONG);
    let prev = null, lastMove = null;
    for (let ply = 0; ply < 140 && Date.now() < END; ply++) {
      if (E.status()) break;
      const ev = ply >= 4 ? await evalPos(sf, E.fen()) : null;
      // 1) a real blunder from the game
      if (ev && prev && ply >= 6) {
        const before = cpOf(prev), after = cpOf(ev);
        if (Math.abs(before) < 900 && -before <= 250 && after >= 250 && after + before >= 300) {
          const rec = await tryPuzzle(sf, E, seen, ply - 1, lastMove);
          if (rec && !(rec.themes.includes('oneMove') && rec.themes.includes('hangingPiece') && rnd() > 0.3)) { fs.appendFileSync(OUT, JSON.stringify(rec) + '\n'); found++; }
        }
      }
      // 2) plausible-looking moves here that would be blunders
      if (ev && ply >= 8 && Math.abs(cpOf(ev)) <= 200 && rnd() < 0.7) {
        let tries = 0;
        for (const m of shallowTop(E, 6)) {
          const u = E.uci(m);
          if (u === ev.move) continue;
          E.make(m);
          if (!E.status()) {
            const e2 = await evalPos(sf, E.fen(), 10);
            if (e2 && cpOf(e2) >= 300 && cpOf(e2) + cpOf(ev) >= 350) {
              const rec = await tryPuzzle(sf, E, seen, ply, u);
              if (rec) { fs.appendFileSync(OUT, JSON.stringify(rec) + '\n'); found++; tries++; }
            }
          }
          E.unmake();
          if (tries >= 1) break;
        }
      }
      prev = ev;
      const prof = ply < 6 ? { time: 30, depth: 3, noise: 60, random: 0.1 } : (E.side === 1 ? pw : pb);
      const r = E.think(prof);
      if (!r.move) break;
      lastMove = E.uci(r.move);
      E.make(r.move);
    }
    console.log(new Date().toISOString().slice(11, 19), 'games', games, 'puzzles', found, JSON.stringify(stats));
  }
  console.log('done games', games, 'puzzles', found);
  sf.quit(); process.exit(0);
})();
