import { describe, expect, it } from 'vitest';
import { FEEL } from '../src/config/feel';
import { TUNING } from '../src/config/tuning';
import { modifierFor, tuning } from '../src/levels';

describe('tuning config', () => {
  it('is frozen and its defaults are snapshot-guarded', () => {
    expect(Object.isFrozen(TUNING)).toBe(true);
    expect(Object.isFrozen(TUNING.speed)).toBe(true);
    expect(TUNING).toMatchInlineSnapshot(`
      {
        "biscuit": {
          "chaseSec": 4,
          "radiusTiles": 5,
        },
        "cheeseSec": 9,
        "contactRadiusSq": 0.42,
        "drench": {
          "baseSec": 6,
          "blinkSec": 1.6,
          "minSec": 3,
          "perLevel": 0.8,
        },
        "flow": {
          "clearingSec": 1.8,
          "demoRestartSec": 1.4,
          "dyingSec": 1.9,
          "gameOverInputDelaySec": 1,
          "readySec": 2.2,
          "summaryInputDelaySec": 0.6,
        },
        "mazeCount": 3,
        "modifiers": {
          "darkRadiusTiles": 5.5,
          "fastCatsMult": 1.05,
          "quickReleaseMult": 0.5,
          "startLevel": 7,
        },
        "opening": {
          "gracePerLevel": 1.5,
          "graceSec": 4,
        },
        "pounce": {
          "cooldownSec": 4,
          "dashMaxSec": 3,
          "earlyLevels": 3,
          "multEarly": 1.3,
          "multLate": 1.6,
          "windupSec": 0.35,
        },
        "release": {
          "base": [
            2,
            6,
            10,
            15,
          ],
          "minShrink": 0.45,
          "shrinkPerLevel": 0.07,
        },
        "rhythm": {
          "chaseSec": 20,
          "groomSec": 3,
        },
        "scoring": {
          "chain": [
            100,
            250,
            600,
            1500,
          ],
          "extraLifeAt": [
            7500,
            25000,
          ],
          "maxLives": 6,
          "points": {
            "cheese": 500,
            "crumb": 10,
            "pistol": 50,
            "sugar": 50,
          },
          "startLives": 3,
        },
        "speed": {
          "catBase": 4.4,
          "catCap": 5.6,
          "catPerLevel": 0.2,
          "drenchedSlow": 0.55,
          "leavingSlow": 0.8,
          "pipBase": 5.6,
          "pipCap": 6,
          "pipPerLevel": 0.05,
          "returningFast": 2.2,
        },
        "themeCount": 3,
      }
    `);
  });

  it('feel config holds quiet, bounded audio gains', () => {
    for (const g of Object.values(FEEL.audio.gain)) {
      expect(g).toBeGreaterThan(0);
      expect(g).toBeLessThanOrEqual(0.3);
    }
    expect(FEEL.audio.gain.squeak).toBeLessThan(FEEL.audio.gain.jingle);
    expect(FEEL.audio.gain.splash).toBeLessThanOrEqual(0.25);
  });
});

describe('opening and pacing', () => {
  it('Pip is faster than every cat on a straight run, on every level', () => {
    for (let l = 1; l <= 60; l++) {
      const t = tuning(l);
      expect(t.pipSpeed, `level ${l}`).toBeGreaterThan(t.catSpeed);
    }
  });
  it('the opening grace for Smudge shrinks to zero by level 4', () => {
    expect([1, 2, 3, 4, 5].map((l) => tuning(l).graceSec)).toEqual([4, 2.5, 1, 0, 0]);
  });
  it('pounce is gentler on levels 1-3', () => {
    expect([1, 3, 4, 9].map((l) => tuning(l).pounceMult)).toEqual([1.3, 1.3, 1.6, 1.6]);
  });
  it('level 7+ cycles modifiers, earlier levels have none', () => {
    expect([1, 6].map(modifierFor)).toEqual(['none', 'none']);
    expect([7, 8, 9, 10].map(modifierFor)).toEqual(['fastCats', 'darkKitchen', 'quickRelease', 'fastCats']);
    expect(tuning(9).releaseDelays[3] as number).toBeLessThan(tuning(8).releaseDelays[3] as number);
  });
});
