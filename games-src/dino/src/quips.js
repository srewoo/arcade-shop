// Game-over copy: crash quips, killer-specific quips and mode-aware lines (pure, unit-tested).
import { pick } from './util.js';

export const QUIPS = [
  'Frenzy: 100%. Coordination: pending.',
  'The cactus was also in a frenzy.',
  'Tiny arms. Big dreams.',
  'Saw it coming. Committed anyway.',
  'Legs filed a complaint.',
  'Peak performance, briefly.',
  'That was the warm-up lap.',
  'Aerodynamic. Not steerable.',
];

/** Extra quips keyed by what killed you (50% chance to use them when available). */
export const KILLER_QUIPS = {
  ptero: ['Air traffic was not notified.', 'Right of way goes to the one with wings.'],
  weed: ['Defeated by a plant that is not even alive.', 'It was a tumbleweed. A tumbleweed.'],
  boulder: ['Rolled flat by a rock with momentum.', 'The boulder had the right of way.'],
  log: ['You were told to duck.', 'Should have ducked. Would have ducked.'],
  meteor: ['The sky had other plans.', 'It was marked on the ground. In red.'],
};

/** Zen runs are ended on purpose, so no crash jokes. */
export const QUIPS_ZEN = ['Gentle. Unhurried. Slightly dusty.', 'No cacti were harmed in this run.', 'Calm legs, calm mind.', 'Stretch break. Well earned.'];

/** Time Attack ran out of clock. */
export const QUIPS_TIMEUP = ['Sixty seconds. Zero regrets.', 'The clock won this one.', 'Fast legs. Faster clock.', 'Time flies when you are a dinosaur.'];

/** Quip pool for how the run ended: `endTitle` is 'GAME OVER' (crash), 'RUN OVER' (Zen) or 'TIME UP'. */
export function quipPool(endTitle, killer, roll = Math.random()) {
  if (endTitle === 'TIME UP') return QUIPS_TIMEUP;
  if (endTitle === 'RUN OVER') return QUIPS_ZEN;
  return roll < 0.5 && KILLER_QUIPS[killer] ? KILLER_QUIPS[killer] : QUIPS;
}

export const pickQuip = (endTitle, killer) => pick(quipPool(endTitle, killer));
