// Map catalogue and map selection (persisted in localStorage / sessionStorage).

/**
 * Playable maps. `base` selects the rug texture + route family ("sol" = procedural town rug,
 * "claude" = grid city rug with routes.json centrelines). `warp` distorts the procedural sol track
 * (a=amplitude, f=frequency, p=phase, mirror/reverse flip it, route=alt polygon, ballX=ball x override).
 * `seed`/`arrange` drive the random scenery layout: zone letter -> scenery kind.
 */
export const MAPS = [
  { id: "sol", name: "Winding Town", base: "sol", warp: { a: 1, f: 1, p: 0 } },
  {
    id: "sol-twist",
    name: "Twisty Town",
    base: "sol",
    warp: { a: 1.1, f: 1.2, p: 4.4, route: "snake", ballX: -46 },
    seed: 11,
    arrange: { A: "town", B: "football", C: "farm", D: "lakeCastle", E: "shops", F: "fair" },
  },
  {
    id: "sol-mirror",
    name: "Mirror Town",
    base: "sol",
    warp: { a: 0.9, f: 1.1, p: 3.1, mirror: true, reverse: true, route: "ring", ballX: -46 },
    seed: 23,
    arrange: { A: "shops", B: "town", C: "lake", D: "town", E: "civic", F: "football" },
  },
  { id: "claude", name: "Grid City", base: "claude", warp: { a: 0, f: 1, p: 0 } },
  {
    id: "claude-bend",
    name: "Bent City",
    base: "claude",
    warp: { a: 0.85, f: 1, p: 0.6, route: "outer", ballX: -12 },
    seed: 37,
    arrange: { CA: "town", CB: "football", CC: "civic", CD: "lakeCastle" },
  },
  {
    id: "claude-wild",
    name: "Wild City",
    base: "claude",
    warp: { a: 1.15, f: 1.25, p: 2.4, mirror: true, reverse: true, route: "west", ballX: 12 },
    seed: 53,
    arrange: { CA: "lake", CB: "town", CC: "football", CD: "farm" },
  },
  // Shaped rugs: same 280x196 print canvas, clipped to `shape` (see logic/shapeRoutes.js). No online board.
  {
    id: "round",
    name: "Round Rug",
    base: "sol",
    shape: "ellipse",
    board: false,
    preview: "png",
    warp: { a: 0, f: 1, p: 0, route: "round", ballX: 30 },
    seed: 71,
    arrange: { A: "town", B: "shops", C: "lake", D: "town", E: "civic", F: "farm", G: "town", H: "shops", I: "town", J: "town" },
  },
  {
    id: "runner",
    name: "Runner Rug",
    base: "sol",
    shape: "band",
    board: false,
    preview: "png",
    warp: { a: 0, f: 1, p: 0, route: "runner", ballX: -72 },
    seed: 83,
    arrange: { A: "town", B: "shops", C: "civic", D: "town", E: "fair" },
  },
];

/** True when results on this map may go to the online board rug:<id> (shaped rugs are local-only). */
export const hasBoard = (map) => map.board !== false;

export const MAP_CHOICE_KEY = "rug-racers-map-choice"; // localStorage
export const LAST_MAP_KEY = "rug-racers-last-map"; // sessionStorage
export const AUTOSTART_KEY = "rug-racers-autostart"; // sessionStorage

// ?map=<id> wins over the stored choice.
let requestedMapId = null;
if (typeof location < "u" && ((requestedMapId = new URLSearchParams(location.search).get("map")), !requestedMapId)) {
  try {
    requestedMapId = localStorage.getItem(MAP_CHOICE_KEY);
  } catch {}
}

/** Selected id or "random" (unknown/missing ids fall back to random). */
export const mapChoice = MAPS.some((m) => m.id === requestedMapId) ? requestedMapId : "random";

/** "random": any map except the one used earlier in this browser session. */
export function pickRandomMap() {
  let last = null;
  try {
    last = sessionStorage.getItem(LAST_MAP_KEY);
  } catch {}
  const candidates = MAPS.filter((m) => m.id !== last);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  try {
    sessionStorage.setItem(LAST_MAP_KEY, pick.id);
  } catch {}
  return pick;
}

/** The map used for this page load (exposed as window.__rug.MAP). */
export const MAP = mapChoice === "random" ? pickRandomMap() : MAPS.find((m) => m.id === mapChoice);

/** Entries for the maps menu: "Random" first. */
export const MAP_OPTIONS = [{ id: "random", name: "Random" }, ...MAPS];

/** Rug size [W, H] in world units per base. */
export const MAP_BASE_SIZES = { sol: [280, 196], claude: [288, 192] };

/** Reload the page; with `autostart` the next load goes straight into a race. */
export function reloadForMap(autostart) {
  try {
    if (autostart) sessionStorage.setItem(AUTOSTART_KEY, "1");
  } catch {}
  location.reload();
}

/** Returns true once if the previous page asked for autostart (flag is consumed). */
export function consumeAutostart() {
  try {
    const flag = sessionStorage.getItem(AUTOSTART_KEY) === "1";
    sessionStorage.removeItem(AUTOSTART_KEY);
    return flag;
  } catch {
    return false;
  }
}

/** Persist the chosen map and navigate to the page without a ?map= override. */
export function chooseMap(id) {
  try {
    localStorage.setItem(MAP_CHOICE_KEY, id);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.delete("map");
  location.href = url.href;
}
