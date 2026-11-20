const ENGINE = require(process.argv[2]); const fs = require('fs');
const E = ENGINE(); const out = {}; let bad = 0, n = 0;
for (const f of 'abcde') {
  const lines = fs.readFileSync(`chess-openings/${f}.tsv`, 'utf8').trim().split('\n').slice(1);
  for (const ln of lines) {
    const [eco, name, pgn] = ln.split('\t');
    E.load(E.START); let ok = true;
    for (const t of pgn.split(/\s+/)) {
      if (/^\d+\.+$/.test(t) || !t) continue;
      const m = E.legalMoves().find(x => E.san(x) === t);
      if (!m) { ok = false; break; }
      E.make(m);
    }
    if (!ok) { bad++; continue; }
    const key = E.fen().split(' ').slice(0, 4).join(' ');
    if (!out[key]) { out[key] = [eco, name]; n++; }
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log('positions', n, 'unparsed', bad, 'bytes', fs.statSync(process.argv[3]).size);
