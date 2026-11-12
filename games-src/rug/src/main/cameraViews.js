// Camera views cycled with C: chase (original) -> far chase -> top-down -> cockpit -> chase ...
import { cameraRig, ui } from "./bootstrap.js";
import { app } from "./state.js";

export const CAMERA_VIEWS = ["chase", "far", "topdown", "cockpit"];
export const CAMERA_LABELS = { chase: "Chase", far: "Far chase", topdown: "Top-down", cockpit: "Cockpit" };

/** Select the chase framing without touching the rig mode (used while the intro dive is running). */
export function setCameraViewState(view) {
  const v = CAMERA_VIEWS.includes(view) ? view : "chase";
  app.camView = v;
  app.cockpit = v === "cockpit";
  cameraRig.view = v === "cockpit" ? "chase" : v;
}

/** Select a view and, if the rig is already following the car, switch to it now. */
export function applyCameraView(view, player) {
  setCameraViewState(view);
  if (cameraRig.mode !== "chase" && cameraRig.mode !== "cockpit") return;
  cameraRig.mode = app.cockpit ? "cockpit" : "chase";
  if (!app.cockpit) cameraRig.snapChase(player);
}

/** C key: next view, with a short on-screen label. */
export function cycleCameraView(player) {
  const next = CAMERA_VIEWS[(CAMERA_VIEWS.indexOf(app.camView ?? "chase") + 1) % CAMERA_VIEWS.length];
  applyCameraView(next, player);
  ui.flashMessage(`Camera: ${CAMERA_LABELS[next]}`);
}
