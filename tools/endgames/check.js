const ENGINE = require('../puzzlegen/engine.js'); const E = ENGINE();
const F = { kqk: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', twork: '8/8/8/3k4/8/8/8/R3K2R w - - 0 1', krk: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', kbbk: '8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1',
  kpk: '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1', kpkdraw: '8/8/4k3/8/4P3/4K3/8/8 b - - 0 1', lucena: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', philidor: '4k3/R7/7r/4P3/4K3/8/8/8 b - - 0 1' };
for (const [k, f] of Object.entries(F)) {
  E.load(f); const st = E.status(), n = E.legalMoves().length;
  const r = E.think({ time: 1500, depth: 40, noise: 0, random: 0, full: true });
  console.log(k.padEnd(9), 'legal moves', n, 'status', st ? st.reason : '-', 'inCheck', E.inCheck(), 'engine best', r.move ? E.san(r.move) : '-', 'score', r.score);
}
