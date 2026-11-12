// Every gameplay tuning number lives here. Times are seconds, distances are world units
// (the playfield is WORLD.w x WORLD.h units, scaled to the screen).
export const WORLD = { w: 360, h: 640 } as const;
export const STEP = 1 / 60;

export type DifficultyId = 'easy' | 'normal' | 'hard';
export type ModeId = 'campaign' | 'endless';
export type EnemyKind = 'scout' | 'weaver' | 'gunner' | 'tank';
export type PickupKind = 'spread' | 'shield' | 'bomb';

export interface DifficultyTuning {
  readonly lives: number;
  readonly continues: number;
  readonly continueLives: number;
  readonly startBombs: number;
  readonly hp: number;
  readonly bulletSpeed: number;
  readonly fireRate: number;
  readonly density: number;
  readonly dropChance: number;
  readonly score: number;
}

export const DIFFICULTY: Readonly<Record<DifficultyId, DifficultyTuning>> = {
  easy: { lives: 5, continues: 3, continueLives: 3, startBombs: 3, hp: 0.8, bulletSpeed: 0.8, fireRate: 0.7, density: 0.8, dropChance: 0.2, score: 1 },
  normal: { lives: 3, continues: 2, continueLives: 2, startBombs: 2, hp: 1, bulletSpeed: 1, fireRate: 1, density: 1, dropChance: 0.14, score: 1.25 },
  hard: { lives: 2, continues: 1, continueLives: 2, startBombs: 1, hp: 1.3, bulletSpeed: 1.2, fireRate: 1.35, density: 1.25, dropChance: 0.09, score: 1.75 },
};

export interface EnemyTuning {
  readonly hp: number;
  readonly r: number;
  readonly speed: number;
  readonly score: number;
  /** Seconds between shots at fireRate 1; 0 = never fires. */
  readonly fire: number;
  readonly minWave: number;
}

export const ENEMY: Readonly<Record<EnemyKind, EnemyTuning>> = {
  scout: { hp: 1, r: 12, speed: 95, score: 100, fire: 0, minWave: 1 },
  weaver: { hp: 2, r: 13, speed: 80, score: 160, fire: 2.6, minWave: 2 },
  gunner: { hp: 4, r: 15, speed: 70, score: 260, fire: 1.7, minWave: 3 },
  tank: { hp: 12, r: 21, speed: 45, score: 650, fire: 1.4, minWave: 5 },
};

export const CONFIG = {
  player: {
    speed: 270,
    dragSpeed: 1100,
    r: 6,
    drawR: 17,
    margin: 18,
    minY: 260,
    startY: 540,
    fireInterval: 0.13,
    bulletSpeed: 620,
    invuln: 2.2,
    maxBombs: 3,
    spreadSecs: 14,
    spreadMaxLevel: 3,
    shieldSecs: 12,
  },
  bullet: { r: 4, playerR: 3, enemySpeed: 175, cap: 400 },
  pickup: { r: 14, fall: 70, collectR: 20 },
  bomb: { damage: 14, bossDamage: 18, flashSecs: 0.5 },
  score: { multMax: 8, killsPerStep: 4, chainSecs: 3.2, waveBonus: 500, bossBonus: 5000, winBonus: 10000 },
  waves: {
    campaignLength: 12,
    bossEvery: 4,
    bannerSecs: 1.8,
    clearDelay: 1.1,
    maxSpawns: 28,
  },
  boss: { hp: 120, hpPerBoss: 70, r: 34, entryY: 120, entrySpeed: 80, score: 3000 },
  audio: { defaultVolume: 70, masterGain: 0.45 },
  fx: { shake: 7, particles: 22, reduceFactor: 0.4 },
  hudSizes: [100, 125, 150] as const,
} as const;
