# Puzzle generator

Runs automatically twice a day through GitHub Actions (`.github/workflows/puzzles.yml`), or by hand from the Actions tab ("Generate chess puzzles" → Run workflow).

1. `gen.js`: the arcade's chess bots play each other. When one makes a mistake that leaves a winning tactic, Stockfish checks that every step has exactly one good answer and the line wins material or mates.
2. `merge.js`: adds the new puzzles to the end of `puzzles.json` (existing puzzles keep their IDs), gives each one a rating from `calib.json`, and stops at 15,000 puzzles.

The fifth field of each puzzle is the date it was added. The daily puzzle for a date only uses puzzles added before that date, so a day's puzzle never changes.
