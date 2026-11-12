// Personal bests per mode, NEW BEST detection and skin unlocks.  No DOM: ui.js only displays what this returns.
import { loadBests, saveBest, saveSettings } from './storage.js';
import { bestOverall, isNewBest, newlyUnlocked } from './skins.js';
import { settings } from './state.js';
import { events } from './events.js';
import { FLOW } from './tuning.js';

export const records = {
  bests: loadBests(), // { classic, hardcore, zen, timeattack } -> best score
  unlocked: [], // skins unlocked by the last submitted run

  best(mode) {
    return this.bests[mode] ?? 0;
  },

  /** Best across the skill modes (Zen excluded), used for skin unlocks. */
  overall() {
    return bestOverall(this.bests);
  },

  /**
   * Record a finished run.  Updates and saves the mode best when beaten, remembers any skin it unlocks, and returns
   * whether it deserves the NEW BEST celebration (previous best above 0 and a real score).
   */
  submit(mode, score) {
    const previous = this.best(mode);
    this.unlocked = [];
    if (score <= previous) return false;
    const before = this.overall();
    this.bests[mode] = score;
    saveBest(mode, score);
    events.emit('best', { mode, best: score });
    this.unlocked = newlyUnlocked(before, this.overall());
    if (this.unlocked.length) {
      settings.unlockedSkins = [...new Set([...settings.unlockedSkins, ...this.unlocked.map((s) => s.id)])];
      saveSettings(settings);
    }
    return isNewBest(previous, score, FLOW.newBestMinScore);
  },
};
