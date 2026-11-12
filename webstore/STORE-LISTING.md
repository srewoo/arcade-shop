# Chrome Web Store listing: arcadeShop

Paste-ready copy and the asset checklist for the Chrome Web Store Developer Dashboard.
Upload package: `../arcadeShop-1.0.0.zip` (built by `npm run package`).

## Store listing tab

**Name** (from manifest): arcadeShop

**Summary** (from manifest `description`, 103/132 chars):

```
24 offline browser games in one launcher. Everything is bundled: no server, no network, no permissions.
```

**Description** (2680/16000 chars):

```
Twenty-four games behind one toolbar button. Click the arcadeShop icon, search or pick a shelf, press Enter, and the game opens in a new tab.

Everything is bundled inside the extension. There is no server, no account, no ads, no tracking and no network access, and the extension asks for no permissions. Scores, settings and favourites are saved in this browser only.

HOW IT WORKS
• Toolbar popup: search, shelves (Action, Driving, Sports, Puzzle, Favourites) and your recently played games.
• Full view: the whole catalogue with thumbnails. Open it from the popup or with Alt+Shift+A. Press / to search.
• Star any game to pin it to Favourites.

THE GAMES

ACTION
• Fossil Frenzy: 3D ragdoll endless runner with four modes, power-ups and weather.
• Crumb Run: Raid a night-time kitchen as Pip the mouse and soak the cats.
• Sky Skirmish: Vertical air-combat shooter with waves, bombs and bosses.
• Updraft: Hold to rise, release to fall through a narrowing cave.
• Pop Cannon: Bubble shooter with Arcade, Puzzle and Time Rush modes.
• Rebound Row: Brick breaker with 34 hand-made levels and an endless mode.
• Split Shot: Fire a grappling line at bouncing bubbles that split until they pop.

DRIVING
• Living Room GP: Toy-car racing across rugs and parquet against ghost laps.
• Redline Rush: Top-down traffic racer: dodge, skim past cars and boost.
• Kerbside: Precision parking with real steering, 24 levels and trailers.

SPORTS
• Lucky Lanes: Ten-pin bowling: solo, hot-seat, CPU rival and spare challenges.
• Pounce Pins: Ten-frame bowling where the pins are cats that land on their feet.
• Corner Pocket: Mini-pool with timed racks, trick shots and 8-ball vs the CPU.
• Clay Day: Clay target shooting with doubles, crossing pairs and wind.
• Tiny Links: 18-hole mini golf with sand, water, ramps and up to four players.
• Keepy Up: Tap the ball to keep it in the air. Classic, Windy and Two Balls.

PUZZLE
• Stackfall: Falling-block puzzler in a glass terrarium, five modes.
• Tile Tumble: Clear same-colour groups. Classic, move-limit, endless and daily.
• Zap Chain: Zap chains of matching discs against the clock; bombs clear rows.
• Sudoku Dash: Sudoku against the clock, with explained hints.
• Lantern Bridge: Night-crossing logic puzzles: one lantern, limited oil.
• Measure Up: Water-jug measuring puzzles, 35 levels with solver-checked par.
• Lily Hop: Swap the frogs and toads across the pond with forward-only hops.
• Tic-Tac-Toe: Versus CPU or a friend, plus a vanishing-marks variant.

KNOWN LIMITS
Fossil Frenzy and Living Room GP have online leaderboards that need a server, so inside the extension those show as offline. Your local best scores still work.
```

**Category:** Entertainment
**Language:** English

### Graphic assets

| Field | File | Size |
|---|---|---|
| Store icon | `store-icon-128.png` | 128×128, 96px artwork + 16px transparent padding |
| Screenshot 1 | `screenshot-1-launcher.png` | 1280×800 |
| Screenshot 2 | `screenshot-2-popup.png` | 1280×800 |
| Screenshot 3 | `screenshot-3-3d-games.png` | 1280×800 |
| Screenshot 4 | `screenshot-4-arcade.png` | 1280×800 |
| Screenshot 5 | `screenshot-5-offline.png` | 1280×800 |
| Small promo tile (required) | `promo-small-440x280.png` | 440×280 |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400×560 |
| Promo video | `../brag-output/brag.mp4` | Upload to YouTube first; the dashboard takes a YouTube URL only |

Screenshots and tiles are 24-bit PNG with no alpha, as the dashboard requires.

## Privacy practices tab

**Single purpose:**

```
arcadeShop is a launcher for 24 browser games that are bundled inside the extension. It lists the games, lets the user search and favourite them, and opens the chosen game in a new tab.
```

**Permission justification:** none needed. The manifest requests no `permissions` and no `host_permissions`. Opening a game uses `chrome.tabs.create`, which needs no permission.

**Remote code:** No, I am not using remote code. All JavaScript and WebAssembly ships in the package. The extension-page CSP is `script-src 'self' 'wasm-unsafe-eval'`; `wasm-unsafe-eval` is only there so Fossil Frenzy's bundled physics engine (WebAssembly) can run.

**Data usage:** tick none of the data types. Nothing is collected or transmitted. Favourites, recently played, scores and settings live in the extension's own localStorage on the user's device.

Certify all three disclosures (no selling data, no unrelated use, no creditworthiness use).

**Privacy policy URL:** still needed (the dashboard asks for one). A one-paragraph page stating the above is enough; host it anywhere public.

## Before you submit

- [ ] Run `npm run package` so the zip matches the current `dist/`.
- [ ] Upload `brag.mp4` to YouTube (unlisted is fine) and paste the link.
- [ ] Publish a privacy policy page and paste its URL.
- [ ] Check every game's third-party assets (fonts, sounds, models) are licensed for distribution.
