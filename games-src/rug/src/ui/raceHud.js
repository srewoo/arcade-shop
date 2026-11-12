// Race HUD extras mixed into UI.prototype: position count, gaps to neighbours, split/delta/best-lap stats,
// drift popups, short messages, title labels and the results details for local records.
import { neighbours, gapSeconds, formatGap } from "../logic/gaps.js";
import { formatDelta } from "../logic/splits.js";
import { TIERS } from "../logic/drift.js";
import { CLASSIC_CAR_SPECS } from "../vehicles/classicCars.js";
import { formatTime } from "./format.js";
import { STR } from "./strings.js";
import { fillGapRow } from "./gapRow.js";
import { medalStars } from "../logic/medals.js";
import { statRowsVisible, applyStatRows } from "./statRows.js";

const setText = (el, text) => {
  if (el.textContent !== text) el.textContent = text;
};

/** Restart a one-shot CSS animation on `el` with new text and a modifier class. */
function flash(el, text, cls = "") {
  el.textContent = text;
  el.className = el.className.split(" ")[0];
  el.offsetWidth; // reflow so the animation restarts
  el.classList.add("show");
  if (cls) el.classList.add(cls);
}

const lookOf = (car) => ({ ...CLASSIC_CAR_SPECS[car.type], ...car.skin });

export const raceHudMethods = {
  /** Called when a run starts: toggles time-trial layout and sets the "/N" car count. */
  setRunKind(kind, carCount) {
    this.hud.classList.toggle("tt", kind === "timetrial");
    this.carCount = carCount;
    this.lapTotal = null;
    this.posOf.textContent = `/${carCount}`;
    this.lastPos = 0;
    this.driftScore = 0;
    this.hud.querySelector(".split-pop").className = "split-pop";
    this.hud.querySelector(".dp-event").className = "dp-event";
  },

  /** Short centred note (e.g. camera name) in the split slot. */
  flashMessage(text) {
    flash(this.hud.querySelector(".split-pop"), text, "info");
  },

  /** Show/hide the "Repainting the rug" notice while a theme/pattern change is being painted. */
  setBusy(on) {
    this.root.querySelector(".busy").classList.toggle("show", on);
  },

  setTitleLabels(laps) {
    this.root.querySelector(".race-lbl").textContent = `Race ${laps} lap${laps > 1 ? "s" : ""}`;
  },

  setTitleBest(text) {
    setText(this.root.querySelector(".title-best"), text);
  },

  /** Per-frame: gaps, stats, drift popups and queued tracker/drift events. */
  updateRaceHud(race, session) {
    const q = (sel) => this.hud.querySelector(sel);
    const player = race.player;
    const tracker = session.tracker;
    this.lapTotal = race.laps;
    this.hud.classList.toggle("no-run", !tracker);
    if (session.kind !== "timetrial") this.updateGaps(race, player);
    if (!tracker) return;
    const delta = tracker.delta(race);
    const dEl = q(".stat-delta .v");
    setText(dEl, delta === null ? "--" : formatDelta(delta));
    dEl.className = `v${delta === null ? "" : delta <= 0 ? " good" : " bad"}`;
    const secs = (s) => (s === null ? "--" : formatTime(s));
    setText(q(".stat-best .v"), secs(tracker.bestLapSeconds));
    setText(q(".stat-last .v"), secs(tracker.lastLapSeconds));
    this.updateDrift(session);
    applyStatRows(this.hud, statRowsVisible({
      delta, best: tracker.bestLapSeconds, last: tracker.lastLapSeconds, drift: this.driftScore ?? 0,
    }));
    this.drainEvents(tracker, session.drift);
  },

  updateGaps(race, player) {
    const { ahead, behind } = neighbours(race.order, player);
    const gapA = ahead ? gapSeconds(ahead.prog - player.prog, player.speed) : 0;
    const gapB = behind ? gapSeconds(player.prog - behind.prog, behind.speed) : 0;
    fillGapRow(this.hud.querySelector(".gap-ahead"), ahead, formatGap(gapA), lookOf);
    fillGapRow(this.hud.querySelector(".gap-behind"), behind, formatGap(-gapB), lookOf);
  },

  updateDrift(session) {
    const drift = session.drift?.state;
    if (!drift) return;
    const live = this.hud.querySelector(".dp-live");
    const showing = drift.active || drift.points > 0;
    live.classList.toggle("on", showing);
    if (showing) {
      const tierName = TIERS[drift.tier].short;
      setText(live, `DRIFT ${drift.points}${drift.combo > 1 ? `  x${drift.combo}` : ""}${tierName ? `  ${tierName}` : ""}`);
      live.style.color = TIERS[drift.tier].color;
      live.dataset.tier = drift.tier;
    }
    this.driftScore = drift.total + (showing ? drift.points : 0);
    setText(this.hud.querySelector(".stat-drift .v"), String(this.driftScore));
  },

  /** Show the most recent queued event of each kind (and emit an audio event for each); the queues are always emptied. */
  drainEvents(tracker, drift) {
    const split = this.hud.querySelector(".split-pop");
    for (const e of tracker.events.splice(0)) {
      if (e.type === "split") {
        const base = e.delta === null ? `S${e.sector}  ${formatTime(e.time)}` : `S${e.sector}  ${formatDelta(e.delta)}`;
        const good = e.delta !== null && e.delta <= 0;
        const word = this.colourBlind && e.delta !== null ? `  ${good ? STR.hud.cbFast : STR.hud.cbSlow}` : "";
        flash(split, base + word, e.delta === null ? "info" : good ? "good" : "bad");
        this.onEvent?.("split", { good });
      } else if (e.type === "lap") {
        if (e.record) flash(split, `LAP ${e.lap}  ${formatTime(e.time)}  BEST!`, "good");
        this.onEvent?.(e.record ? "newBest" : "lap");
        this.announce?.(STR.status.lap(Math.min(e.lap + 1, this.lapTotal ?? e.lap + 1), this.lapTotal ?? e.lap + 1));
      }
    }
    const pop = this.hud.querySelector(".dp-event");
    for (const e of drift?.events.splice(0) ?? []) {
      if (e.type === "bank" && e.points > 0) {
        flash(pop, `+${e.points}${e.combo > 1 ? `  COMBO x${e.combo}` : ""}`, "good");
        this.onEvent?.("driftBank");
      } else if (e.type === "lost") {
        flash(pop, e.points > 0 ? `DRIFT LOST  -${e.points}` : "DRIFT LOST", "bad");
        this.onEvent?.("driftLost");
      } else if (e.type === "turbo") flash(pop, `${TIERS[e.tier].label}!`, `t${e.tier}`);
      else if (e.type === "tier") this.onEvent?.("driftTier", { tier: e.tier });
    }
  },
};

