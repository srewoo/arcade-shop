// Game mode transitions and per-frame mode logic.
// Modes: title -> (garage | maps | demo) ; title -> intro -> race -> results -> (intro again | grab -> outro -> title/reload)
import { MAP, hasBoard } from "../config/maps.js";
import { TRACK, projectOnTrack } from "../world/trackSamples.js";
import { route } from "../world/layoutSelect.js";
import { boardKey } from "../api/leaderboard.js";
import { sfx } from "../audio/sfx.js";
import { ui, cameraRig, popup, particles, trailField, obstacles, rugUniforms, classicCars, legoCars, boostPadsView } from "./bootstrap.js";
import { app, globalTime } from "./state.js";
import { Session, physicsEnv } from "./session.js";
import { applySkins, redrawGarage, carModels } from "./garage.js";
import { clearInputs } from "./input.js";
import { showTipsIfFirstRun } from "./overlays.js";
import { topScoresCache, fetchTopCached } from "./maps.js";
import { settings } from "./settingsMenu.js";
import { loadRecord, loadGhost, titleBestText } from "./records.js";
import { setCameraViewState } from "./cameraViews.js";

/** Clear particles and reset car models (lego bricks, visible cabins). Original `hf`. */
export function resetCarsAndParticles() {
  particles.clear();
  for (const car of [...classicCars, ...legoCars]) {
    if (car.lego) car.reset();
    for (const part of car.cabin) part.visible = true;
  }
}

/** Create a fresh Session, reset tyre tracks, skin the cars. Original `uf`. */
export function newSession(demo, laps, menu = false, extra = {}) {
  app.session = new Session({ demo, laps, menu, ...extra });
  boostPadsView.setPads(app.session.race.pads);
  trailField.reset();
  applySkins(app.session);
  app.carTaken = false;
  obstacles.updateBall(0);
  obstacles.cat.root.visible = false;
  return app.session;
}

/** Title screen: a "menu" race runs in the background on a flat rug. Original `ql`. */
export function goTitle() {
  const key = boardKey(MAP.id);
  app.mode = "title";
  ui.setTitleRecord(MAP.name, topScoresCache.get(key) ?? null);
  ui.setTitleLabels(settings.laps);
  ui.setTitleBest(titleBestText(settings.laps));
  if (hasBoard(MAP)) fetchTopCached(key, (top) => ui.setTitleRecord(MAP.name, top));
  newSession(false, 9999, true).race.startCountdown(0.01);
  popup.setFlat();
  cameraRig.mode = "top";
  app.cockpit = false;
  ui.showTitle(true);
  ui.showHUD(false);
  ui.showResults(null);
  ui.showHint(false);
  ui.showTouchTip(false);
  ui.showCountdown(null);
  ui.showBanner(null);
  rugUniforms.uReveal.value = 0;
  resetCarsAndParticles();
}

/** Session options for a run of `kind` ("race" | "timetrial") from the current settings and stored records. */
function runOptions(kind, laps) {
  const trial = kind === "timetrial";
  return {
    kind,
    opponents: settings.opponents,
    difficulty: settings.difficulty,
    padDensity: settings.padDensity,
    best: loadRecord(kind, MAP.id, laps),
    ghost: trial ? loadGhost(MAP.id, laps) : null,
  };
}

/** Title -> intro: camera dives in, pop-up wave, then countdown. Original `$o`. kind: "race" | "timetrial". */
export function startRace(kind = app.raceKind ?? "race") {
  const laps = settings.laps;
  const session = newSession(false, laps, false, runOptions(kind, laps));
  app.raceKind = kind;
  ui.setRunKind(kind, session.race.cars.length);
  app.runOutcome = null;
  app.mode = "intro";
  app.t = 0;
  setCameraViewState(settings.camera);
  app.cockpit = false; // the cockpit view only starts once the race does (see updateMode)
  app.shownResults = false;
  resetCarsAndParticles();
  const player = session.race.player;
  rugUniforms.uRevealStart.value = player.s / TRACK.length;
  if (popup.mode === "full" || (popup.mode === "up" && globalTime - popup.t0 > popup.length)) {
    // world is already popped up (replay): skip the intro dive
    popup.setFull();
    cameraRig.snapChase(player);
    cameraRig.mode = "chase";
    app.t = 2.6;
  } else {
    popup.start("up", globalTime + 1.75, player.x, player.z, 120, 0.8, 0.7);
    sfx.popWave(1.75, 2.6);
    cameraRig.startDive(globalTime, 2.8, player);
  }
  ui.showTitle(false);
  ui.showResults(null);
  ui.showHUD(false);
  ui.showBanner(null);
  clearInputs();
  showTipsIfFirstRun(); // first race ever: the how-to card holds the clock until dismissed
}

export function enterGarage() {
  app.mode = "garage";
  ui.showTitle(false);
  ui.showGarage(true);
  cameraRig.mode = "garage";
  cameraRig.garageDir = 1;
  cameraRig.garageT = cameraRig.garageT || 0;
  cameraRig.garageA = cameraRig.garageA ?? 0.9;
  sfx.click();
  redrawGarage();
}

export function exitGarage() {
  app.mode = "title";
  ui.showTitle(true); // before closing: focus returns to the Skins button, which must be visible again
  ui.showGarage(false);
  cameraRig.garageDir = -1;
  sfx.click();
}

/** R key: put the car back on the route, skipping ahead if something blocks the spot. Original `wb`. */
export function respawnOnRoute(car) {
  const isClear = (p) =>
    physicsEnv.colliders.every((c) => {
      if (c.off || (c.h < 99 && !c.brick)) return true;
      if (c.type === "circle") return Math.hypot(p.x - c.x, p.z - c.z) > c.r + 4;
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const cos = Math.cos(c.a);
      const sin = Math.sin(c.a);
      return Math.abs(dx * cos + dz * sin) > c.hx + 4 || Math.abs(-dx * sin + dz * cos) > c.hz + 4;
    });
  let pose = route.at(car.prog);
  for (let i = 0; i < 12 && !isClear(pose); i++) {
    car.prog += 4;
    pose = route.at(car.prog);
  }
  Object.assign(car, {
    x: pose.x, z: pose.z, a: pose.heading, vx: 0, vz: 0, speed: 0, y: 0, vy: 0,
    onGround: true, spin: 0, offRouteT: 0,
  });
  car.idx = projectOnTrack(car.x, car.z).i;
}

/** Esc during a race: the hand grabs the player's car. Original `up`. */
export function startGrab() {
  const player = app.session.race.player;
  app.mode = "grab";
  app.t = 0;
  app.acc = 0;
  app.grabY = player.y;
  player.grabbed = true;
  player.vx = player.vz = 0;
  player.speed = 0;
  player.boosting = false;
  player.onGround = true;
  cameraRig.startGrab(player);
  app.cockpit = false;
  for (const part of carModels[0].cabin) part.visible = true;
  ui.showHUD(false);
  ui.showResults(null);
  ui.showHint(false);
  ui.showBanner(null);
  ui.showCountdown(null);
  sfx.grab();
}

/** After the grab: rug folds away. Original `Tb`. */
export function startOutro() {
  const player = app.session.race.player;
  app.mode = "outro";
  app.t = 0;
  app.cockpit = false;
  if (cameraRig.mode === "cockpit") cameraRig.mode = "chase";
  cameraRig.startRise(globalTime + 0.2, 3, player);
  popup.start("down", globalTime + 0.6, player.x, player.z, 120, 0.6);
  ui.showHUD(false);
  ui.showResults(null);
  ui.showHint(false);
  ui.showBanner(null);
}
