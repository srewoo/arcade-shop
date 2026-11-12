// Wave flow: banner, timed spawns, clear detection, the next wave or the campaign win.
import { CONFIG } from './config';
import { spawnEnemy } from './enemies';
import { addBonus } from './scoring';
import type { GameState, WaveRun } from './types';
import { buildWave } from './waves';

export function newWaveRun(s: Pick<GameState, 'difficulty' | 'seed'>, index: number): WaveRun {
  const spec = buildWave(index, s.difficulty, s.seed);
  return { index, clock: 0, queue: [...spec.spawns], boss: spec.boss, banner: CONFIG.waves.bannerSecs, clearFor: 0 };
}

export function startWave(s: GameState, index: number): void {
  s.wave = newWaveRun(s, index);
  s.events.push({ type: 'wave', index, boss: s.wave.boss });
}

function finishWave(s: GameState): void {
  const w = s.wave;
  const bonus = addBonus(s, CONFIG.score.waveBonus * Math.min(w.index, 10));
  s.events.push({ type: 'waveClear', index: w.index, bonus });
  if (s.mode === 'campaign' && w.index >= CONFIG.waves.campaignLength) {
    addBonus(s, CONFIG.score.winBonus);
    s.phase = 'won';
    s.events.push({ type: 'win' });
    return;
  }
  startWave(s, w.index + 1);
}

export function stepWave(s: GameState, dt: number): void {
  const w = s.wave;
  if (w.banner > 0) {
    w.banner -= dt;
    return;
  }
  w.clock += dt;
  while (w.queue.length > 0 && (w.queue[0]?.at ?? Infinity) <= w.clock) {
    const next = w.queue.shift();
    if (next) spawnEnemy(s, next);
  }
  if (w.queue.length > 0 || s.enemies.length > 0) {
    w.clearFor = 0;
    return;
  }
  w.clearFor += dt;
  if (w.clearFor >= CONFIG.waves.clearDelay) finishWave(s);
}
