// Attract-mode demo: a scripted one-lap race with a camera dive, pop-up wave, countdown, finish and fold-away.
import { FIXED_STEP } from "../config/constants.js";
import { smoothstep } from "../util/math.js";
import { TRACK } from "../world/trackSamples.js";
import { sfx } from "../audio/sfx.js";
import { ui, cameraRig, popup, rugUniforms } from "./bootstrap.js";
import { app } from "./state.js";
import { Session } from "./session.js";
import { newSession, resetCarsAndParticles } from "./modes.js";

/** Demo timeline (seconds). Original `Hn`. */
export const DEMO_TIMES = { top: 2, diveDur: 2.9, waveStart: 3.85, revealA: 2.8, revealB: 4.9, count: 5.6, countDur: 2.4 };

/** Headless simulation of the demo to find when the player finishes (max 90 s, fallback 50). Original `ym`. */
export function simulateDemoFinish() {
  const session = new Session({ demo: true, laps: 1 });
  let time = 0;
  let finish = null;
  let counted = false;
  while (time < 90) {
    time += FIXED_STEP;
    if (!counted && time >= DEMO_TIMES.count) {
      session.race.startCountdown(DEMO_TIMES.countDur);
      counted = true;
    }
    session.step(FIXED_STEP, null);
    session.race.player.events.length = 0;
    if (session.race.player.finished) {
      finish = time;
      break;
    }
  }
  return { finish: finish ?? 50 };
}

/** Enter demo mode (?demo=1). Original `Sm`. */
export function startDemo() {
  ui.showTitle(false);
  ui.showResults(null);
  ui.showHint(false);
  app.mode = "demo";
  const finish = simulateDemoFinish().finish;
  app.demo = { F: finish, rise: finish + 1.8, riseDur: 3.2, fold: finish + 2.6, end: finish + 1.8 + 3.2 + 2.6, time: 0 };
  restartDemoLoop();
}

/** (Re)start the demo timeline with a fresh demo session. Original `ff`. */
export function restartDemoLoop() {
  const demo = app.demo;
  demo.time = 0;
  demo.counted = false;
  demo.dived = false;
  demo.waved = false;
  demo.rose = false;
  demo.folded = false;
  const player = newSession(true, 1).race.player;
  rugUniforms.uRevealStart.value = player.s / TRACK.length;
  popup.setFlat();
  cameraRig.mode = "top";
  app.cockpit = false;
  resetCarsAndParticles();
  ui.showHUD(false);
  ui.showCountdown(null);
  ui.showBanner(null);
}

/** Advance the demo timeline by one fixed step, triggering scripted events. Original `wm`. */
export function stepDemo(dt) {
  const demo = app.demo;
  const session = app.session;
  const player = session.race.player;
  demo.time += dt;
  const t = demo.time;
  if (!demo.dived && t >= DEMO_TIMES.top) {
    demo.dived = true;
    cameraRig.startDive(DEMO_TIMES.top, DEMO_TIMES.diveDur, player);
  }
  if (!demo.waved && t >= DEMO_TIMES.waveStart) {
    demo.waved = true;
    popup.start("up", DEMO_TIMES.waveStart, player.x, player.z, 120, 0.8, 1.6);
    sfx.popWave(0, 2.6);
  }
  if (!demo.counted && t >= DEMO_TIMES.count) {
    demo.counted = true;
    session.race.startCountdown(DEMO_TIMES.countDur);
  }
  if (!demo.rose && t >= demo.rise) {
    demo.rose = true;
    cameraRig.startRise(demo.rise, demo.riseDur, player);
  }
  if (!demo.folded && t >= demo.fold) {
    demo.folded = true;
    popup.start("down", demo.fold, player.x, player.z, 120, 0.6);
  }
  session.step(dt, null);
}

/** Fast-forward the demo to time `seconds` (?demo=1&t=...). Original `bm`. */
export function demoSeek(seconds) {
  restartDemoLoop();
  while (app.demo.time < seconds) stepDemo(FIXED_STEP);
  const session = app.session;
  if (cameraRig.mode === "chase") cameraRig.snapChase(session.race.player);
}

/** Per-frame demo presentation: camera mode, rug reveal amount, HUD, countdown, FINISH banner. Original `yb`. */
export function updateDemoPresentation() {
  const demo = app.demo;
  const t = demo.time;
  const session = app.session;
  const race = session.race;
  cameraRig.cockpitLift = 2.6;
  if (cameraRig.mode === "chase" || cameraRig.mode === "cockpit") {
    const wantCockpit = session.film.cockpit;
    if (wantCockpit !== (cameraRig.mode === "cockpit") && !wantCockpit) cameraRig.snapChase(race.player);
    cameraRig.mode = wantCockpit ? "cockpit" : "chase";
    app.cockpit = wantCockpit;
  }
  let reveal = smoothstep(DEMO_TIMES.revealA, DEMO_TIMES.revealB, t);
  if (t > demo.fold) reveal = 1 - smoothstep(demo.fold, demo.fold + 1.6, t);
  rugUniforms.uReveal.value = reveal * 1.02;
  ui.showHUD(t > DEMO_TIMES.count - 0.3 && t < demo.rise + 0.2);
  if (race.state === "countdown") {
    const secondLength = race.countdownTotal / 3;
    ui.showCountdown(String(Math.ceil(race.countdown / secondLength)));
  } else if (race.state === "racing" && race.time < 0.7) ui.showCountdown("GO!");
  else ui.showCountdown(null);
  ui.showBanner(t > demo.F - 0.05 && t < demo.rise + 1 ? "FINISH!" : null);
}
