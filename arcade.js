// Shared by every Pocket Arcade page: profile avatars and frames, rank titles, tickets, daily quests and the shop.
// Everything is stored on the device (localStorage); the profile also rides along in the Deep Dig cloud save.
(function () {
  const A = window.Arcade = {};
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const dayStr = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  A.dayStr = dayStr;

  // ---------- avatars (8x8 pixel art) ----------
  A.AVATARS = {
    cat: { map: ['B......B', 'BB....BB', 'BBBBBBBB', 'BEBBBBEB', 'BBBNNBBB', 'BBPBBPBB', '.BBBBBB.', '..BBBB..'], pal: { B: '#f0a13a', E: '#1b1b1b', N: '#ff8fa3', P: '#c46f1d' } },
    robot: { map: ['...AA...', '.GGGGGG.', 'GGEGGEGG', 'GGEGGEGG', 'GGGGGGGG', 'GGMMMMGG', '.GGGGGG.', '.G....G.'], pal: { A: '#ff5d5d', G: '#a7b6c2', E: '#38e0ff', M: '#4a5560' } },
    slime: { map: ['........', '...SS...', '..SSSS..', '.SSsSSS.', '.SESSES.', 'SSSSSSSS', 'SSSMMSSS', 'SSSSSSSS'], pal: { S: '#5ee08a', s: '#c9ffd9', E: '#123b22', M: '#2c8a4f' } },
    ghost: { map: ['..WWWW..', '.WWWWWW.', 'WWEWWEWW', 'WWEWWEWW', 'WWWWWWWW', 'WWWOOWWW', 'WWWWWWWW', 'W.WW.WW.'], pal: { W: '#eef2ff', E: '#2b2d42', O: '#9aa2c9' } },
    knight: { map: ['...RR...', '.HHHHHH.', 'HHHHHHHH', 'HDDDDDDH', 'HHHHHHHH', 'HHDHHDHH', '.HHHHHH.', '..HHHH..'], pal: { R: '#e23b3b', H: '#c9d3dc', D: '#2a2f36' } },
    frog: { map: ['.GG..GG.', 'GEGGGGEG', 'GGGGGGGG', 'GGGGGGGG', 'GMMMMMMG', 'GGGGGGGG', '.LLLLLL.', '..L..L..'], pal: { G: '#59c44e', E: '#111', M: '#c0392b', L: '#3e8e36' } },
    alien: { map: ['A......A', '.A....A.', '..GGGG..', '.GGGGGG.', 'GEEGGEEG', 'GEEGGEEG', '.GGGGGG.', '..GMMG..'], pal: { A: '#b6ff5c', G: '#8be04e', E: '#0d0d0d', M: '#3b6e1f' } },
    bear: { map: ['BB....BB', 'BbBBBBbB', 'BBBBBBBB', 'BEBBBBEB', 'BBBMMBBB', 'BBMNNMBB', '.BBMMBB.', '..BBBB..'], pal: { B: '#8a5a35', b: '#c98f5f', E: '#111', M: '#d9b38c', N: '#2b1a10' } },
    shroom: { map: ['..RRRR..', '.RWRRWR.', 'RRRRRRRR', 'RWRRRRWR', '..SSSS..', '..SESE..', '..SSSS..', '..SSSS..'], pal: { R: '#e0413a', W: '#fff', S: '#f1e3c8', E: '#333' } },
    dragon: { map: ['H....H..', 'HH..HH..', '.DDDDDD.', 'DDEDDDDD', 'DDDDDDDF', 'DDDDNNDF', '.DDDDDD.', '..D..D..'], pal: { H: '#f5c518', D: '#7a4fd6', E: '#ffe066', N: '#3b2370', F: '#ff8a3d' } },
    duck: { map: ['..YYYY..', '.YYYYYY.', '.YEYYYY.', '.YYYYOOO', '.YYYYOOO', 'YYYYYYY.', 'YYYYYYY.', '.YYYYY..'], pal: { Y: '#ffd93d', E: '#111', O: '#ff8c1a' } },
    pixel: { map: ['.KKKKKK.', 'KSSSSSSK', 'KSESSESK', 'KSSSSSSK', 'KSMSSMSK', 'KSSMMSSK', 'KSSSSSSK', '.KKKKKK.'], pal: { K: '#3a2a1a', S: '#ffd08a', E: '#222', M: '#a0522d' } },
    // shop avatars (bought with tickets)
    king: { map: ['Y.Y.Y.Y.', 'YYYYYYY.', 'YRYYYRY.', '.SSSSS..', '.SESES..', '.SSSSS..', '.SMMMS..', '..SSS...'], pal: { Y: '#f5c518', R: '#e23b3b', S: '#ffd08a', E: '#222', M: '#a0522d' } },
    wizard: { map: ['...PP...', '..PPPP..', '.PPYPPP.', 'PPPPPPPP', '.SSSSSS.', '.SESSES.', '.WWWWWW.', '..WWWW..'], pal: { P: '#5b3cc4', Y: '#ffe066', S: '#ffd08a', E: '#222', W: '#eeeeee' } },
    ninja: { map: ['.KKKKKK.', 'KKKKKKKK', 'KRRRRRRK', 'KSESSESK', 'KKKKKKKK', 'KKKKKKKK', '.KKKKKK.', '..K..K..'], pal: { K: '#1d1d24', R: '#e23b3b', S: '#ffd08a', E: '#111' } },
    panda: { map: ['KK....KK', 'KWWWWWWK', 'WKKWWKKW', 'WKEWWEKW', 'WWWKKWWW', 'WWWWWWWW', '.WWWWWW.', '..KKKK..'], pal: { K: '#1b1b1b', W: '#f4f4f4', E: '#fff' } },
    unicorn: { map: ['....Y...', '...YW...', '.PWWWW..', 'PPWEWWW.', 'P.WWWWWW', '..WWWNN.', '..WWWW..', '..W..W..'], pal: { Y: '#ffd93d', W: '#ffffff', P: '#ff7ad9', E: '#222', N: '#ffb3c7' } },
    pirate: { map: ['.KKKKKK.', 'KKKWKKKK', 'RRRRRRRR', '.SSSSSS.', '.SKKSES.', '.SSSSSS.', '.SMMMMS.', '..SSSS..'], pal: { K: '#1d1d24', W: '#fff', R: '#c0392b', S: '#e8b07a', E: '#222', M: '#6b3b1f' } },
  };
  A.PREMIUM = { king: 150, wizard: 150, ninja: 150, panda: 150, unicorn: 200, pirate: 200 };
  A.AV_BG = ['#2a221b', '#1f3a5f', '#3b1f4a', '#1f4a33', '#5a2a1f', '#4a4a1f', '#2b2b2b', '#0f2f3a'];
  // frames go around your avatar everywhere other people see it
  A.FRAMES = {
    none: { name: 'No frame', cost: 0, css: 'transparent' },
    bronze: { name: 'Bronze', cost: 60, css: '#cd7f32' },
    silver: { name: 'Silver', cost: 120, css: '#c3ccd6' },
    gold: { name: 'Gold', cost: 250, css: '#f5c518' },
    diamond: { name: 'Diamond', cost: 450, css: '#6ee7ff' },
    rainbow: { name: 'Rainbow', cost: 800, css: 'conic-gradient(#ff5d5d, #ffd93d, #5ee08a, #38e0ff, #7a4fd6, #ff5d5d)' },
  };
  const cache = {};
  A.avURL = (av, bg) => {
    const k = av + '|' + bg; if (cache[k]) return cache[k];
    const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d');
    x.fillStyle = A.AV_BG[bg] || A.AV_BG[0]; x.fillRect(0, 0, 8, 8);
    const P = A.AVATARS[av] || A.AVATARS.cat;
    P.map.forEach((row, y) => [...row].forEach((ch, i) => { if (P.pal[ch]) { x.fillStyle = P.pal[ch]; x.fillRect(i, y, 1, 1); } }));
    return (cache[k] = c.toDataURL());
  };
  A.drawAvatar = (cv, av, bg) => { const img = new Image(); img.onload = () => { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height); }; img.src = A.avURL(av, bg); };
  // <span class="afr"> wraps the avatar with its frame; size in px
  A.avHTML = (p, size = 36, cls = '') => {
    p = p || {}; const f = A.FRAMES[p.frame] || A.FRAMES.none, fr = p.frame && p.frame !== 'none';
    return `<span class="afr ${cls}${fr ? ' on' : ''}${p.frame === 'rainbow' ? ' rb' : ''}" style="--afr:${f.css};${size ? `width:${size}px;height:${size}px` : ''}"><img src="${A.avURL(A.AVATARS[p.av] ? p.av : 'cat', p.bg || 0)}" alt=""></span>`;
  };

  // ---------- profile + tickets ----------
  const PKEY = 'pocketArcade.profile';
  A.profile = () => {
    const p = read(PKEY) || {};
    if (!A.AVATARS[p.av]) p.av = 'cat';
    p.bg = p.bg || 0; p.tickets = p.tickets || 0; p.owned = p.owned || []; p.frame = p.frame || 'none'; p.earned = p.earned || 0;
    if (!p.since) p.since = Date.now();
    return p;
  };
  A.saveProfile = p => { p.at = Date.now(); write(PKEY, p); if (A.onProfile) try { A.onProfile(p); } catch (e) { } };
  A.addTickets = n => { const p = A.profile(); p.tickets += n; p.earned += n; A.saveProfile(p); return p.tickets; };
  A.owns = (p, id) => A.PREMIUM[id] != null || (A.FRAMES[id] && id !== 'none') ? p.owned.includes(id) : true;
  A.buy = id => {
    const p = A.profile(), cost = A.PREMIUM[id] != null ? A.PREMIUM[id] : (A.FRAMES[id] || {}).cost;
    if (cost == null || p.owned.includes(id)) return { ok: false, msg: 'Already yours' };
    if (p.tickets < cost) return { ok: false, msg: `You need ${cost - p.tickets} more tickets` };
    p.tickets -= cost; p.owned.push(id); A.saveProfile(p); return { ok: true, p };
  };

  // ---------- rank titles (from a rating) ----------
  // 7 ranks named after chess pieces, 3 divisions each (III → II → I), 100 points per division.
  A.RANKS = [
    { name: 'Pawn', icon: '♟', color: '#9a8f84', from: 0 },
    { name: 'Knight', icon: '♞', color: '#5fa35a', from: 500 },
    { name: 'Bishop', icon: '♝', color: '#3f8fd6', from: 800 },
    { name: 'Rook', icon: '♜', color: '#8a5bd6', from: 1100 },
    { name: 'Queen', icon: '♛', color: '#e0559a', from: 1400 },
    { name: 'King', icon: '♚', color: '#e8a21a', from: 1700 },
    { name: 'Grandmaster', icon: '★', color: '#ff4d4d', from: 2000 },
  ];
  A.rank = r => {
    r = Math.round(r || 0);
    let i = 0; for (let k = 0; k < A.RANKS.length; k++) if (r >= A.RANKS[k].from) i = k;
    const R = A.RANKS[i], top = i === A.RANKS.length - 1;
    const span = top ? 0 : A.RANKS[i + 1].from - R.from, div = top ? 0 : Math.min(2, Math.floor((r - R.from) / (span / 3)));
    const label = top ? R.name : `${R.name} ${['III', 'II', 'I'][div]}`;
    const nextAt = top ? null : R.from + Math.round(span / 3 * (div + 1));
    return { i, div, label, name: R.name, icon: R.icon, color: R.color, nextAt, key: i * 3 + div };
  };
  A.rankChip = (r, small) => { const k = A.rank(r); return `<span class="rchip${small ? ' sm' : ''}" style="--rc:${k.color}">${k.icon} ${k.label}</span>`; };

  // ---------- stats from every game (read straight from each game's save) ----------
  A.stats = () => {
    const chess = read('pocketArcade.chess.v1') || {}, pz = chess.pz || {}, sud = read('pocketArcade.sudoku.v1') || {}, cards = read('pocketArcade.cardshop.v2') || {}, dig = read('pocketArcade.deepDig.v1') || {}, tidy = read('pocketArcade.tidy.v1') || {};
    const rec = Object.values(chess.rec || {});
    let tidyN = 0; for (const k in (tidy.best || {})) { const b = tidy.best[k]; if (Math.max(b.relaxed || 0, b.timed || 0)) tidyN++; }
    return {
      chessGames: chess.games || 0, chessWins: rec.reduce((a, r) => a + (r.w || 0), 0), chessRating: chess.rating || 150,
      solved: pz.solved || 0, pzRating: pz.rating || 400, themeSolved: Object.values(pz.th || {}).reduce((a, t) => a + (t.s || 0), 0),
      mineFixed: chess.mineFixed || 0, mineLeft: (chess.mine || []).filter(m => !m.solved).length, dailyToday: !!((pz.daily || {})[dayStr()] || {}).at,
      sudokuWins: Object.values(sud.wins || {}).reduce((a, b) => a + b, 0), cardPacks: ((cards.stats || {}).packs) || 0,
      digMined: dig.mined || 0, tidyCleared: tidyN, playedDig: (dig.mined || 0) > 0, playedSudoku: !!Object.keys(sud.wins || {}).length,
      playedCards: ((cards.stats || {}).packs || 0) > 0, playedTidy: tidyN > 0,
      openStars: Object.values(chess.open || {}).reduce((a, o) => a + ((o && o.stars) || 0), 0),
      endStars: Object.values(chess.end || {}).reduce((a, o) => a + ((o && o.stars) || 0), 0),
      strongWins: ['dex', 'mara', 'viktor', 'titan'].reduce((a, id) => a + (((chess.rec || {})[id] || {}).w || 0), 0),
    };
  };

  // ---------- daily quests ----------
  // Chess only. Stat quests compare a stat with its value when the day's quests were picked; event quests count things Chess reports with Arcade.bump().
  A.QUESTS = [
    { id: 'p5', g: 'puz', text: 'Solve 5 rated puzzles', goal: 5, stat: 'solved', t: 25, href: 'chess.html#puzzles' },
    { id: 'p10', g: 'puz', text: 'Solve 10 rated puzzles', goal: 10, stat: 'solved', t: 45, href: 'chess.html#puzzles' },
    { id: 'acc3', g: 'puz', text: 'Solve 3 rated puzzles with no mistakes', goal: 3, ev: 'acc', t: 30, href: 'chess.html#puzzles' },
    { id: 'hard2', g: 'puz', text: 'Solve 2 puzzles on Harder or Hardest', goal: 2, ev: 'hard', t: 50, href: 'chess.html#puzzles' },
    { id: 'rush10', g: 'puz', text: 'Score 10 or more in one Puzzle Rush', goal: 10, ev: 'rush', max: true, t: 40, href: 'chess.html#puzzles' },
    { id: 'theme3', g: 'puz', text: 'Cleanly solve 3 theme practice puzzles', goal: 3, stat: 'themeSolved', t: 30, href: 'chess.html#puzzles' },
    { id: 'daily', g: 'puz', text: "Solve today's daily puzzle", goal: 1, stat: 'dailyToday', bool: true, t: 25, href: 'chess.html#puzzles' },
    { id: 'mine1', g: 'puz', text: 'Fix one of your own mistakes (From your games)', goal: 1, stat: 'mineFixed', t: 35, need: s => s.mineLeft > 0, href: 'chess.html#puzzles' },
    { id: 'g3', g: 'chess', text: 'Play 3 chess games against bots', goal: 3, stat: 'chessGames', t: 30, href: 'chess.html' },
    { id: 'w2', g: 'chess', text: 'Win 2 chess games against bots', goal: 2, stat: 'chessWins', t: 40, href: 'chess.html' },
    { id: 'online1', g: 'chess', text: 'Play an online game with a friend', goal: 1, ev: 'online', t: 45, need: () => !!(read('pocketArcade.chess.v1') || {}).fcode, href: 'chess.html' },
    { id: 'strong1', g: 'chess', text: 'Beat Dex or a stronger bot', goal: 1, stat: 'strongWins', t: 50, href: 'chess.html' },
    { id: 'open1', g: 'learn', text: 'Earn a star in the openings trainer (Learn tab)', goal: 1, stat: 'openStars', t: 30, href: 'chess.html' },
    { id: 'end1', g: 'learn', text: 'Earn a star in endgame practice (Learn tab)', goal: 1, stat: 'endStars', t: 30, href: 'chess.html' },
  ];
  A.BONUS = 50; // for finishing all three, plus 10 per day of streak (up to +50)
  const QKEY = 'pocketArcade.quests';
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  A.quests = () => {
    const d = dayStr(); let q = read(QKEY);
    if (q && q.date === d && q.picks.some(id => !A.QUESTS.find(x => x.id === id))) { // quests from an older version: pick again, keep progress
      const st = A.stats(), r = rng(Date.now() % 100000);
      const L = A.QUESTS.filter(x => (!x.need || x.need(st)) && !q.picks.includes(x.id));
      q.picks = q.picks.map(id => A.QUESTS.find(x => x.id === id) ? id : (L.splice(Math.floor(r() * L.length), 1)[0] || {}).id).filter(Boolean);
      for (const [k, v] of Object.entries(st)) if (q.base[k] == null) q.base[k] = +v || 0;
      write(QKEY, q);
    }
    if (!q || q.date !== d) {
      const st = A.stats(), prev = q, r = rng([...d].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + (A.profile().since % 997));
      const avail = A.QUESTS.filter(x => !x.need || x.need(st));
      const pickFrom = g => { const L = avail.filter(x => g.includes(x.g) && !picks.includes(x.id)); return L.length ? L[Math.floor(r() * L.length)].id : null; };
      const picks = [];
      [['puz'], ['chess'], ['puz', 'chess', 'learn']].forEach(g => { const id = pickFrom(g) || pickFrom(['puz', 'chess']); if (id) picks.push(id); });
      const streakAlive = prev && prev.allDone && prev.date === dayStr(-1);
      q = { date: d, picks, base: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, +v || 0])), ev: {}, claimed: [], bonus: false, streak: streakAlive ? prev.streak || 0 : 0, allDone: false };
      write(QKEY, q);
    }
    return q;
  };
  A.progress = (id, q = A.quests(), st = A.stats()) => {
    const Q = A.QUESTS.find(x => x.id === id); if (!Q) return [0, 1];
    let v = 0;
    if (Q.ev) v = q.ev[Q.ev] || 0;
    else if (Q.bool) v = st[Q.stat] ? 1 : 0;
    else v = Math.max(0, (+st[Q.stat] || 0) - (q.base[Q.stat] || 0));
    return [Math.min(v, Q.goal), Q.goal];
  };
  A.bump = (ev, n = 1, max = false) => { const q = A.quests(); q.ev[ev] = max ? Math.max(q.ev[ev] || 0, n) : (q.ev[ev] || 0) + n; write(QKEY, q); if (A.onQuests) try { A.onQuests(); } catch (e) { } };
  A.claim = id => {
    const q = A.quests(), Q = A.QUESTS.find(x => x.id === id);
    if (!Q || q.claimed.includes(id) || !q.picks.includes(id)) return 0;
    const [v, g] = A.progress(id, q); if (v < g) return 0;
    q.claimed.push(id); write(QKEY, q); A.addTickets(Q.t); return Q.t;
  };
  A.bonusReady = (q = A.quests()) => !q.bonus && q.picks.length && q.picks.every(id => q.claimed.includes(id));
  A.claimBonus = () => {
    const q = A.quests(); if (!A.bonusReady(q)) return 0;
    q.bonus = true; q.allDone = true; q.streak = (q.streak || 0) + 1; write(QKEY, q);
    const n = A.BONUS + Math.min(5, q.streak - 1) * 10; A.addTickets(n); return n;
  };
  A.readyCount = () => { const q = A.quests(), st = A.stats(); return q.picks.filter(id => !q.claimed.includes(id) && (([v, g]) => v >= g)(A.progress(id, q, st))).length + (A.bonusReady(q) ? 1 : 0); };
  // the quest list as HTML; pages style .aq-* their own way
  A.questsHTML = () => {
    const q = A.quests(), st = A.stats(), p = A.profile();
    const items = q.picks.map(id => {
      const Q = A.QUESTS.find(x => x.id === id), [v, g] = A.progress(id, q, st), done = q.claimed.includes(id), ready = !done && v >= g;
      return `<div class="aq-item${done ? ' done' : ready ? ' ready' : ''}"><div class="aq-tx"><b>${Q.text}</b><div class="aq-bar"><i style="width:${Math.round(v / g * 100)}%"></i></div><small>${v} / ${g}</small></div>${done ? '<span class="aq-ok">✓</span>' : ready ? `<button class="aq-claim" data-aq="${id}">Claim 🎟 ${Q.t}</button>` : `<a class="aq-go" href="${Q.href}">🎟 ${Q.t}</a>`}</div>`;
    }).join('');
    const all = q.picks.every(id => q.claimed.includes(id)), bonus = A.BONUS + Math.min(5, q.streak) * 10;
    return `<div class="aq-head"><span>Daily quests</span><span class="aq-tk">🎟 ${p.tickets}</span></div>${items}
      <div class="aq-item aq-chest${q.bonus ? ' done' : all ? ' ready' : ''}"><div class="aq-tx"><b>Daily chest</b><small>${q.bonus ? `Opened · ${q.streak} day streak` : `Finish all 3 for 🎟 ${bonus}${q.streak ? ` (${q.streak + 1} day streak)` : ''}`}</small></div>${q.bonus ? '<span class="aq-ok">✓</span>' : all ? '<button class="aq-claim" data-aq="bonus">Open 🎟 ' + bonus + '</button>' : '<span class="aq-lock">🔒</span>'}</div>
      <small class="aq-new">New quests every day at midnight.</small>`;
  };
  // wire claim buttons inside an element; after() re-renders
  A.wireQuests = (el, after, say) => {
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-aq]'); if (!b) return;
      const n = b.dataset.aq === 'bonus' ? A.claimBonus() : A.claim(b.dataset.aq);
      if (n && say) say(b.dataset.aq === 'bonus' ? `Daily chest! +${n} tickets` : `+${n} tickets`);
      after();
    });
  };
})();
