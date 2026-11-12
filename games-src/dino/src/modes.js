// Game modes: pure rule tables and helpers (no three / DOM, unit-tested in tests/modes.test.js).
//
//   classic   original behaviour: one hit ends the run
//   hardcore  faster start and ramp, no Shield pickups, one hit ends the run
//   zen       hits knock the dino down for a moment, the run never ends, nothing is submitted
//   timeattack  60 s countdown, a hit still ends the run

/** Storage key of the Classic best score (kept identical to the original game for compatibility). */
export const CLASSIC_BEST_KEY = 'dino-run-locked-in:best';

import { CLASSIC } from './tuning.js';
import { obstacleGates } from './obstacles/difficulty.js';

const ALL_PICKUPS = ['shield', 'doublejump', 'slowmo', 'score2'];

export const MODES = {
  classic: {
    id: 'classic', label: 'Classic', blurb: 'The original run', digit: 1,
    startSpeed: CLASSIC.startSpeed, maxSpeed: CLASSIC.maxSpeed, accel: CLASSIC.accel, timeLimit: 0, onHit: 'crash',
    board: 'dino', bestKey: CLASSIC_BEST_KEY, pickups: ALL_PICKUPS, powerupsDefault: false,
  },
  hardcore: {
    id: 'hardcore', label: 'Hardcore', blurb: 'Fast. One hit.', digit: 2,
    startSpeed: 17, maxSpeed: 36, accel: 0.32, timeLimit: 0, onHit: 'crash',
    board: 'dino:hardcore', bestKey: 'dino-run-locked-in:best:hardcore',
    pickups: ['doublejump', 'slowmo', 'score2'], powerupsDefault: true,
  },
  zen: {
    id: 'zen', label: 'Zen', blurb: 'Hits only trip you', digit: 3,
    startSpeed: 13, maxSpeed: 26, accel: 0.15, timeLimit: 0, onHit: 'stumble',
    board: null, bestKey: 'dino-run-locked-in:best:zen',
    pickups: ['doublejump', 'slowmo', 'score2'], powerupsDefault: true,
  },
  timeattack: {
    id: 'timeattack', label: 'Time Attack', blurb: '60 seconds, top score', digit: 4,
    startSpeed: 15, maxSpeed: 33, accel: 0.28, timeLimit: 60, onHit: 'crash',
    board: 'dino:timeattack', bestKey: 'dino-run-locked-in:best:timeattack',
    pickups: ALL_PICKUPS, powerupsDefault: true,
  },
};

export const MODE_ORDER = ['classic', 'hardcore', 'zen', 'timeattack'];
export const DEFAULT_MODE = 'classic';

export const isModeId = (v) => typeof v === 'string' && Object.hasOwn(MODES, v);
export const parseMode = (v) => (isModeId(v) ? v : DEFAULT_MODE);

/** Next / previous mode id (wraps around). */
export function cycleMode(id, dir) {
  const i = MODE_ORDER.indexOf(parseMode(id));
  return MODE_ORDER[(i + (dir < 0 ? -1 : 1) + MODE_ORDER.length) % MODE_ORDER.length];
}

/** 'Digit1'/'Numpad3' -> mode id, anything else -> null. */
export function modeFromKey(code) {
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(code ?? '');
  return m ? (MODE_ORDER[Number(m[1]) - 1] ?? null) : null;
}

/** Start speed, top speed and acceleration of a mode scaled by the difficulty multiplier. */
export function speedParams(modeId, mult = 1) {
  const m = MODES[parseMode(modeId)];
  return { start: m.startSpeed * mult, max: m.maxSpeed * mult, accel: m.accel * mult };
}

/** Parse a stored best score: any non-finite / negative / non-integer-ish value becomes 0. */
export function parseBest(raw) {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 99999999) : 0;
}

/**
 * Which pickups / obstacles a run uses.  Classic stays original unless the "Classic Plus" setting is on;
 * the other modes use power-ups when the power-ups setting is on and always use the new obstacles.
 */
export function effectiveRules(modeId, { powerups = true, classicPlus = false } = {}, mult = 1) {
  const mode = MODES[parseMode(modeId)];
  const classic = mode.id === 'classic';
  const newObstacles = classic ? classicPlus : true;
  const kin = speedParams(mode.id, mult);
  return {
    powerups: classic ? classicPlus : powerups,
    newObstacles,
    pool: mode.pickups,
    // time-based gates and breathers only exist with the new obstacles: Classic keeps the original table
    gates: newObstacles ? obstacleGates(kin) : null,
    breather: newObstacles ? kin : null,
  };
}

/**
 * What a collision does.  'ignore' = grace period after a shield break / stumble, 'shield' = a Shield absorbs it,
 * 'stumble' = Zen knock-down, 'crash' = run over.
 */
export function hitOutcome(modeId, { shield = false, invulnerable = false } = {}) {
  if (invulnerable) return 'ignore';
  if (shield) return 'shield';
  return MODES[parseMode(modeId)].onHit;
}

/** Seconds left on a countdown (never negative); 0 limit = untimed, returns Infinity. */
export const timeRemaining = (limit, elapsed) => (limit > 0 ? Math.max(0, limit - elapsed) : Infinity);

/** 'm:ss' clock text for the countdown. */
export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
