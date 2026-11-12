// Garage / car customisation state and applying skins to the race cars.
import { CAR_COLORS, MODEL_NAMES } from "../config/carColors.js";
import { sfx } from "../audio/sfx.js";
import { mulberry32 } from "../util/math.js";
import { classicCars, legoCars, ui } from "./bootstrap.js";
import { app } from "./state.js";
import { tuneFor, NEUTRAL_TUNE, statBars, blurbFor } from "../logic/tuning.js";

export const SKIN_STORAGE_KEY = "rug-racers-skin-choice";

/** Model currently used for each race car slot (index 0 = player). Original: `Vl`. */
export const carModels = [...classicCars];

/**
 * Player's garage choice, persisted in localStorage.
 * random: pick everything randomly every race; kind: "lego" | "classic"; model: 0-3; color: index into CAR_COLORS.
 * Original: `gn`.
 */
export const skinChoice = { random: true, kind: "lego", model: 0, color: 0 };
try {
  const saved = JSON.parse(localStorage.getItem(SKIN_STORAGE_KEY) || "{}");
  if (saved.random === false) skinChoice.random = false;
  if (saved.kind === "classic" || saved.kind === "lego") skinChoice.kind = saved.kind;
  if (saved.model >= 0 && saved.model < 4) skinChoice.model = saved.model;
  if (saved.color >= 0 && saved.color < CAR_COLORS.length) skinChoice.color = saved.color;
} catch {}

/** Redraw the garage panel if it is open. */
export function redrawGarage() {
  if (app.mode !== "garage") return;
  const stats = skinChoice.random
    ? null
    : { bars: statBars(tuneFor(skinChoice.kind, skinChoice.model)), blurb: blurbFor(skinChoice.kind, skinChoice.model) };
  ui.drawGarage(skinChoice, CAR_COLORS, MODEL_NAMES, setSkinOption, stats);
}

/** Apply one garage option ("kind" | "model" | "color"), persist, and re-skin the cars. */
export function setSkinOption(key, value) {
  if (key === "kind" && value === "random") {
    skinChoice.random = true;
  } else {
    skinChoice.random = false;
    skinChoice[key] = value;
  }
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(skinChoice));
  } catch {}
  sfx.click();
  applySkins(app.session);
  redrawGarage();
}

/**
 * Assign a car model + colour to each race car of the session.
 * Uses the session's seeded RNG so opponents get distinct colours/models (Fisher-Yates shuffles).
 */
export function applySkins(session) {
  for (const car of [...classicCars, ...legoCars]) car.root.visible = false;
  const rnd = session.rnd;
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const player = skinChoice.random
    ? {
        kind: rnd() < 0.5 ? "lego" : "classic",
        model: Math.floor(rnd() * 4),
        color: Math.floor(rnd() * CAR_COLORS.length),
      }
    : skinChoice;
  const otherColors = shuffle(CAR_COLORS.map((_, index) => index).filter((index) => index !== player.color));
  const otherModels = shuffle([0, 1, 2, 3].filter((index) => index !== player.model));
  // opponents 4 and 5 (extra field) take the (kind, model) pairs nobody else uses; they have their own
  // RNG so the original draw order above (cars 0-3) is unchanged
  const used = new Set();
  const extraRnd = mulberry32(4141);
  session.race.cars.forEach((raceCar, index) => {
    let kind = index === 0 ? player.kind : rnd() < 0.5 ? "lego" : "classic";
    let modelIndex = index === 0 ? player.model : otherModels[index - 1];
    if (index >= 4) {
      const free = ["classic", "lego"].flatMap((k) => [0, 1, 2, 3].map((m) => [k, m])).filter(([k, m]) => !used.has(k + m));
      [kind, modelIndex] = free[Math.floor(extraRnd() * free.length)];
    }
    used.add(kind + modelIndex);
    const color = CAR_COLORS[index === 0 ? player.color : otherColors[index - 1]];
    const model = (kind === "lego" ? legoCars : classicCars)[modelIndex];
    if (model.lego) model.reset();
    model.setColors(color);
    carModels[index] = model;
    raceCar.tune = index === 0 ? tuneFor(kind, modelIndex) : NEUTRAL_TUNE;
    raceCar.skin = { color: color.main, name: `${color.name} ${MODEL_NAMES[kind][modelIndex]}` };
  });
}
