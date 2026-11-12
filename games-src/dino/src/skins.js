// Dino colour skins unlocked by best-score milestones (any mode).  Pure data + helpers, unit-tested.
// Colours are 0xRRGGBB replacements for the three body tones of the dino mesh (see PALETTE.dinoBody/dinoDark/dinoBelly).

import { SKIN_UNLOCKS } from './tuning.js';

export const SKINS = [
  { id: 'classic', label: 'Original', unlock: 0, colors: null },
  { id: 'ember', label: 'Ember', unlock: SKIN_UNLOCKS.ember, colors: { body: 0xe0693a, dark: 0x9c3a1d, belly: 0xffd9a8 }, swatch: '#e0693a' },
  { id: 'frost', label: 'Frost', unlock: SKIN_UNLOCKS.frost, colors: { body: 0x6fb7e8, dark: 0x3d78b0, belly: 0xe6f6ff }, swatch: '#6fb7e8' },
  { id: 'toxic', label: 'Toxic', unlock: SKIN_UNLOCKS.toxic, colors: { body: 0xa6e22e, dark: 0x5a8a12, belly: 0xf2ffb8 }, swatch: '#a6e22e' },
  { id: 'royal', label: 'Royal Gold', unlock: SKIN_UNLOCKS.royal, colors: { body: 0xe8b923, dark: 0x8a5a12, belly: 0xfff2c0 }, swatch: '#e8b923' },
];

export const SKIN_IDS = SKINS.map((s) => s.id);
export const DEFAULT_SKIN = 'classic';

export const skinById = (id) => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const isSkinId = (v) => typeof v === 'string' && SKIN_IDS.includes(v);

/** Modes whose scores do not count toward skins: Zen can not end a run, so surviving alone would unlock everything. */
export const SKIN_EXCLUDED_MODES = Object.freeze(['zen']);

const finiteOr0 = (n) => (Number.isFinite(n) ? n : 0);

/** Best score across the skill modes (Zen excluded; each argument is a score; junk counts as 0). */
export const bestOverall = (bests) =>
  Math.max(0, ...Object.entries(bests ?? {}).filter(([mode]) => !SKIN_EXCLUDED_MODES.includes(mode)).map(([, n]) => finiteOr0(n)));

/** Skins a player already earned under the old rule (every mode counted): kept forever via settings.unlockedSkins. */
export const legacyUnlockedIds = (bests) => unlockedSkins(Math.max(0, ...Object.values(bests ?? {}).map(finiteOr0))).map((s) => s.id);

/** NEW BEST needs a previous best above 0 and a real score, so a first or trivial run is not a celebration. */
export const isNewBest = (previous, score, minScore = 50) => previous > 0 && score > previous && score >= minScore;

export const isUnlocked = (id, best) => best >= skinById(id).unlock;
/** Unlocked by score, or earned earlier and remembered in `owned`. */
export const isSkinOpen = (id, best, owned = []) => isUnlocked(id, best) || owned.includes(id);
export const unlockedSkins = (best) => SKINS.filter((s) => best >= s.unlock);

/** The skin to actually use: a locked or unknown choice falls back to the original. */
export const resolveSkin = (id, best, owned = []) => (isSkinId(id) && isSkinOpen(id, best, owned) ? id : DEFAULT_SKIN);

/** Skins whose threshold was crossed when the best went from `prev` to `next`. */
export const newlyUnlocked = (prev, next) => SKINS.filter((s) => s.unlock > 0 && prev < s.unlock && next >= s.unlock);

/** The next locked skin (or null when everything is unlocked). */
export const nextUnlock = (best) => SKINS.find((s) => best < s.unlock) ?? null;
