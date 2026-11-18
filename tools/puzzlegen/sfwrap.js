const { spawn } = require('child_process');
class SF {
  constructor() {
    this.p = spawn('node', [__dirname + '/node_modules/stockfish/bin/stockfish-19-lite-single.js']);
    this.buf = ''; this.waiters = [];
    this.p.stdout.on('data', d => { this.buf += d; let i; while ((i = this.buf.indexOf('\n')) >= 0) { const line = this.buf.slice(0, i).trim(); this.buf = this.buf.slice(i + 1); this.onLine(line); } });
    this.lines = [];
  }
  onLine(l) { this.lines.push(l); const w = this.waiters[0]; if (w && w.test(l)) { this.waiters.shift(); w.res(this.lines); this.lines = []; } }
  send(c) { this.p.stdin.write(c + '\n'); }
  wait(re) { return new Promise(res => this.waiters.push({ test: l => re.test(l), res })); }
  async init() { this.send('uci'); await this.wait(/^uciok/); this.send('setoption name Hash value 64'); this.send('isready'); await this.wait(/^readyok/); }
  // returns [{move, cp|mate, pv}] for multipv lines at final depth
  async analyse(fen, { depth = 14, multipv = 2, nodes } = {}) {
    this.send('setoption name MultiPV value ' + multipv);
    this.send('position fen ' + fen);
    this.send(nodes ? 'go nodes ' + nodes : 'go depth ' + depth);
    const lines = await this.wait(/^bestmove/);
    const best = {};
    for (const l of lines) {
      const m = l.match(/^info .*?depth (\d+) .*?multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/);
      if (!m) continue;
      best[m[2]] = { depth: +m[1], [m[3]]: +m[4], pv: m[5].split(' '), move: m[5].split(' ')[0] };
    }
    return Object.keys(best).sort().map(k => best[k]);
  }
  quit() { this.send('quit'); this.p.kill(); }
}
module.exports = SF;
