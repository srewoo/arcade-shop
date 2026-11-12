// Pause overlay, first-run tips card and the off-screen status line. Mixed into UI.prototype.
import { STR } from "./strings.js";
import { trapTab, focusables, wrapIndex, pickReturnTarget } from "./focusTrap.js";

export const pausePanelMethods = {
  /** Wire the pause / tips dialogs: button clicks call onAct(action) and Tab stays inside. */
  initDialogs(onPauseAct, onTipsClose) {
    this.pauseEl = this.root.querySelector(".pause");
    this.tipsEl = this.root.querySelector(".tips");
    this.pauseEl.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act) onPauseAct(act);
    });
    this.pauseEl.addEventListener("keydown", (e) => {
      if (trapTab(this.pauseEl, e)) return;
      const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const items = focusables(this.pauseEl);
      items[wrapIndex(items.indexOf(document.activeElement), step, items.length)]?.focus();
    });
    this.tipsEl.addEventListener("keydown", (e) => {
      if (!trapTab(this.tipsEl, e)) onTipsClose(); // any key other than Tab closes the card
    });
    this.tipsEl.addEventListener("click", () => onTipsClose());
    this.statusEl = this.root.querySelector(".sr-status");
  },

  /** Show/hide the pause overlay. view "menu" or "confirm" (with action "restart" | "quit"). */
  showPause(show, view = "menu", action = null) {
    const el = this.pauseEl;
    if (show && !el.classList.contains("show")) this.pauseOpener = document.activeElement;
    el.classList.toggle("show", show);
    el.classList.toggle("confirming", show && view === "confirm");
    if (!show) {
      if (el.contains(document.activeElement)) document.activeElement.blur();
      return;
    }
    if (view === "confirm") {
      const copy = action === "quit" ? [STR.pause.quitQ, STR.pause.quitNote, STR.pause.yesQuit] : [STR.pause.restartQ, STR.pause.restartNote, STR.pause.yesRestart];
      el.querySelector(".pause-q").textContent = copy[0];
      el.querySelector(".pause-note").textContent = copy[1];
      el.querySelector(".pause-yes").textContent = copy[2];
      el.querySelector(".pause-keep").focus({ preventScroll: true });
    } else {
      const resume = el.querySelector(".pause-resume");
      resume.focus({ preventScroll: true });
    }
  },

  /** Hide the pause card while the settings panel is on top of it. */
  coverPause(covered) {
    this.pauseEl.classList.toggle("covered", covered);
  },

  /** First-run / "how to play" card. `touch` selects the control wording. */
  showTips(show, { laps = 3, touch = false, firstRun = false } = {}) {
    const el = this.tipsEl;
    if (show) {
      this.tipsOpener = document.activeElement;
      el.querySelector(".tips-hint").textContent = firstRun ? STR.tips.dismissHint : STR.tips.dismissHintHelp;
      el.querySelector(".tips-goal").textContent = STR.tips.goal(laps);
      const steps = touch ? STR.tips.steps.touch : STR.tips.steps.keys;
      el.querySelector(".tips-steps").innerHTML = steps.map(([name, text]) => `<li><b>${name}</b><span>${text}</span></li>`).join("");
    }
    el.classList.toggle("show", show);
    if (show) el.querySelector(".tips-ok").focus({ preventScroll: true });
    else {
      if (el.contains(document.activeElement)) document.activeElement.blur();
      pickReturnTarget(this.tipsOpener, this.root.querySelector(".help-btn"))?.focus({ preventScroll: true });
      this.tipsOpener = null;
    }
  },

  /** Non-blocking first-run tip for touch: a small chip over the countdown that fades by itself. */
  showTouchTip(show) {
    const el = this.root.querySelector(".touch-tip");
    clearTimeout(this.touchTipTimer);
    el.textContent = show ? STR.tips.touchTip : "";
    el.classList.toggle("show", show);
    if (show) this.touchTipTimer = setTimeout(() => this.showTouchTip(false), 9000);
  },

  /** Polite screen-reader line for key events (score, pause, finish). */
  announce(text) {
    if (this.statusEl && this.statusEl.textContent !== text) this.statusEl.textContent = text;
  },
};