/** Standings table rows (finish-time estimates prefixed with "~"). */
export function standingsHtml(race) {
  return race
    .standings()
    .map((s, i) => {
      const look = lookOf(s.car);
      return `<tr class="${s.car.isPlayer ? "me" : ""}"><td class="p">${i + 1}</td><td><i style="background:${look.color}"></i>${s.car.isPlayer ? "You" : look.name}</td><td class="t">${s.estimated ? "~" : ""}${formatTime(s.time)}</td></tr>`;
    })
    .join("");
}

/** Time-trial result rows: one per lap, fastest highlighted. */
export function lapRowsHtml(outcome) {
  const fastest = Math.min(...outcome.lapSeconds);
  return outcome.lapSeconds
    .map((t, i) => `<tr class="${t === fastest ? "me" : ""}"><td class="p">${i + 1}</td><td>Lap ${i + 1}</td><td class="t">${formatTime(t)}</td></tr>`)
    .join("");
}

/** Medal line: stars (not colour) plus the next target to chase. */
function medalHtml(outcome) {
  if (!outcome.targets) return "";
  const { gold, silver, bronze } = outcome.targets;
  const next = !outcome.medal ? ["Bronze", bronze] : outcome.medal === "bronze" ? ["Silver", silver] : outcome.medal === "silver" ? ["Gold", gold] : null;
  const earned = outcome.medal ? `<b class="good">${STR.results.medalLine(STR.results.medal[outcome.medal], medalStars(outcome.medal))}${outcome.newMedal ? " NEW!" : ""}</b>` : "";
  const target = next ? (outcome.medal ? STR.results.nextMedal(next[0], formatTime(next[1] / 1000)) : STR.results.noMedal(formatTime(next[1] / 1000))) : "";
  return [earned, target].filter(Boolean).join(" &middot; ");
}

/** Notes shown under the place line: new best, delta to the old best, best lap. */
export function resultsExtraHtml(outcome) {
  if (!outcome) return "";
  const lines = [];
  if (outcome.firstRun) lines.push('<b class="good">First local best set</b>');
  else if (outcome.newBest) lines.push(`<b class="good">NEW BEST!</b> ${formatDelta(outcome.deltaMs / 1000)}s`);
  else if (outcome.deltaMs !== null) lines.push(`${formatDelta(outcome.deltaMs / 1000)}s vs your best`);
  lines.push(`Best lap ${formatTime(outcome.bestLapMs / 1000)}${outcome.newBestLap ? ' <b class="good">NEW!</b>' : ""}`);
  if (outcome.difficulty) lines.push(STR.results.difficulty(outcome.difficulty));
  const medalText = medalHtml(outcome);
  if (medalText) lines.push(medalText);
  if (outcome.kind === "timetrial" && outcome.ghostSaved) lines.push("Ghost saved for your next run");
  if (!outcome.stored) lines.push("Local storage unavailable: records not saved");
  return lines.join(" &middot; ");
}
