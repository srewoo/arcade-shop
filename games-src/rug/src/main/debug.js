// window.__rug: debugging / test hooks (inspect state from the console or drive demos).
// `pause` (bool) and `timeScale` (number) are read by the frame loop.
import { FIXED_STEP } from "../config/constants.js";
import { MAP, mapChoice } from "../config/maps.js";
import { RUG, route, LAYOUT } from "../world/layoutSelect.js";
import { boostPads } from "../race/boostPads.js";
import {
  world, renderer, trailField, legoCars, cameraRig, popup, obstacles,
} from "./bootstrap.js";
import { app } from "./state.js";
import { skinChoice, carModels } from "./garage.js";
import { Session, physicsEnv } from "./session.js";
import { demoSeek, startDemo, simulateDemoFinish } from "./demo.js";
import { startRace, goTitle } from "./modes.js";
import { settings, updateSetting } from "./settingsMenu.js";
import { loadRecord, loadGhost } from "./records.js";

export function installDebugHooks() {
  window.__rug = {
    boostPads,
    trails: trailField,
    world,
    route,
    RUG,
    LAYOUT,
    Session,
    env: physicsEnv,
    STEP: FIXED_STEP,
    MAP,
    CHOICE: mapChoice,
    skin: () => skinChoice,
    legoCars,
    carModels,
    app,
    rig: cameraRig,
    popup,
    obstacles,
    demoSeek,
    startDemo,
    startRace,
    goTitle,
    /** Start a time trial (same as the T key on the title screen). */
    startTimeTrial: () => startRace("timetrial"),
    settings,
    setSetting: updateSetting,
    records: { loadRecord, loadGhost },
    sim() {
      return simulateDemoFinish();
    },
    get race() {
      return app.session.race;
    },
    info() {
      return {
        programs: renderer.info.programs.length,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      };
    },
    pause: false,
    closeup() {
      cameraRig.mode = "closeup";
    },
    autopilot() {
      app.session.race.player.ai = { top: 37, aLat: 92 };
    },
  };
}
