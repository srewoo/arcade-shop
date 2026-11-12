import { CONFIG, DIFFICULTY, WORLD, type DifficultyId, type ModeId } from './config';
import { createRng } from './rng';
import { newWaveRun } from './director';
import type { GameState } from './types';

export function createGame(seed: number, mode: ModeId, difficulty: DifficultyId, startWave = 1): GameState {
  const d = DIFFICULTY[difficulty];
  const base = { seed: seed >>> 0, difficulty };
  const x = WORLD.w / 2;
  const y = CONFIG.player.startY;
  return {
    ...base,
    rng: createRng(seed),
    mode,
    phase: 'playing',
    time: 0,
    score: 0,
    mult: 1,
    chain: 0,
    chainTimer: 0,
    kills: 0,
    bossesDown: Math.floor((startWave - 1) / CONFIG.waves.bossEvery),
    stats: { fired: 0, hit: 0, bestMult: 1 },
    continuesLeft: d.continues,
    continuesUsed: 0,
    bombFlash: 0,
    nextId: 1,
    wave: newWaveRun(base, startWave),
    player: { x, y, px: x, py: y, lives: d.lives, shield: 0, spread: 0, spreadLevel: 0, bombs: d.startBombs, invuln: 1.5, fireCd: 0 },
    enemies: [],
    pBullets: [],
    eBullets: [],
    pickups: [],
    events: [{ type: 'wave', index: startWave, boss: false }],
  };
}

/** Spend a continue: refill lives, keep score and wave, clear the screen. Returns false if none left. */
export function useContinue(s: GameState): boolean {
  if (s.phase !== 'down' || s.continuesLeft <= 0) return false;
  s.continuesLeft -= 1;
  s.continuesUsed += 1;
  s.phase = 'playing';
  s.player.lives = DIFFICULTY[s.difficulty].continueLives;
  s.player.invuln = 3;
  s.player.shield = 0;
  s.mult = 1;
  s.chain = 0;
  s.eBullets = [];
  s.bombFlash = 0;
  s.player.bombs = Math.max(s.player.bombs, 1);
  return true;
}
