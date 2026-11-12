// Map picker menu: rug texture previews, per-map best time, and switching maps (which reloads the page).
import * as THREE from "three";
import { MAPS, MAP_OPTIONS, MAP, mapChoice, MAP_BASE_SIZES, chooseMap, hasBoard } from "../config/maps.js";
import { RUG } from "../world/layoutSelect.js";
import { boardKey, fetchScores } from "../api/leaderboard.js";
import { formatTime } from "../ui/format.js";
import { sfx } from "../audio/sfx.js";
import { world, renderer, ui, cameraRig, mapPreviewRoute, rugUniforms } from "./bootstrap.js";
import { stage } from "./stage.js";
import { app } from "./state.js";
import { layout } from "./layout.js";
import { settings, updateSetting } from "./settingsMenu.js";
import { loadRecord } from "./records.js";
import { PAR_LAP_SECONDS } from "../config/medals.js";
import { parMs, medalFor } from "../logic/medals.js";

/** The rug texture the world was built with (the current map). Original `hp`. */
const defaultRugTexture = world.rugMat.map;
const previewTextures = new Map();

/** Lazily load ./maps/<id>.jpg as a preview texture. Original `mm`. */
export function loadMapPreviewTexture(map) {
  if (!previewTextures.has(map.id)) {
    const texture = new THREE.TextureLoader().load(`./maps/${map.id}.${map.preview ?? "jpg"}`, () => {
      if (app.previewing === map && app.previewRoute) previewMap(map, true);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    previewTextures.set(map.id, texture);
  }
  return previewTextures.get(map.id);
}

/**
 * Show a map on the rug: swap the rug texture + size, show the route overlay.
 * showRoute=false restores the current map's own texture. Original `Wl`.
 */
export function previewMap(map, showRoute = false) {
  app.previewing = map;
  app.previewRoute = showRoute;
  const texture = showRoute ? loadMapPreviewTexture(map) : defaultRugTexture;
  if (texture !== defaultRugTexture && !texture.image) return; // not loaded yet; onLoad callback retries
  world.rugMat.map = texture;
  world.rugMat.alphaTest = map.shape ? 0.5 : 0; // shaped previews are PNGs with transparent corners
  world.rugMat.needsUpdate = true;
  mapPreviewRoute.show(showRoute ? map.id : null);
  rugUniforms.uTrailK.value = showRoute ? 0 : 1;
  const [baseW, baseH] = MAP_BASE_SIZES[map.base];
  const scaleX = baseW / RUG.W;
  const scaleZ = baseH / RUG.H;
  world.rug.scale.set(scaleX, scaleZ, 1);
  world.edge.scale.set(scaleX, 1, scaleZ);
}

/** Board key -> latest top list. Original `nl`. */
export const topScoresCache = new Map();

/** Call back with cached top scores (if any) immediately, then again after a fresh fetch. Original `gm`. */
export function fetchTopCached(key, callback) {
  if (topScoresCache.has(key)) callback(topScoresCache.get(key));
  fetchScores(key, 8).then((result) => {
    if (result.top) {
      topScoresCache.set(key, result.top);
      callback(result.top);
    }
  });
}

/** Best medal per map id for the current lap setting (race or time-trial record, whichever is faster). */
function mapMedals() {
  const medals = {};
  for (const map of MAPS) {
    const par = parMs(PAR_LAP_SECONDS[map.id], settings.laps);
    const times = ["race", "timetrial"].map((kind) => loadRecord(kind, map.id, settings.laps)?.ms).filter(Boolean);
    const medal = times.length ? medalFor(Math.min(...times), par) : null;
    if (medal) medals[map.id] = medal;
  }
  return medals;
}

/** Show the side leaderboard in the maps menu only when the viewport has room. Original `hu`. */
export function updateMapBoardVisibility() {
  const rect = stage.getBoundingClientRect();
  const aspect = rect.width / rect.height;
  const viewHeight = Math.max(RUG.H + 8, (RUG.W + 8) / aspect) / (1 - (cameraRig.menuRoom || 0));
  const sideSpace = (rect.width * (1 - 288 / (viewHeight * aspect))) / 2;
  ui.showMapBoard(
    app.mapBoard && !layout.isVertical && sideSpace >= ui.mapBoardWidth() + 20 ? app.mapBoard : null,
  );
}

/** Redraw the maps menu for app.mapIndex and kick off the best-time fetch. Original `gl`. */
export function refreshMapsMenu() {
  const option = MAP_OPTIONS[app.mapIndex];
  app.cycleAt = 0;
  if (option.id !== "random") {
    previewMap(
      MAPS.find((map) => map.id === option.id),
      true,
    );
  }
  ui.setMapBest("");
  app.mapBoard = null;
  updateMapBoardVisibility();
  if (option.id !== "random" && hasBoard(option)) {
    fetchTopCached(boardKey(option.id), (top) => {
      if (MAP_OPTIONS[app.mapIndex] !== option || app.mode !== "maps") return; // stale
      ui.setMapBest(top[0] ? `Best: ${formatTime(top[0].ms / 1e3)} - ${top[0].name}` : "");
      app.mapBoard = { name: option.name, top };
      updateMapBoardVisibility();
    });
  }
  ui.drawMaps(
    MAP_OPTIONS,
    app.mapIndex,
    (index) => {
      app.mapIndex = index;
      sfx.click();
      refreshMapsMenu();
    },
    mapMedals(),
  );
  const onStyle = (key, value) => {
    updateSetting(key, value); // repaints the current rug live; other maps' previews stay classic
    sfx.click();
    ui.drawMapStyle(settings, onStyle);
  };
  ui.drawMapStyle(settings, onStyle);
}

/** Show the boot overlay again, release the GL context, then run callback (page reload). Original `of`. */
export function reloadWithBootScreen(callback) {
  if (app.leaving) return;
  app.leaving = true;
  const boot = document.getElementById("boot");
  boot.style.opacity = "1";
  boot.style.display = "grid";
  window.__bootStart?.();
  try {
    renderer.forceContextLoss();
  } catch {}
  setTimeout(callback, 30);
}

/** Title -> maps menu. Original `fb`. */
export function enterMaps() {
  app.mode = "maps";
  app.mapIndex = MAP_OPTIONS.findIndex((option) => option.id === mapChoice);
  app.cycle = 0;
  ui.showTitle(false);
  ui.showMaps(true);
  sfx.click();
  refreshMapsMenu();
  layoutMapsMenu();
}

/** Reserve room above the menu panel in the camera framing. Original `db`. */
export function layoutMapsMenu() {
  const stageRect = stage.getBoundingClientRect();
  const panelRect = ui.root.querySelector(".maps .gar-panel").getBoundingClientRect();
  cameraRig.menuRoom = Math.min(0.55, (stageRect.bottom - panelRect.top + 8) / stageRect.height);
  cameraRig.menuOpen = true;
  updateMapBoardVisibility();
}

/** Maps menu -> title. Original `vm`. */
export function exitMaps() {
  cameraRig.menuOpen = false;
  app.mode = "title";
  previewMap(MAP);
  ui.showTitle(true); // before closing: focus returns to the Maps button, which must be visible again
  ui.showMaps(false);
  sfx.click();
}

/** Enter pressed in the maps menu: keep the same map or switch (reload). Original `pb`. */
export function confirmMap() {
  const id = MAP_OPTIONS[app.mapIndex].id;
  if (id === mapChoice) {
    exitMaps();
    return;
  }
  ui.showMaps(false);
  reloadWithBootScreen(() => chooseMap(id));
}
