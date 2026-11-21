# Puzzle generator

Runs automatically twice a day through GitHub Actions (`.github/workflows/puzzles.yml`), or by hand from the Actions tab ("Generate chess puzzles" → Run workflow).

1. `gen.js`: the arcade's chess bots play each other. When one makes a mistake that leaves a winning tactic, Stockfish checks that every step has exactly one good answer and the line wins material or mates.
2. `merge.js`: adds the new puzzles to the end of `puzzles.json` (existing puzzles keep their IDs), rates each one with `rate.js`, and stops at 15,000 puzzles. One-move puzzles are kept to about a fifth of each batch, and obvious ones (a free piece, or a cheap piece taking an expensive one) stop being added once there are 150 of them.
3. `rate.js`: the rating comes from the puzzle itself. More moves to find, a quiet or sacrificing first move, and moves the arcade engine needs to search deeply for all make it harder. A free piece, a cheap piece taking an expensive one, or mate in one makes it easier. One-move puzzles are capped (obvious captures at 950, others at 1450–1700).

The fifth field of each puzzle is the date it was added. The daily puzzle for a date only uses puzzles added before that date, so a day's puzzle never changes.

`themes.js` adds pin, skewer, discovered attack and quiet move tags (each only when the line later wins the piece involved). `gen.js` uses it for new puzzles; `node retag.js --write` adds the tags to puzzles already in `puzzles.json` without removing any.

**Hard mode:** `node gen.js out.jsonl 40 hard` checks lines deeper (Stockfish depth 18), allows mates up to 8 and lines up to 8 moves, looks for mistakes that still look fine to a 2-move-deep search, and keeps only puzzles with 3+ moves to find or 2-movers that `rate.js` puts at 1600+. In a local test it made about one puzzle per minute per process, rated roughly 1250 to 2000. The workflow runs two normal and two hard generators.

Both modes: when a long line reaches a spot with more than one good move and the solver is already clearly winning (+3), the puzzle now ends after the solver's previous move instead of being thrown away (only after at least 2 moves to find).
