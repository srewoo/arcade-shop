// Keyboard / touch input and per-mode menu key handling.
import { IS_COARSE_POINTER } from "../util/math.js";
import { createTouchControls } from "../input/touchControls.js";
import { sfx } from "../audio/sfx.js";
import { MAP_OPTIONS, MAPS, mapChoice, reloadForMap } from "../config/maps.js";
import { CAR_COLORS } from "../config/carColors.js";
import { ui, fpsEl } from "./bootstrap.js";
import { stage } from "./stage.js";
import { query } from "./query.js";
import { app } from "./state.js";
import { layout, requestResize } from "./layout.js";
import { skinChoice, setSkinOption } from "./garage.js";
import { previewMap, refreshMapsMenu, confirmMap, exitMaps, enterMaps, reloadWithBootScreen } from "./maps.js";
import { enterGarage, exitGarage, startRace, startGrab, goTitle } from "./modes.js";
import { stashKind } from "./records.js";
import { isSettingsOpen, openSettings, closeSettings, settings } from "./settingsMenu.js";
import { boostActive } from "../logic/boostToggle.js";
import { isPaused, isTipsOpen, pauseGame, handlePauseKeys, closeTips, openTips, emitAudio } from "./overlays.js";

/** Touch controls are used on coarse-pointer devices or with ?touch. Original `xm`. */
export const isTouch = IS_COARSE_POINTER || query.has("touch");

/** KeyboardEvent.code values currently held. Original `ls`. */
export const keysDown = new Set();
/** Codes pressed since the last frame (cleared at the end of each frame). Original `Zt`. */
export const keysPressed = new Set();

/** Latched nitro state for the Toggle setting. */
const boostLatch = { latched: false };
const BUTTON_KEYS = ["Enter", "NumpadEnter", "Space"];
const DRIVING_MODES = ["race", "intro"];

window.addEventListener("keydown", (event) => {
  const owner = event.target.closest?.(".settings, .maps-style, .pause, .tips");
  if (owner?.classList.contains("settings")) {
    // the settings panel owns its keys (arrows, space, tab); only Esc / O close it
    if (event.code === "Escape" || event.code === "KeyO") closeSettings();
    return;
  }
  if (owner?.classList.contains("pause")) {
    // pause overlay: Enter / Space / Tab / arrows act on its buttons; Esc, P and M reach the game
    if (BUTTON_KEYS.includes(event.code) || ["Tab", "ArrowUp", "ArrowDown"].includes(event.code)) return;
  } else if (owner?.classList.contains("tips")) {
    return; // any key closes the card (handled per frame)
  } else if (owner && event.code !== "Escape") return; // map-picker style selectors keep their own arrows/space/enter
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return; // typing a name / using a dropdown
  // a focused on-screen button activates natively; while driving, Space/Enter still belong to the car
  if (event.target instanceof HTMLButtonElement && BUTTON_KEYS.includes(event.code) && !DRIVING_MODES.includes(app.mode)) return;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
  if (!keysDown.has(event.code)) keysPressed.add(event.code);
  keysDown.add(event.code);
});
window.addEventListener("keyup", (event) => keysDown.delete(event.code));
/** Release every held key and the touch controls (pause, tab hidden, dialogs). */
export function clearInputs() {
  keysDown.clear();
  boostLatch.latched = false;
  touchStick?.reset?.();
}
window.addEventListener("blur", clearInputs);
stage.addEventListener("pointerdown", () => {
  window.focus();
  if (app.mode === "intro") keysPressed.add("Pointer"); // a tap also skips the intro dive
});
// The title screen's primary key button starts a race.
ui.root.querySelector(".key-btn:not(.alt)").addEventListener("click", () => {
  if (app.mode === "title" && !isSettingsOpen()) startRace("race");
});
stage.classList.toggle("touch", isTouch);

/** Virtual stick (null on desktop). Original `eh`. */
export const touchStick = isTouch
  ? createTouchControls(ui.hud, {
      press: (code) => {
        if (!keysDown.has(code)) keysPressed.add(code);
        keysDown.add(code);
      },
      release: (code) => keysDown.delete(code),
    })
  : null;
// Any element with data-key acts like a key press (on-screen buttons).
ui.root.addEventListener("click", (event) => {
  const code = event.target.closest("[data-key]")?.dataset.key;
  if (code) keysPressed.add(code);
});
ui.onEvent = (name, payload) => emitAudio(name, payload);
ui.onCount = (text) => {
  if (text === "GO!") sfx.go();
  else sfx.beep();
};
ui.onBanner = () => sfx.finish(app.session.race.player.place === 1);
ui.setSoundLabel(sfx.muted);

