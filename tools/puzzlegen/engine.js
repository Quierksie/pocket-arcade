function ENGINE() {
  'use strict';
  // Pieces: 1 pawn, 2 knight, 3 bishop, 4 rook, 5 queen, 6 king. White > 0, black < 0.
  // Board is 0x88: square = rank * 16 + file, rank 0 = rank 1.
  const VAL = [0, 100, 320, 330, 500, 900, 0];
  const PH = [0, 0, 1, 1, 2, 4, 0];
  // Piece-square tables, listed from rank 8 down to rank 1 (white's view).
  const T = {
    1: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    3: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    4: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    5: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    6: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
  };
  const KEG = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
  const PEG = [0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 90, 90, 90, 90, 90, 90, 55, 55, 55, 55, 55, 55, 55, 55, 30, 30, 30, 30, 30, 30, 30, 30, 15, 15, 15, 15, 15, 15, 15, 15, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // Combined tables indexed [type][0x88 square] for white and black.
  const MGW = [], EGW = [], MGB = [], EGB = [];
  for (let t = 1; t <= 6; t++) {
    MGW[t] = new Int16Array(128); EGW[t] = new Int16Array(128); MGB[t] = new Int16Array(128); EGB[t] = new Int16Array(128);
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const sq = r * 16 + f, wi = (7 - r) * 8 + f, bi = r * 8 + f;
      MGW[t][sq] = VAL[t] + T[t][wi]; MGB[t][sq] = VAL[t] + T[t][bi];
      const eg = t === 6 ? KEG : t === 1 ? PEG : T[t];
      EGW[t][sq] = VAL[t] + eg[wi] + (t === 1 ? 10 : 0); EGB[t][sq] = VAL[t] + eg[bi] + (t === 1 ? 10 : 0);
    }
  }

  const NOFF = [33, 31, 18, 14, -33, -31, -18, -14];
  const KOFF = [17, 16, 15, 1, -1, -15, -16, -17];
  const BDIR = [17, 15, -17, -15];
  const RDIR = [16, -16, 1, -1];
  const CMASK = new Uint8Array(128).fill(15);
  CMASK[0] = 15 & ~2; CMASK[4] = 15 & ~3; CMASK[7] = 15 & ~1;
  CMASK[112] = 15 & ~8; CMASK[116] = 15 & ~12; CMASK[119] = 15 & ~4;

  // Zobrist keys
  let seed = 0x2545F491;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed | 0; };
  const ZP = new Int32Array(13 * 128); for (let i = 0; i < ZP.length; i++) ZP[i] = rnd();
  const ZC = new Int32Array(16); for (let i = 0; i < 16; i++) ZC[i] = rnd();
  const ZE = new Int32Array(128); for (let i = 0; i < 128; i++) ZE[i] = rnd();
  const ZS = rnd();
  const zp = (p, sq) => ZP[(p + 6) * 128 + sq];

  const board = new Int8Array(128);
  let side = 1, castle = 0, ep = -1, half = 0, full = 1;
  const king = [0, 0]; // [white, black]
  let hash = 0;
  const hist = []; // undo records
  const hashHist = [];

  const mv = (from, to, promo, flag) => from | (to << 7) | (promo << 14) | (flag << 17);
  const FROM = m => m & 127, TO = m => (m >> 7) & 127, PROMO = m => (m >> 14) & 7, FLAG = m => m >> 17;
  const F_CAP = 1, F_EP = 2, F_CASTLE = 4, F_DOUBLE = 8;

  function computeHash() {
    let h = 0;
    for (let sq = 0; sq < 128; sq++) if (!(sq & 0x88) && board[sq]) h ^= zp(board[sq], sq);
    h ^= ZC[castle]; if (ep >= 0) h ^= ZE[ep]; if (side === -1) h ^= ZS;
    return h;
  }

  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  function load(fen) {
    board.fill(0); hist.length = 0; hashHist.length = 0;
    const [pos, s, c, e, h, f] = fen.trim().split(/\s+/);
    let r = 7, file = 0;
    for (const ch of pos) {
      if (ch === '/') { r--; file = 0; continue; }
      if (ch >= '1' && ch <= '8') { file += +ch; continue; }
      const t = 'pnbrqk'.indexOf(ch.toLowerCase()) + 1;
      const p = ch === ch.toUpperCase() ? t : -t;
      board[r * 16 + file] = p;
      if (t === 6) king[p > 0 ? 0 : 1] = r * 16 + file;
      file++;
    }
    side = s === 'b' ? -1 : 1;
    castle = 0;
    if (c && c !== '-') { if (c.includes('K')) castle |= 1; if (c.includes('Q')) castle |= 2; if (c.includes('k')) castle |= 4; if (c.includes('q')) castle |= 8; }
    ep = e && e !== '-' ? sqIndex(e) : -1;
    half = +h || 0; full = +f || 1;
    hash = computeHash();
  }
  function fen() {
    let out = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = board[r * 16 + f];
        if (!p) { empty++; continue; }
        if (empty) { out += empty; empty = 0; }
        const ch = 'pnbrqk'[Math.abs(p) - 1];
        out += p > 0 ? ch.toUpperCase() : ch;
      }
      if (empty) out += empty;
      if (r) out += '/';
    }
    let c = (castle & 1 ? 'K' : '') + (castle & 2 ? 'Q' : '') + (castle & 4 ? 'k' : '') + (castle & 8 ? 'q' : '');
    return `${out} ${side === 1 ? 'w' : 'b'} ${c || '-'} ${ep >= 0 ? sqName(ep) : '-'} ${half} ${full}`;
  }
  const sqName = sq => 'abcdefgh'[sq & 7] + ((sq >> 4) + 1);
  const sqIndex = n => (n.charCodeAt(1) - 49) * 16 + (n.charCodeAt(0) - 97);

  function attacked(sq, by) {
    // pawns
    if (by === 1) {
      if (!((sq - 15) & 0x88) && board[sq - 15] === 1) return true;
      if (!((sq - 17) & 0x88) && board[sq - 17] === 1) return true;
    } else {
      if (!((sq + 15) & 0x88) && board[sq + 15] === -1) return true;
      if (!((sq + 17) & 0x88) && board[sq + 17] === -1) return true;
    }
    const kn = 2 * by, kg = 6 * by, bi = 3 * by, ro = 4 * by, qu = 5 * by;
    for (let i = 0; i < 8; i++) {
      let t = sq + NOFF[i]; if (!(t & 0x88) && board[t] === kn) return true;
      t = sq + KOFF[i]; if (!(t & 0x88) && board[t] === kg) return true;
    }
    for (let i = 0; i < 4; i++) {
      let d = BDIR[i], t = sq + d;
      while (!(t & 0x88)) { const p = board[t]; if (p) { if (p === bi || p === qu) return true; break; } t += d; }
      d = RDIR[i]; t = sq + d;
      while (!(t & 0x88)) { const p = board[t]; if (p) { if (p === ro || p === qu) return true; break; } t += d; }
    }
    return false;
  }
  const inCheck = () => attacked(king[side === 1 ? 0 : 1], -side);

  function gen(list, capsOnly) {
    let n = 0;
    const s = side;
    for (let sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const p = board[sq];
      if (!p || (p > 0) !== (s > 0)) continue;
      const t = p > 0 ? p : -p;
      if (t === 1) {
        const dir = s * 16, rank = sq >> 4;
        const promoRank = s === 1 ? 6 : 1, startRank = s === 1 ? 1 : 6;
        const to = sq + dir;
        if (!board[to]) {
          if (rank === promoRank) { list[n++] = mv(sq, to, 5, 0); if (!capsOnly) { list[n++] = mv(sq, to, 4, 0); list[n++] = mv(sq, to, 3, 0); list[n++] = mv(sq, to, 2, 0); } }
          else if (!capsOnly) {
            list[n++] = mv(sq, to, 0, 0);
            if (rank === startRank && !board[to + dir]) list[n++] = mv(sq, to + dir, 0, F_DOUBLE);
          }
        }
        for (let k = -1; k <= 1; k += 2) {
          const c = to + k;
          if (c & 0x88) continue;
          const q = board[c];
          if (q && (q > 0) !== (s > 0)) {
            if (rank === promoRank) { list[n++] = mv(sq, c, 5, F_CAP); list[n++] = mv(sq, c, 4, F_CAP); list[n++] = mv(sq, c, 3, F_CAP); list[n++] = mv(sq, c, 2, F_CAP); }
            else list[n++] = mv(sq, c, 0, F_CAP);
          } else if (c === ep) list[n++] = mv(sq, c, 0, F_CAP | F_EP);
        }
      } else if (t === 2 || t === 6) {
        const off = t === 2 ? NOFF : KOFF;
        for (let i = 0; i < 8; i++) {
          const to = sq + off[i];
          if (to & 0x88) continue;
          const q = board[to];
          if (!q) { if (!capsOnly) list[n++] = mv(sq, to, 0, 0); }
          else if ((q > 0) !== (s > 0)) list[n++] = mv(sq, to, 0, F_CAP);
        }
        if (t === 6 && !capsOnly) {
          if (s === 1 && sq === 4) {
            if ((castle & 1) && !board[5] && !board[6] && board[7] === 4 && !attacked(4, -1) && !attacked(5, -1) && !attacked(6, -1)) list[n++] = mv(4, 6, 0, F_CASTLE);
            if ((castle & 2) && !board[3] && !board[2] && !board[1] && board[0] === 4 && !attacked(4, -1) && !attacked(3, -1) && !attacked(2, -1)) list[n++] = mv(4, 2, 0, F_CASTLE);
          } else if (s === -1 && sq === 116) {
            if ((castle & 4) && !board[117] && !board[118] && board[119] === -4 && !attacked(116, 1) && !attacked(117, 1) && !attacked(118, 1)) list[n++] = mv(116, 118, 0, F_CASTLE);
            if ((castle & 8) && !board[115] && !board[114] && !board[113] && board[112] === -4 && !attacked(116, 1) && !attacked(115, 1) && !attacked(114, 1)) list[n++] = mv(116, 114, 0, F_CASTLE);
          }
        }
      } else {
        const dirs = t === 3 ? BDIR : t === 4 ? RDIR : KOFF;
        for (let i = 0; i < dirs.length; i++) {
          const d = dirs[i];
          let to = sq + d;
          while (!(to & 0x88)) {
            const q = board[to];
            if (!q) { if (!capsOnly) list[n++] = mv(sq, to, 0, 0); }
            else { if ((q > 0) !== (s > 0)) list[n++] = mv(sq, to, 0, F_CAP); break; }
            to += d;
          }
        }
      }
    }
    return n;
  }

  // Returns false (and leaves the position unchanged) if the move leaves the mover's king in check.
  function make(m) {
    const from = FROM(m), to = TO(m), promo = PROMO(m), flag = FLAG(m);
    const p = board[from];
    let cap = board[to];
    hist.push({ m, cap, castle, ep, half, hash });
    hashHist.push(hash);
    hash ^= zp(p, from);
    if (cap) hash ^= zp(cap, to);
    board[from] = 0;
    if (flag & F_EP) {
      const cs = to - side * 16;
      cap = board[cs]; board[cs] = 0; hash ^= zp(cap, cs);
      hist[hist.length - 1].cap = cap;
    }
    const np = promo ? promo * side : p;
    board[to] = np; hash ^= zp(np, to);
    if (flag & F_CASTLE) {
      let rf, rt;
      if (to === 6) { rf = 7; rt = 5; } else if (to === 2) { rf = 0; rt = 3; } else if (to === 118) { rf = 119; rt = 117; } else { rf = 112; rt = 115; }
      const r = board[rf]; board[rf] = 0; board[rt] = r; hash ^= zp(r, rf) ^ zp(r, rt);
    }
    if (p === 6) king[0] = to; else if (p === -6) king[1] = to;
    hash ^= ZC[castle]; castle &= CMASK[from] & CMASK[to]; hash ^= ZC[castle];
    if (ep >= 0) hash ^= ZE[ep];
    ep = (flag & F_DOUBLE) ? from + side * 16 : -1;
    if (ep >= 0) hash ^= ZE[ep];
    half = (p === 1 || p === -1 || cap) ? 0 : half + 1;
    if (side === -1) full++;
    side = -side; hash ^= ZS;
    if (attacked(king[side === 1 ? 1 : 0], side)) { unmake(); return false; }
    return true;
  }
  function unmake() {
    const u = hist.pop(); hashHist.pop();
    const m = u.m, from = FROM(m), to = TO(m), promo = PROMO(m), flag = FLAG(m);
    side = -side;
    if (side === -1) full--;
    const np = board[to];
    const p = promo ? side : np;
    board[from] = p;
    if (flag & F_EP) { board[to] = 0; board[to - side * 16] = u.cap; }
    else board[to] = u.cap;
    if (flag & F_CASTLE) {
      let rf, rt;
      if (to === 6) { rf = 7; rt = 5; } else if (to === 2) { rf = 0; rt = 3; } else if (to === 118) { rf = 119; rt = 117; } else { rf = 112; rt = 115; }
      board[rf] = board[rt]; board[rt] = 0;
    }
    if (p === 6) king[0] = from; else if (p === -6) king[1] = from;
    castle = u.castle; ep = u.ep; half = u.half; hash = u.hash;
  }
  function makeNull() {
    hist.push({ m: 0, cap: 0, castle, ep, half, hash });
    hashHist.push(hash);
    if (ep >= 0) hash ^= ZE[ep];
    ep = -1; half = 0; side = -side; hash ^= ZS;
  }
  function unmakeNull() {
    const u = hist.pop(); hashHist.pop();
    side = -side; ep = u.ep; half = u.half; hash = u.hash;
  }

  const buf = new Int32Array(256);
  function legalMoves() {
    const n = gen(buf, false), out = [];
    for (let i = 0; i < n; i++) if (make(buf[i])) { unmake(); out.push(buf[i]); }
    return out;
  }

  function repetitions() {
    let c = 1;
    for (let i = hashHist.length - 2; i >= 0 && i >= hashHist.length - half; i -= 2) if (hashHist[i] === hash) c++;
    return c;
  }
  function insufficient() {
    let minors = 0, bishops = [], other = 0;
    for (let sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const t = Math.abs(board[sq]);
      if (!t || t === 6) continue;
      if (t === 2) minors++;
      else if (t === 3) { minors++; bishops.push(((sq >> 4) + (sq & 7)) & 1); }
      else other++;
    }
    if (other) return false;
    if (minors <= 1) return true;
    if (minors === bishops.length && bishops.every(b => b === bishops[0])) return true;
    return false;
  }
  // null while the game continues, otherwise { result: '1-0' | '0-1' | '1/2-1/2', reason }
  function status() {
    const moves = legalMoves();
    if (!moves.length) return inCheck() ? { result: side === 1 ? '0-1' : '1-0', reason: 'checkmate' } : { result: '1/2-1/2', reason: 'stalemate' };
    if (insufficient()) return { result: '1/2-1/2', reason: 'insufficient material' };
    if (half >= 100) return { result: '1/2-1/2', reason: '50-move rule' };
    if (repetitions() >= 3) return { result: '1/2-1/2', reason: 'repetition' };
    return null;
  }

  function uci(m) { return sqName(FROM(m)) + sqName(TO(m)) + (PROMO(m) ? 'nbrq'[PROMO(m) - 2] : ''); }
  function fromUci(s) {
    const f = sqIndex(s.slice(0, 2)), t = sqIndex(s.slice(2, 4)), pr = s[4] ? 'nbrq'.indexOf(s[4]) + 2 : 0;
    for (const m of legalMoves()) if (FROM(m) === f && TO(m) === t && PROMO(m) === pr) return m;
    return 0;
  }
  function san(m) {
    const from = FROM(m), to = TO(m), flag = FLAG(m), t = Math.abs(board[from]);
    let s;
    if (flag & F_CASTLE) s = (to & 7) === 6 ? 'O-O' : 'O-O-O';
    else {
      s = '';
      if (t === 1) { if (flag & F_CAP) s = 'abcdefgh'[from & 7]; }
      else {
        s = 'PNBRQK'[t - 1];
        const others = legalMoves().filter(o => o !== m && TO(o) === to && Math.abs(board[FROM(o)]) === t);
        if (others.length) {
          const sameFile = others.some(o => (FROM(o) & 7) === (from & 7)), sameRank = others.some(o => (FROM(o) >> 4) === (from >> 4));
          if (!sameFile) s += 'abcdefgh'[from & 7];
          else if (!sameRank) s += (from >> 4) + 1;
          else s += sqName(from);
        }
      }
      if (flag & F_CAP) s += 'x';
      s += sqName(to);
      if (PROMO(m)) s += '=' + 'PNBRQ'[PROMO(m) - 1];
    }
    make(m);
    if (inCheck()) s += legalMoves().length ? '+' : '#';
    unmake();
    return s;
  }

  // ---------- evaluation ----------
  function evaluate() {
    let mg = 0, eg = 0, phase = 0, wb = 0, bb = 0;
    for (let sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const p = board[sq];
      if (!p) continue;
      if (p > 0) { mg += MGW[p][sq]; eg += EGW[p][sq]; phase += PH[p]; if (p === 3) wb++; }
      else { const t = -p; mg -= MGB[t][sq]; eg -= EGB[t][sq]; phase += PH[t]; if (t === 3) bb++; }
    }
    if (phase > 24) phase = 24;
    let s = (mg * phase + eg * (24 - phase)) / 24;
    if (wb >= 2) s += 30; if (bb >= 2) s -= 30;
    // Endgame mop-up: when clearly winning, push the enemy king to the edge and walk ours closer.
    if (phase <= 8 && Math.abs(s) > 250) {
      const win = s > 0 ? 0 : 1, lk = king[1 - win], wk = king[win];
      const lf = lk & 7, lr = lk >> 4;
      const center = Math.max(3 - lf, lf - 4) + Math.max(3 - lr, lr - 4);
      const dist = Math.abs((wk & 7) - lf) + Math.abs((wk >> 4) - lr);
      const bonus = center * 12 + (14 - dist) * 5;
      s += win === 0 ? bonus : -bonus;
    }
    return (side === 1 ? s : -s) + 10 | 0;
  }

  // ---------- search ----------
  const INF = 1000000, MATE = 100000;
  const TTN = 1 << 19, TTM = TTN - 1;
  const ttKey = new Int32Array(TTN), ttMove = new Int32Array(TTN), ttScore = new Int32Array(TTN), ttDepth = new Int8Array(TTN), ttFlag = new Int8Array(TTN);
  const killers = new Int32Array(128 * 2);
  const history = new Int32Array(128 * 128);
  let nodes = 0, deadline = 0, stopped = false, rootBest = 0;
  const lists = Array.from({ length: 128 }, () => new Int32Array(256));
  const scores = Array.from({ length: 128 }, () => new Int32Array(256));

  function scoreMoves(list, sc, n, ttm, ply) {
    for (let i = 0; i < n; i++) {
      const m = list[i];
      if (m === ttm) { sc[i] = 2000000; continue; }
      const f = FLAG(m);
      if (f & F_CAP) {
        const victim = (f & F_EP) ? 1 : Math.abs(board[TO(m)]);
        sc[i] = 1000000 + victim * 100 - Math.abs(board[FROM(m)]);
      } else if (PROMO(m)) sc[i] = 900000 + PROMO(m);
      else if (m === killers[ply * 2]) sc[i] = 800000;
      else if (m === killers[ply * 2 + 1]) sc[i] = 700000;
      else sc[i] = history[FROM(m) * 128 + TO(m)];
    }
  }
  function pick(list, sc, n, i) {
    let bi = i;
    for (let j = i + 1; j < n; j++) if (sc[j] > sc[bi]) bi = j;
    if (bi !== i) { let t = list[i]; list[i] = list[bi]; list[bi] = t; t = sc[i]; sc[i] = sc[bi]; sc[bi] = t; }
    return list[i];
  }
  function hasPieces() {
    for (let sq = 0; sq < 120; sq++) {
      if (sq & 0x88) { sq += 7; continue; }
      const p = board[sq] * side;
      if (p > 1 && p < 6) return true;
    }
    return false;
  }

  function qsearch(alpha, beta, ply) {
    if ((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
    if (stopped) return 0;
    const stand = evaluate();
    if (ply >= 127) return stand;
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    const list = lists[ply], sc = scores[ply];
    const n = gen(list, true);
    scoreMoves(list, sc, n, 0, ply);
    for (let i = 0; i < n; i++) {
      const m = pick(list, sc, n, i);
      if (!PROMO(m)) {
        const victim = (FLAG(m) & F_EP) ? 1 : Math.abs(board[TO(m)]);
        if (stand + VAL[victim] + 200 < alpha) continue;
      }
      if (!make(m)) continue;
      const s = -qsearch(-beta, -alpha, ply + 1);
      unmake();
      if (stopped) return 0;
      if (s >= beta) return s;
      if (s > alpha) alpha = s;
    }
    return alpha;
  }

  function search(depth, alpha, beta, ply, allowNull) {
    if ((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
    if (stopped) return 0;
    if (ply > 0 && (half >= 100 || repetitions() > 1)) return 0;
    if (ply >= 120) return evaluate();
    const check = inCheck();
    if (check) depth++;
    if (depth <= 0) return qsearch(alpha, beta, ply);

    const idx = hash & TTM;
    let ttm = 0;
    if (ttKey[idx] === hash) {
      ttm = ttMove[idx];
      if (ply > 0 && ttDepth[idx] >= depth) {
        let s = ttScore[idx];
        if (s > MATE - 1000) s -= ply; else if (s < -MATE + 1000) s += ply;
        const fl = ttFlag[idx];
        if (fl === 0) return s;
        if (fl === 1 && s >= beta) return s;
        if (fl === 2 && s <= alpha) return s;
      }
    }

    if (allowNull && !check && depth >= 3 && ply > 0 && beta - alpha === 1 && hasPieces() && evaluate() >= beta) {
      makeNull();
      const s = -search(depth - 3, -beta, -beta + 1, ply + 1, false);
      unmakeNull();
      if (stopped) return 0;
      if (s >= beta) return beta;
    }

    const list = lists[ply], sc = scores[ply];
    const n = gen(list, false);
    scoreMoves(list, sc, n, ttm, ply);
    const origAlpha = alpha;
    let best = -INF, bestMove = 0, legal = 0;
    for (let i = 0; i < n; i++) {
      const m = pick(list, sc, n, i);
      if (!make(m)) continue;
      legal++;
      let s;
      if (legal === 1) s = -search(depth - 1, -beta, -alpha, ply + 1, true);
      else {
        const quiet = !(FLAG(m) & F_CAP) && !PROMO(m);
        const r = (depth >= 3 && legal > 4 && quiet && !check && !inCheck()) ? (legal > 12 ? 2 : 1) : 0;
        s = -search(depth - 1 - r, -alpha - 1, -alpha, ply + 1, true);
        if (s > alpha && (r || s < beta)) s = -search(depth - 1, -beta, -alpha, ply + 1, true);
      }
      unmake();
      if (stopped) return 0;
      if (s > best) {
        best = s; bestMove = m;
        if (s > alpha) {
          alpha = s;
          if (ply === 0) rootBest = m;
          if (s >= beta) {
            if (!(FLAG(m) & F_CAP) && !PROMO(m)) {
              if (killers[ply * 2] !== m) { killers[ply * 2 + 1] = killers[ply * 2]; killers[ply * 2] = m; }
              history[FROM(m) * 128 + TO(m)] += depth * depth;
            }
            break;
          }
        }
      }
    }
    if (!legal) return check ? -MATE + ply : 0;
    let st = best;
    if (st > MATE - 1000) st += ply; else if (st < -MATE + 1000) st -= ply;
    ttKey[idx] = hash; ttMove[idx] = bestMove; ttScore[idx] = st; ttDepth[idx] = depth;
    ttFlag[idx] = best >= beta ? 1 : best <= origAlpha ? 2 : 0;
    return best;
  }

  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // opts: { time ms, depth max, noise centipawns, random 0..1 }
  function think(opts) {
    const moves = legalMoves();
    if (!moves.length) return { move: 0 };
    if (moves.length === 1) return { move: moves[0], depth: 0 };
    if (opts.random && Math.random() < opts.random) return { move: moves[Math.floor(Math.random() * moves.length)], depth: 0, random: true };
    nodes = 0; stopped = false; deadline = Date.now() + opts.time;
    killers.fill(0); history.fill(0);
    if (opts.noise) {
      // Score every root move, then add noise so weaker bots pick believable but imperfect moves.
      let sc = moves.map(() => 0), reached = 0;
      for (let d = 1; d <= opts.depth; d++) {
        const cur = [];
        for (const m of moves) { make(m); const s = -search(d - 1, -INF, INF, 1, true); unmake(); if (stopped) break; cur.push(s); }
        if (stopped) break;
        sc = cur; reached = d;
        if (Date.now() > deadline) break;
      }
      let bi = 0, bv = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        const v = sc[i] + gauss() * opts.noise;
        if (v > bv) { bv = v; bi = i; }
      }
      return { move: moves[bi], score: sc[bi], depth: reached, nodes };
    }
    let best = moves[0], bestScore = 0, reached = 0;
    for (let d = 1; d <= opts.depth; d++) {
      rootBest = 0;
      const s = search(d, -INF, INF, 0, true);
      if (rootBest) best = rootBest;
      if (stopped) break;
      bestScore = s; reached = d;
      if (Math.abs(s) > MATE - 1000) break;
      if (Date.now() > deadline - opts.time * 0.45) break; // next depth would not finish
    }
    return { move: best, score: bestScore, depth: reached, nodes };
  }

  function perft(d) {
    if (!d) return 1;
    const list = new Int32Array(256), n = gen(list, false);
    let c = 0;
    for (let i = 0; i < n; i++) if (make(list[i])) { c += perft(d - 1); unmake(); }
    return c;
  }

  load(START);
  return {
    START, load, fen, legalMoves, make, unmake, inCheck, status, san, uci, fromUci, think, perft, evaluate, sqName,
    from: FROM, to: TO, promo: PROMO, flag: FLAG,
    get board() { return board; }, get side() { return side; }, get king() { return king; }, get ply() { return hist.length; },
  };
}
if (typeof module !== 'undefined') module.exports = ENGINE;
