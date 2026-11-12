# arcadeShop: Chrome extension

A launcher for all 24 arcadeShop games. Every game is bundled inside the extension, so it works fully offline:
no server, no network calls and **no permissions**.

- **Toolbar popup:** search, shelves (Action / Driving / Sports / Puzzle / Favourites), recently played. Click a game (or type and press Enter) to open it in a new tab.
- **Full view** (button in the popup, or <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd>): the whole catalogue with thumbnails. <kbd>/</kbd> focuses search.
- Scores, settings and favourites are saved in this browser's extension storage (each game uses its own key prefix).

## Folder layout

```
arcade-extension/
  dist/          what Chrome loads (built output, self-contained)
  games-src/     source of the 24 games, one Vite project each (+ serve.mjs for the original dino/rug mirrors)
  docs/polish/   review, change and verification reports per game
  src/           launcher (popup + full view) and the catalogue, src/games.json
  public/        manifest, service worker, icons, thumbnails
  scripts/       build-games, verify-dist, package
  tests/         launcher unit tests
```

Each game in `games-src/<game>` can still be developed on its own: `cd games-src/<game> && npm install && npm run dev` (Fossil Frenzy lives in `games-src/dino/src`).

## Install (unpacked)

```bash
npm install
npm run build          # launcher + all 24 games -> dist/, then verify
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick `arcade-extension/dist`.
3. Pin **arcadeShop** from the puzzle-piece menu.

`npm run package` also writes `arcadeShop-<version>.zip` (for sharing or the Chrome Web Store).

## How it is built

| Step | What it does |
|---|---|
| `build:launcher` | type-checks, then Vite builds `src/popup.html` + `src/arcade.html` and copies `public/` (manifest, service worker, icons, thumbnails) |
| `build:games` | installs a game's dependencies if missing, then runs its own `npm run build -- --base ./ --outDir dist/games/<id>` (4 at a time) |
| `verify` | fails if a game or thumbnail is missing, the manifest asks for permissions, or any page has inline script, inline handlers, `javascript:` URLs or remote scripts (MV3 would block them) |

The catalogue lives in `src/games.json` (validated with zod). To add a game, add an entry there, put a 480×300 thumbnail in `public/thumbs/<id>.webp`, and rebuild.

CSP for extension pages: `script-src 'self' 'wasm-unsafe-eval'` (`wasm-unsafe-eval` is needed by Fossil Frenzy's physics engine).

## Known limits

- Fossil Frenzy and Living Room GP have an online leaderboard that needs a server. In the extension it shows as offline, and local bests still work.
- Thumbnails are static screenshots. Rebuild them if a game's look changes.
