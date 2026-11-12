// DOM overlay: HUD, title screen, garage, maps, results, countdown/banner, leaderboard tables.
import { buildUiHtml } from "./template.js";
import { formatTime, ordinalSuffix } from "./format.js";
import { renderMinimapBackground, drawMinimap } from "./minimap.js";
import { boardsPanelMethods } from "./boardsPanel.js";
import { garagePanelMethods } from "./garagePanel.js";
import { settingsPanelMethods } from "./settingsPanel.js";
import { STR } from "./strings.js";
import { pausePanelMethods } from "./pausePanel.js";
import { raceHudMethods, standingsHtml, lapRowsHtml, resultsExtraHtml } from "./raceHud.js";

export class UI {
  /** @param stage the #stage element; @param lookup world lookup image (Be.lookup) used for the minimap */
  constructor(stage, lookup) {
    this.stage = stage;
    this.lookup = lookup;
    const root = document.createElement("div");
    root.className = "ui";
    root.innerHTML = buildUiHtml();
    stage.appendChild(root);
    this.root = root;
    const q = (sel) => root.querySelector(sel);
    this.hud = q(".hud");
    this.posNum = q(".pos-num");
    this.posSuf = q(".pos-suf");
    this.posOf = q(".pos-of");
    this.resExtra = q(".res-extra");
    this.carCount = 4;
    this.lapNum = q(".lap-num");
    this.lapOf = q(".lap-of");
    this.time = q(".time");
    this.boostFill = q(".boost-fill");
    this.boostEl = q(".boost");
    this.map = q(".minimap canvas");
    this.mapCtx = this.map.getContext("2d");
    this.countdown = q(".countdown");
    this.countSpan = q(".countdown span");
    this.banner = q(".banner");
    this.bannerSpan = q(".banner span");
    this.title = q(".title-screen");
    this.results = q(".results");
    this.resPlace = q(".res-place");
    this.resTable = q(".res-table");
    this.hint = q(".hint");
    this.wrong = q(".wrongway");
    this.hidden = false;
    this.lastPos = 0;
    this.mapBg = renderMinimapBackground(lookup);
  }

  setSoundLabel(muted) {
    this.root.querySelector(".sound-btn").classList.toggle("muted", muted);
  }

  setVisible(visible) {
    this.root.style.display = visible ? "" : "none";
  }

  showHUD(show) {
    this.hud.classList.toggle("show", show);
  }

  showTitle(show) {
    this.title.classList.toggle("show", show);
  }

  showHint(show) {
    this.hint.classList.toggle("show", show);
  }

  /** Shows 3/2/1/"GO!" (falsy hides). Fires this.onCount(value) on change. */
  showCountdown(value) {
    if (value === this.lastCount) return;
    this.lastCount = value;
    if (value) this.onCount?.(value);
    if (!value) {
      this.countdown.classList.remove("show");
      return;
    }
    this.countSpan.textContent = value;
    this.countdown.classList.remove("show", "go");
    this.countdown.offsetWidth; // force reflow to restart the CSS animation
    this.countdown.classList.add("show");
    if (value === "GO!") this.countdown.classList.add("go");
  }

  /** Big centred banner text (e.g. lap messages); fires this.onBanner(text) on change. */
  showBanner(text) {
    if (text === this.lastBanner) return;
    this.lastBanner = text;
    if (text) this.onBanner?.(text);
    if (!text) {
      this.banner.classList.remove("show");
      return;
    }
    this.bannerSpan.textContent = text;
    this.banner.classList.remove("show");
    this.banner.offsetWidth; // restart animation
    this.banner.classList.add("show");
  }

  /** Finish screen: place line + standings (estimated times prefixed with "~"). Falsy hides it. `outcome`: local-record summary. */
  showResults(race, outcome = null) {
    if (!race) {
      this.results.classList.remove("show", "asking", "board", "offline");
      return;
    }
    const player = race.player;
    const trial = outcome?.kind === "timetrial";
    this.resPlace.innerHTML = trial
      ? `Time trial &middot; ${formatTime(player.finishTime)}`
      : `You finished <b>${player.place}${ordinalSuffix(player.place)}</b> &middot; ${formatTime(player.finishTime)}`;
    this.resExtra.innerHTML = resultsExtraHtml(outcome);
    this.resTable.innerHTML = trial && outcome.lapSeconds.length ? lapRowsHtml(outcome) : standingsHtml(race);
    this.results.classList.add("show");
  }

  /** Per-frame HUD refresh. state: {wrongWay}. Emits audio events through this.onEvent(name, payload). */
  update(race, state = {}) {
    const player = race.player;
    const position = player.position || this.carCount;
    if (position !== this.lastPos) {
      if (this.lastPos && position < this.lastPos && race.state === "racing") this.onEvent?.("overtake");
      this.posNum.textContent = position;
      this.posSuf.textContent = ordinalSuffix(position);
      this.posNum.parentElement.classList.remove("bump");
      this.posNum.offsetWidth; // restart "bump" animation
      this.posNum.parentElement.classList.add("bump");
      this.lastPos = position;
    }
    this.lapNum.textContent = Math.max(1, Math.min(race.laps, player.lap));
    this.lapOf.textContent = "/" + race.laps;
    this.time.textContent = formatTime(
      race.state === "racing" || race.state === "finished" ? (player.finished ? player.finishTime : race.time) : 0,
    );
    this.boostFill.style.transform = `scaleX(${player.boost.toFixed(3)})`;
    const pct = Math.round(player.boost * 100);
    setBoostReadout(this.boostEl, pct);
    this.boostEl.classList.toggle("active", player.boosting);
    const full = player.boost > 0.995;
    if (full && !this.wasFull && this.wasFull !== undefined && race.state === "racing") this.onEvent?.("nitroReady");
    this.wasFull = full;
    this.boostEl.classList.toggle("full", full);
    this.updateTouchBoost(pct, player.boosting);
    const wrong = !!state.wrongWay;
    if (wrong && !this.wasWrong) this.onEvent?.("wrongWay");
    this.wasWrong = wrong;
    this.wrong.classList.toggle("show", wrong);
    if (state.session) this.updateRaceHud(race, state.session);
    this.drawMap(race);
  }

  /** BOOST button on touch: charge ring (CSS var) and a dimmed look when empty. */
  updateTouchBoost(pct, active) {
    const button = (this.touchBoost ??= this.hud.querySelector(".t-boost") ?? false);
    if (!button) return;
    if (this.lastTouchPct !== pct) {
      this.lastTouchPct = pct;
      button.style.setProperty("--nitro", (pct / 100).toFixed(2));
      button.classList.toggle("empty", pct < 3);
      const label = button.querySelector(".t-pct");
      if (label) label.textContent = `${pct}%`;
      button.setAttribute("aria-label", STR.hud.boostAria(pct));
    }
    button.classList.toggle("active", active);
  }

  drawMap(race) {
    drawMinimap(this.mapCtx, this.mapBg, race, { labels: !!this.colourBlind });
  }
}

/** Percent text + aria value + low-tank warning on the nitro meter. */
function setBoostReadout(el, pct) {
  const label = el.querySelector(".boost-pct");
  const text = `${pct}%`;
  if (label.textContent !== text) {
    label.textContent = text;
    el.setAttribute("aria-valuenow", String(pct));
    el.classList.toggle("low", pct < 25);
  }
}

Object.assign(UI.prototype, boardsPanelMethods, garagePanelMethods, settingsPanelMethods, raceHudMethods, pausePanelMethods);
