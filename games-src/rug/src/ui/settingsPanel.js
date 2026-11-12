// Settings panel methods mixed into UI.prototype: radio-style button groups plus a volume slider.
import { DIFFICULTY } from "../logic/difficulty.js";
import { PAD_COUNTS } from "../logic/settings.js";
import { THEMES, PATTERNS, FLOORS } from "../logic/appearance.js";
import { STR } from "./strings.js";
import { trapTab } from "./focusTrap.js";

const choices = (pairs) => pairs.map(([value, label]) => ({ value, label }));

/** Panel layout: one row per setting. `range` rows are sliders, the rest are single-choice groups. */
export const SETTING_ROWS = [
  { key: "volume", label: STR.settings.master, range: true },
  { key: "sfxVolume", label: STR.settings.sfxVolume, range: true },
  { key: "engineVolume", label: STR.settings.engineVolume, range: true },
  { key: "reduceMotion", label: STR.settings.reduceMotion, choices: choices([["system", STR.settings.systemOpt], ["on", STR.settings.on], ["off", STR.settings.off]]) },
  { key: "colourBlind", label: STR.settings.colourBlind, choices: choices([[false, STR.settings.off], [true, STR.settings.on]]) },
  { key: "hudScale", label: STR.settings.hudScale, choices: choices([[100, "100%"], [125, "125%"], [150, "150%"]]) },
  { key: "boostMode", label: STR.settings.boostMode, choices: choices([["hold", STR.settings.hold], ["toggle", STR.settings.toggle]]) },
  { key: "difficulty", label: "AI difficulty", choices: choices(Object.entries(DIFFICULTY).map(([id, d]) => [id, d.label])) },
  { key: "opponents", label: "Opponents", choices: choices([0, 1, 2, 3, 4, 5].map((n) => [n, String(n)])) },
  { key: "laps", label: "Laps", choices: choices([1, 3, 5].map((n) => [n, String(n)])) },
  {
    key: "padDensity",
    label: "Boost pads",
    choices: choices([["normal", `Normal (${PAD_COUNTS.normal})`], ["more", `More (${PAD_COUNTS.more})`]]),
  },
  {
    key: "camera",
    label: "Camera",
    choices: choices([["chase", "Chase"], ["far", "Far chase"], ["topdown", "Top-down"], ["cockpit", "Cockpit"]]),
  },
  { key: "quality", label: "Quality", choices: choices([["auto", "Auto"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]]) },
  { key: "theme", label: STR.maps.theme, choices: choices(THEMES.map((t) => [t.id, t.label])) },
  { key: "pattern", label: STR.maps.pattern, choices: choices(PATTERNS.map((p) => [p.id, p.label])) },
  { key: "floor", label: STR.maps.floor, choices: choices(FLOORS.map((f) => [f.id, f.label])) },
];

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function rowHtml(row, settings) {
  const id = `set-${row.key}`;
  if (row.range) {
    const pct = Math.round(settings[row.key] * 100);
    return `<div class="set-row"><label class="set-lbl" for="${id}">${row.label}</label>
      <div class="set-opts"><input id="${id}" class="set-range" type="range" min="0" max="100" step="5" value="${pct}" data-k="${row.key}" aria-label="${row.label}"><output class="set-out" for="${id}">${pct}%</output></div></div>`;
  }
  const buttons = row.choices
    .map((c) => {
      const on = c.value === settings[row.key];
      return `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" class="${on ? "on" : ""}" data-k="${row.key}" data-v="${esc(c.value)}">${esc(c.label)}</button>`;
    })
    .join("");
  return `<div class="set-row"><span class="set-lbl" id="${id}-lbl">${row.label}</span>
    <div class="set-opts" role="radiogroup" aria-labelledby="${id}-lbl">${buttons}</div></div>`;
}

const STYLE_KEYS = ["theme", "pattern", "floor"];

/** Render rows into `list`, wiring clicks, Left/Right roving focus and the slider; keeps keyboard focus across redraws. */
function renderRows(list, rows, settings, onChange) {
  const focused = list.querySelector("button:focus");
  const focusKey = focused ? `${focused.dataset.k}|${focused.dataset.v}` : null;
  list.innerHTML = rows.map((row) => rowHtml(row, settings)).join("");
  const parse = (key, text) => (typeof settings[key] === "number" ? Number(text) : typeof settings[key] === "boolean" ? text === "true" : text);
  for (const group of list.querySelectorAll('[role="radiogroup"]')) {
    const buttons = [...group.querySelectorAll("button")];
    group.addEventListener("keydown", (event) => {
      const step = event.code === "ArrowRight" || event.code === "ArrowDown" ? 1 : event.code === "ArrowLeft" || event.code === "ArrowUp" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const i = buttons.indexOf(document.activeElement);
      buttons[(i + step + buttons.length) % buttons.length].click();
    });
    for (const button of buttons) button.addEventListener("click", () => onChange(button.dataset.k, parse(button.dataset.k, button.dataset.v), false));
  }
  for (const range of list.querySelectorAll(".set-range")) {
    range.addEventListener("input", () => {
      range.parentElement.querySelector(".set-out").textContent = `${range.value}%`;
      onChange(range.dataset.k, Number(range.value) / 100, true);
    });
  }
  if (focusKey) [...list.querySelectorAll("button")].find((b) => `${b.dataset.k}|${b.dataset.v}` === focusKey)?.focus();
}

export const settingsPanelMethods = {
  /** Show/hide the dialog; focus goes to the first control and the Tab key stays inside. */
  showSettings(show) {
    const panel = this.root.querySelector(".settings");
    if (!panel.dataset.trap) {
      panel.dataset.trap = "1";
      panel.addEventListener("keydown", (e) => trapTab(panel, e));
    }
    panel.classList.toggle("show", show);
    if (show) panel.querySelector(".set-opts button.on, .set-range")?.focus();
    else if (panel.contains(document.activeElement)) document.activeElement.blur();
  },

  /**
   * Render the panel for `settings`. onChange(key, value, live): live=true for slider drags (do not redraw).
   * Keyboard: Left/Right move within a group, Tab between groups.
   */
  drawSettings(settings, onChange) {
    renderRows(this.root.querySelector(".settings .set-list"), SETTING_ROWS, settings, onChange);
  },

  /** Theme / pattern / floor as three compact dropdowns in one row inside the map picker. */
  drawMapStyle(settings, onChange) {
    const host = this.root.querySelector(".maps-style");
    const rows = SETTING_ROWS.filter((r) => STYLE_KEYS.includes(r.key));
    host.innerHTML = rows
      .map((row) => {
        const options = row.choices
          .map((c) => `<option value="${esc(c.value)}"${c.value === settings[row.key] ? " selected" : ""}>${esc(c.label)}</option>`)
          .join("");
        return `<label class="ms-field"><span class="ms-lbl">${row.label}</span><select class="ms-select" data-k="${row.key}">${options}</select></label>`;
      })
      .join("");
    for (const select of host.querySelectorAll("select")) {
      select.addEventListener("change", () => onChange(select.dataset.k, select.value, false));
    }
  },
};
