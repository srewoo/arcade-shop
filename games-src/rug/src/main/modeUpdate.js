// Per-frame logic for every mode that steps the race (intro, race, results, grab, outro, title).
import { FIXED_STEP } from "../config/constants.js";
import { mapChoice, reloadForMap } from "../config/maps.js";
import { smoothstep } from "../util/math.js";
import { TRACK } from "../world/trackSamples.js";
import { AI_FINISHED_PROFILE } from "../config/ai.js";
import { HELI_TOTAL_TIME } from "../effects/helicopter.js";
import { HUD_TUNING } from "../config/hud.js";
import { ui, cameraRig, popup, rugUniforms, grabHand } from "./bootstrap.js";
import { app, globalTime } from "./state.js";
import { readDriveInput, keysPressed } from "./input.js";
import { reloadWithBootScreen } from "./maps.js";
import { cycleCameraView, applyCameraView } from "./cameraViews.js";
import { finalizeRun, boardEligible, submitResultsScore } from "./runResults.js";
import { goTitle, startOutro, respawnOnRoute } from "./modes.js";

/** The intro dive ends at about 2.6 s; a key press or tap before then jumps straight to the grid view. */
const INTRO_SKIP_BEFORE = 2.6;
const NON_SKIP_KEYS = new Set(["KeyP", "Escape", "KeyM", "KeyH", "KeyV", "KeyF"]);

function introSkipRequested() {
  for (const code of keysPressed) if (!NON_SKIP_KEYS.has(code)) return true;
  return false;
}

/** Skip the dive and pop-up wave: world fully up, chase camera on the player, countdown timeline continues. */
function skipIntro(player) {
  popup.setFull();
  cameraRig.snapChase(player);
  cameraRig.mode = "chase";
  app.t = INTRO_SKIP_BEFORE;
}

/** Per-frame logic for every mode that steps the race. Original `Sb`. */
export function updateMode(dt) {
  cameraRig.cockpitLift = 0;
  const session = app.session;
  const race = session.race;
  app.t += dt;
  if (app.mode === "title") {
    for (app.acc += dt; app.acc >= FIXED_STEP; ) {
      session.step(FIXED_STEP, null);
      app.acc -= FIXED_STEP;
    }
  }
  if (app.mode === "intro") {
    if (app.t < INTRO_SKIP_BEFORE && introSkipRequested()) skipIntro(race.player);
    if (app.t >= 3 && race.state === "grid") race.startCountdown(3);
    if (popup.mode === "up" && globalTime - popup.t0 > popup.length) popup.setFull();
    rugUniforms.uReveal.value = smoothstep(0.6, 2.6, app.t) * 1.02;
    if (race.state === "racing") {
      app.mode = "race";
      applyCameraView(app.camView, race.player);
      ui.showHint(true);
      app.hintT = HUD_TUNING.hintSeconds;
    }
  }
  if (app.mode === "race" || app.mode === "intro" || app.mode === "results") updateRaceLike(dt, session, race);
  if (app.mode === "grab") {
    const player = race.player;
    for (app.acc += dt; app.acc >= FIXED_STEP; ) {
      session.step(FIXED_STEP, null);
      app.acc -= FIXED_STEP;
    }
    player.y = app.grabY + grabHand.update(app.t, player, app.grabY);
    if (app.t >= HELI_TOTAL_TIME) {
      app.carTaken = true;
      grabHand.root.visible = false;
      startOutro();
    }
  }
  if (app.mode === "outro") {
    for (app.acc += dt; app.acc >= FIXED_STEP; ) {
      session.step(FIXED_STEP, { throttle: 0, brake: 1, steer: 0, boost: false, jump: false });
      app.acc -= FIXED_STEP;
    }
    rugUniforms.uReveal.value = 1.02 * (1 - smoothstep(0.4, 1.8, app.t));
    if (app.t > 3.6) {
      if (mapChoice === "random") reloadWithBootScreen(() => reloadForMap(false));
      else goTitle();
    }
  }
}

/** intro / race / results share input handling, HUD state, wrong-way detection and finish handling. */
function updateRaceLike(dt, session, race) {
  if (app.mode !== "results" && keysPressed.has("KeyC")) cycleCameraView(race.player);
  if (keysPressed.has("KeyR") && app.mode === "race") respawnOnRoute(race.player);
  app.acc += dt;
  const input = readDriveInput();
  while (app.acc >= FIXED_STEP) {
    session.step(FIXED_STEP, input);
    app.acc -= FIXED_STEP;
  }
  ui.showHUD(app.mode !== "results" && (race.state !== "grid" || app.t > 2.4)); // results card replaces the HUD
  if (race.state === "countdown") ui.showCountdown(String(Math.ceil(race.countdown)));
  else if (race.state === "racing" && race.time < 0.7) ui.showCountdown("GO!");
  else ui.showCountdown(null);
  if (app.hintT !== undefined) {
    app.hintT -= dt;
    if (app.hintT < 0) ui.showHint(false);
  }
  // wrong-way detection: heading against the track tangent while moving
  const player = race.player;
  const alongTrack = Math.cos(player.a) * TRACK.tx[player.idx] + Math.sin(player.a) * TRACK.ty[player.idx];
  app.wrongT = alongTrack < -0.3 && player.speed > 3 && race.state === "racing" ? app.wrongT + dt : 0;
  if (app.mode === "race" && race.state === "finished") {
    app.mode = "results";
    app.t = 0;
    player.ai = AI_FINISHED_PROFILE; // autopilot takes over after the finish
    app.runOutcome = finalizeRun(session);
    ui.showBanner("FINISH!");
    ui.showHint(false);
    if (app.cockpit) {
      app.cockpit = false;
      cameraRig.mode = "chase";
      cameraRig.snapChase(player);
    }
  }
  if (app.mode === "results" && app.t > 2 && !app.shownResults) {
    app.shownResults = true;
    ui.showResults(race, app.runOutcome);
    if (boardEligible(session)) submitResultsScore(race.player);
  }
  if (app.mode === "results" && app.shownResults && app.t % 1 < dt) ui.showResults(race, app.runOutcome);
}
