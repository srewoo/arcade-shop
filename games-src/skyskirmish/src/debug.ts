// Debug hooks, installed only when the page URL has ?debug=1.
import { A } from './appState';
import { damageEnemy, hurtPlayer } from './combat';
import { newWaveRun } from './director';
import { bestFor } from './scores';

export function installDebug(): void {
  if (new URLSearchParams(location.search).get('debug') !== '1') return;
  (window as unknown as Record<string, unknown>).__sky = {
    summary: () => {
      const g = A.game;
      return g && { screen: A.screen, phase: g.phase, score: g.score, mult: g.mult, wave: g.wave.index, lives: g.player.lives, bombs: g.player.bombs, enemies: g.enemies.length, eBullets: g.eBullets.length, pBullets: g.pBullets.length, continues: g.continuesLeft, shield: g.player.shield, spread: g.player.spreadLevel, bossesDown: g.bossesDown };
    },
    screen: () => A.screen,
    god: (on: boolean) => void (A.god = on),
    killAll: () => void A.game?.enemies.forEach((e) => damageEnemy(A.game!, e, 99999)),
    gotoWave: (n: number) => {
      if (A.game) A.game.wave = newWaveRun(A.game, n);
    },
    downNow: () => {
      const g = A.game;
      if (!g) return;
      g.player.lives = 1;
      g.player.invuln = 0;
      g.player.shield = 0;
      hurtPlayer(g);
    },
    best: () => (A.game ? bestFor(A.scores, A.game.mode, A.game.difficulty) : null),
  };
}