/** Translate held keys / touch stick into the car's input record. Original `_b`. */
export function readDriveInput() {
  const down = (code) => keysDown.has(code);
  const steerKeys = (down("KeyD") || down("ArrowRight") ? 1 : 0) - (down("KeyA") || down("ArrowLeft") ? 1 : 0);
  return {
    throttle: down("KeyW") || down("ArrowUp") || (touchStick && !down("KeyS")) ? 1 : 0,
    brake: down("KeyS") || down("ArrowDown") ? 1 : 0,
    steer: steerKeys || touchStick?.steer || 0,
    drift: (down("KeyS") || down("ArrowDown")) && Math.abs(steerKeys || touchStick?.steer || 0) > 0.4,
    boost: boostActive(
      settings.boostMode,
      boostLatch,
      down("ShiftLeft") || down("ShiftRight"),
      keysPressed.has("ShiftLeft") || keysPressed.has("ShiftRight"),
      (app.session?.race.player.boost ?? 1) > 0.001,
    ),
    jump: down("Space") || keysPressed.has("Space"),
  };
}

const pressed = (code) => keysPressed.has(code);
const isEnter = () => pressed("Enter") || pressed("NumpadEnter");

function handleMapsKeys() {
  const count = MAP_OPTIONS.length;
  if (MAP_OPTIONS[app.mapIndex].id === "random" && performance.now() > app.cycleAt) {
    // "Random" tile cycles through the previews every 650 ms
    app.cycleAt = performance.now() + 650;
    app.cycle = (app.cycle + 1) % MAPS.length;
    previewMap(MAPS[app.cycle], true);
  }
  if (isEnter()) confirmMap();
  else if (pressed("Escape") || pressed("KeyK")) exitMaps();
  else if (pressed("ArrowLeft") || pressed("ArrowUp")) {
    app.mapIndex = (app.mapIndex + count - 1) % count;
    sfx.click();
    refreshMapsMenu();
  } else if (pressed("ArrowRight") || pressed("ArrowDown")) {
    app.mapIndex = (app.mapIndex + 1) % count;
    sfx.click();
    refreshMapsMenu();
  }
}

function handleGarageKeys() {
  const cycle = (key, size, delta) => setSkinOption(key, (skinChoice[key] + delta + size) % size);
  if (isEnter() || pressed("Escape") || pressed("KeyL")) exitGarage();
  else if (pressed("ArrowLeft") || pressed("KeyA")) cycle("color", CAR_COLORS.length, -1);
  else if (pressed("ArrowRight") || pressed("KeyD")) cycle("color", CAR_COLORS.length, 1);
  else if (pressed("ArrowUp") || pressed("KeyW")) cycle("model", 4, -1);
  else if (pressed("ArrowDown") || pressed("KeyS")) cycle("model", 4, 1);
  else if (pressed("Space")) {
    setSkinOption("kind", skinChoice.random ? "lego" : skinChoice.kind === "lego" ? "classic" : "random");
  }
}

function handleGlobalKeys() {
  if (pressed("KeyH")) layout.uiVisible = !layout.uiVisible;
  if (pressed("KeyV")) {
    layout.isVertical = !layout.isVertical;
    layout.autoOrientation = false;
    requestResize();
  }
  if (pressed("KeyF")) fpsEl.classList.toggle("show");
  if (pressed("KeyM")) ui.setSoundLabel(sfx.toggleMute());
}

/** Settings, the tips card and the pause overlay are modal: nothing else reacts while one is open. */
function handleModalKeys() {
  if (isSettingsOpen()) {
    if (pressed("Escape") || pressed("KeyO")) closeSettings();
    return true;
  }
  if (isTipsOpen()) {
    if (keysPressed.size > 0) closeTips();
    return true;
  }
  if (isPaused()) {
    handlePauseKeys(pressed);
    return true;
  }
  return false;
}

function handleTitleKeys() {
  if (pressed("KeyL")) enterGarage();
  else if (pressed("KeyK")) enterMaps();
  else if (pressed("KeyO")) openSettings();
  else if (pressed("Slash")) openTips();
  if (isEnter()) startRace("race");
  else if (pressed("KeyT")) startRace("timetrial");
}

function handleResultsKeys() {
  if (isEnter()) {
    if (mapChoice === "random") {
      stashKind(app.raceKind ?? "race");
      reloadWithBootScreen(() => reloadForMap(true));
    } else {
      app.shownResults = false;
      startRace();
    }
  } else if (pressed("Escape")) startGrab();
}

/** Per-frame handling of global hotkeys and menu navigation for the current mode. Original `Eb`. */
export function handleMenuKeys() {
  handleGlobalKeys();
  const mode = app.mode;
  if (!handleModalKeys()) {
    if (mode === "maps") handleMapsKeys();
    else if (mode === "garage") handleGarageKeys();
    else if (mode === "title") handleTitleKeys();
    else if (mode === "demo") {
      if (pressed("KeyA") || pressed("Escape")) goTitle();
    } else if (mode === "results") handleResultsKeys();
    else if ((mode === "race" || mode === "intro") && (pressed("Escape") || pressed("KeyP"))) pauseGame("key");
  }
  ui.setVisible(layout.uiVisible);
}
