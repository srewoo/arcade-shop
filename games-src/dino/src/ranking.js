// Which runs count for the shared leaderboards.  Pure.  The reserved board ids (dino, dino:hardcore, dino:timeattack)
// only accept the default configuration: Normal difficulty, no Classic Plus, and no Snow (floatier landings).
import { MODES, parseMode } from './modes.js';

/** @returns {string[]} the reasons a run is off-config ('difficulty' | 'classicPlus' | 'snow'); empty when ranked. */
export function unrankedReasons(settings, modeId) {
  const mode = MODES[parseMode(modeId)];
  const reasons = [];
  if (settings.difficulty !== 'normal') reasons.push('difficulty');
  if (mode.id === 'classic' && settings.classicPlus) reasons.push('classicPlus');
  if (settings.weather === 'snow') reasons.push('snow');
  return reasons;
}

/** States in which a run is under way (settings changed now would affect a run that has already started). */
const RUN_STATES = ['running', 'paused', 'stumble', 'crashed'];
export const runInProgress = (state) => RUN_STATES.includes(state);

/** Ranking inputs frozen when a run starts: `{ mode, reasons }`.  The game-over card judges the run from this, not from live settings. */
export const snapshotRun = (settings, modeId) => ({ mode: parseMode(modeId), reasons: unrankedReasons(settings, modeId) });

/** A snapshot that also carries every off-config reason seen in `settings` now (a mid-run change can only make it unranked). */
export function taintRun(snap, settings) {
  const extra = unrankedReasons(settings, snap.mode).filter((r) => !snap.reasons.includes(r));
  return extra.length ? { mode: snap.mode, reasons: [...snap.reasons, ...extra] } : snap;
}

/** True when the run behind this snapshot may post to its mode's leaderboard. */
export const isRunRanked = (snap) => Boolean(MODES[snap.mode].board) && snap.reasons.length === 0;

/** True when the run may post to the mode's leaderboard (modes without a board never rank). */
export const isRanked = (settings, modeId) => Boolean(MODES[parseMode(modeId)].board) && unrankedReasons(settings, modeId).length === 0;
