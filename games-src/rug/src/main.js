// Rug Racers entry point. Importing ./main/bootstrap.js runs the (top-level-await) world build while the
// worker-driven loading bar animates; the remaining modules then wire up input, layout and modes.
import "./base.css";
import "./hud.css";
import "./hud-overlay.css";
import "./nitro.css";
import "./hud-extra.css";
import "./results.css";
import "./panels.css";
import "./title.css";
import "./title-extra.css";
import "./title-look.css";
import "./touch.css";
import "./touch-layout.css";
import "./settings.css";
import "./overlays.css";
import "./a11y.css";
import "./polish-ui.css";
import { bootStep, finishBoot } from "./boot/bootProgress.js";
import { MAPS } from "./config/maps.js";
import { consumeAutostart } from "./config/maps.js";
import { query } from "./main/query.js";
import { fpsEl, mapPreviewRoute } from "./main/bootstrap.js";
import "./main/layout.js";
import "./main/input.js";
import { goTitle, startRace } from "./main/modes.js";
import { redrawGarage } from "./main/garage.js";
import { startDemo, demoSeek } from "./main/demo.js";
import { warmUpGpu } from "./main/warmup.js";
import { loadMapPreviewTexture } from "./main/maps.js";
import { installDebugHooks } from "./main/debug.js";
import { applyLiveSettings, settings } from "./main/settingsMenu.js";
import { regradeProps } from "./main/appearance.js";
import { consumeKind } from "./main/records.js";
import { frame } from "./main/loop.js";
import { initOverlays } from "./main/overlays.js";
import { clearInputs, isTouch } from "./main/input.js";
import { startGrab } from "./main/modes.js";
import { openSettings } from "./main/settingsMenu.js";

await bootStep(0.78, "hud and effects");
initOverlays({
  clearInputs,
  restart: () => startRace(),
  quit: startGrab,
  openSettings,
  isTouch,
  laps: () => settings.laps,
});
applyLiveSettings();
regradeProps(settings.theme, settings.pattern); // the print was painted with the saved style in createWorld
goTitle();
await warmUpGpu();
await bootStep(0.99, "second render");
redrawGarage();
if (query.get("fps") === "1") fpsEl.classList.add("show");
if (query.get("demo") === "1") {
  startDemo();
  const seekTo = parseFloat(query.get("t"));
  if (!Number.isNaN(seekTo)) demoSeek(seekTo);
}
const stashedKind = consumeKind();
if (query.get("race") === "1" || consumeAutostart()) startRace(query.get("trial") === "1" ? "timetrial" : stashedKind);
finishBoot();
// Preload every map preview texture and the route-overlay data shortly after start.
setTimeout(() => {
  MAPS.forEach(loadMapPreviewTexture);
  mapPreviewRoute.load();
}, 1500);
// test/debug hooks (autopilot, time scale, sim) are not part of the production build: ?debug=1 or dev server only
if (import.meta.env.DEV || query.has("debug")) installDebugHooks();
requestAnimationFrame(frame);
