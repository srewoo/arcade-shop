// Garage (car skin picker) and maps list methods mixed into UI.prototype.
import { medalStars } from "../logic/medals.js";
import { setDialogOpen } from "./focusTrap.js";

/** Stat bars (top speed / accel / grip / boost) for the selected car; a hint when the choice is "Random". */
function drawStatBars(el, stats) {
  if (!stats) {
    el.innerHTML = '<div class="stat-note">Random car every race. Pick a model to compare stats.</div>';
    return;
  }
  const sign = (n) => (n > 0 ? `+${n}%` : n < 0 ? `${n}%` : "base");
  el.innerHTML =
    stats.bars
      .map(
        (b) =>
          `<div class="stat-bar" role="meter" aria-label="${b.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.percent}"><span class="sb-name">${b.label}</span><i><b style="width:${b.percent}%"></b></i><em class="${b.delta < 0 ? "dn" : b.delta > 0 ? "up" : ""}">${sign(b.delta)}</em></div>`,
      )
      .join("") + `<div class="stat-note">${stats.blurb}</div>`;
}
export const garagePanelMethods = {
  showGarage(show) {
    setDialogOpen(this, "garageOpener", this.root.querySelector(".garage"), show, () => this.root.querySelector(".key-btn.car"));
  },

  /**
   * @param skin    current choice {random, kind, model, color}
   * @param colors  palette (entries have .main)
   * @param models  {classic:[names], lego:[names]}
   * @param onPick  (field: "kind"|"model"|"color", value) => void
   * @param stats   {bars:[{label,percent,delta,value}], blurb} for the chosen car, or null when "Random"
   */
  drawGarage(skin, colors, models, onPick, stats = null) {
    const q = (sel) => this.root.querySelector(sel);
    const fill = (row, items, field, selected) => {
      row.innerHTML = items
        .map(
          ([value, label, style]) =>
            `<button class="${value === selected ? "on" : ""} ${value === "random" ? "rnd" : ""}" data-v="${value}" ${style ? `style="${style}"` : ""}>${label}</button>`,
        )
        .join("");
      for (const button of row.children)
        button.onclick = () => onPick(field, field === "kind" ? button.dataset.v : +button.dataset.v);
    };
    fill(
      q(".gar-kinds"),
      [
        ["random", "Random"],
        ["classic", "Classic"],
        ["lego", "LEGO"],
      ],
      "kind",
      skin.random ? "random" : skin.kind,
    );
    fill(
      q(".gar-models"),
      models[skin.kind].map((name, i) => [i, name]),
      "model",
      skin.random ? -1 : skin.model,
    );
    fill(
      q(".gar-colors"),
      colors.map((c, i) => [i, "", `background:${c.main}`]),
      "color",
      skin.random ? -1 : skin.color,
    );
    for (const button of q(".gar-colors").children) button.setAttribute("aria-label", `${colors[button.dataset.v].name} paint`);
    drawStatBars(q(".gar-stats"), stats);
  },

  showMaps(show) {
    setDialogOpen(this, "mapsOpener", this.root.querySelector(".maps"), show, () => this.root.querySelector(".maps-btn"));
  },

  /** @param maps [{id,name}] (first is "random"), selected index, onPick(index) */
  drawMaps(maps, selected, onPick, medals = {}) {
    const list = this.root.querySelector(".maps-list");
    const mark = (m) => {
      const stars = medalStars(medals[m.id]);
      return stars ? `<span class="chip-medal ${medals[m.id]}" aria-hidden="true">${"\u2605".repeat(stars)}</span>` : "";
    };
    list.innerHTML = maps
      .map((m, i) => {
        const medal = medals[m.id];
        const label = medal ? ` aria-label="${m.name}, ${medal} medal"` : "";
        return `<button class="${i === selected ? "on" : ""} ${m.id === "random" ? "rnd" : ""}" data-i="${i}"${label}>${m.name}${mark(m)}</button>`;
      })
      .join("");
    for (const button of list.children) button.onclick = () => onPick(+button.dataset.i);
  },
};
