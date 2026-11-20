const fs = require('fs'); const src = JSON.parse(fs.readFileSync(process.argv[2]));
const h = s => { let a = 2166136261, b = 5381; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a ^= c; a = Math.imul(a, 16777619); b = (Math.imul(b, 33) ^ c) | 0; } return (a >>> 0).toString(36) + (b >>> 0).toString(36).slice(-3); };
const out = {}; let col = 0;
for (const [k, v] of Object.entries(src)) { const kk = h(k); if (out[kk]) col++; out[kk] = v[0] + '|' + v[1]; }
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log('collisions', col, 'bytes', fs.statSync(process.argv[3]).size);
