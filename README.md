# Pocket Arcade

Free browser games built for your phone.

**Play:** https://quierksie.github.io/pocket-arcade/

## Deep Dig
Tap to mine, sell ores, upgrade your gear and drill toward the planet core.

- Hold down on the block with Power Grip, throw dynamite, and travel back to farm earlier layers.
- Prestige at Planet Core (460 m) for gems and permanent upgrades.
- Progress autosaves on your device. Use **More → Stats → Copy save code** to back it up or move it to another device.

## Chess
Play against six bots, from Pip (250) to Titan (2300). Pick your color, drag or tap to move, and use hints when you're stuck (games with hints don't count toward your rating). Takebacks are optional: turn them on before a game and wins give half the rating points. After a game, every move gets rated (best, excellent, good, inaccuracy, mistake, blunder) with your accuracy, and bad moves show the better move. While the bot is thinking you can premove: pick a piece and a square and it plays as soon as it's your turn.

### Play a friend online
**Play a friend online** (under Play a friend) lets you play someone on another device. One player taps **Create game**, picks a color and clock, and sends the 6-letter code or link. The other taps **Join** (or just opens the link). Moves, clocks, draw offers, resigning and rematches (colors swapped) all sync live through the arcade's Firebase database, and leaving or refreshing keeps the game so you can tap **Continue game**. Both players need to be signed in to an arcade account. Results count toward your head-to-head record against that friend. Online games aren't rated and have no takebacks.

Firestore rules need this part for online games (Firebase console → Firestore → Rules):
```
match /chessOnline/{code} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.host == request.auth.uid
                && request.resource.data.players == [request.auth.uid];
  allow update: if request.auth != null && (request.auth.uid in resource.data.players
                || (resource.data.status == 'waiting' && request.resource.data.players.hasAll(resource.data.players)
                    && request.resource.data.players.size() == 2 && request.auth.uid in request.resource.data.players));
  allow delete: if request.auth != null && request.auth.uid == resource.data.host;
}
```

### Leaderboard
The **Leaderboard** tab (next to Play bots and Puzzles) switches between chess and puzzle ratings, and shows your place and how many points you are behind the player above you.

### Openings
The opening's name (from Lichess's free CC0 list of about 3,500 openings, built into `openings.json` by `tools/openings/`) shows under the board during games and replays, in Game history, and in shared PGNs.

The **Learn** tab has an openings trainer with 16 main lines (8 as White, 8 as Black, in `tools/openings/lines.js`; `node tools/openings/check-lines.js` checks them). **Learn** shows each of your moves with an arrow and why it's played; **Practice** makes you play the line from memory. A clean practice run earns a star, and 3 stars means mastered.

### Endgame practice
The Learn tab also has 8 endgames to play against the full-strength engine: queen, two-rook, rook and two-bishop checkmates; king and pawn (win, and hold the draw as Black); the Lucena (build a bridge) and the Philidor (hold the draw as Black). Each has **Tips** explaining the technique. Wins earn 1 to 3 stars by move count (hints cost a star). Stalemating, losing the piece you need, or letting the pawn queen ends the attempt with an explanation. `node tools/endgames/check.js` checks the starting positions.

### Achievements
42 badges across chess, friends, bots, puzzles and the Learn tab, worked out from stats the game already keeps, so earlier progress counts. New ones pop up with a banner; **Achievements** on the Chess menu shows them all with progress bars. Unlocks are saved in `SV.ach`.

### Game history
Every finished chess game (bots, same phone, online) is saved on your device, newest first, up to 300. **Game history** on the Chess menu lists them with filters and your wins, losses, draws and win rate. Tap one to replay it with move ratings. **Share** (after any game, or on a replay) copies a link that opens a replay of the game, or the PGN for chess.com / Lichess.

### Puzzle explanations
Each puzzle starts with what the opponent just played and a goal that doesn't give the answer away ("Calculate a way to win material", "Find checkmate in 2", "Find the move that saves the game"). A wrong move plays out the opponent's best answer on the board with an explanation ("You take the pawn, but Black takes back with Qxd7, so you lose your queen for it"), then puts the board back. Correct moves and the opponent's replies get a short note, the Solution button explains each move as it plays, and the result card has a **How it works** walkthrough of the whole line.

### Hints
**Hint** works against bots and in Play a friend (same phone). It checks every legal move and the opponent's best answer to each, then shows a panel with the ★ best move and why (wins a piece, forks, stops a checkmate threat, develops a piece...), the next best moves with how they compare, and a tempting capture or check that doesn't work, with the reply that punishes it. Tap a move in the panel to see it on the board, or tap Hint again to hide it. In Play a friend, the result screen shows how many hints each player used. Bot games with hints are unrated.

### Arrows
Hold **Alt** (Option on Mac) and drag on the board to draw an arrow, or Alt + click a square to highlight it. Alt alone draws orange, Alt+Shift green, Alt+Ctrl/Cmd red and Alt+Shift+Ctrl/Cmd blue. A normal click clears them. On a phone, use the **Arrows** button instead. Right-click cancels a premove.

### Color setups
Tap the palette button to customize every color, then **Save as new** under *My setups* to keep that look under a name. Tap a setup to switch to it, and use **Update**, **Rename** or **Delete** on the one you picked. Once you have two or more, the ⇄ button next to the palette flips through them without opening the editor.

### Your own pictures
In the color editor, the **Screen** tab lets you upload any picture as the background (with a Fade slider so text stays readable), and the **Pieces** tab lets you tap any of the 12 pieces to replace it with your own picture. Transparent PNGs work best for pieces. Empty space around them is trimmed off automatically. Pictures are shrunk and saved on your device, and they're included when you save a color setup.

### Chess puzzles
Rated puzzles matched to your skill (Standard, Hard or Extra Hard), a daily puzzle with a streak and an archive back to 2016, and the Puzzle Journey from Wood to Legend. After each puzzle you get its rating, themes and target time, and you can open it on an analysis board to test other lines against the engine.

Tip: in Safari, tap Share → Add to Home Screen to play it like an app.
