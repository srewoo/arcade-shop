// Life loss and level-clear checks, run at the end of each step.
import { clearBonus } from './scoring';
import { addScore, emit, resetServe, type World } from './world';

export function applyLossAndClear(w: World): void {
  if (w.remaining <= 0) {
    addScore(w, clearBonus(w.lives));
    w.phase = 'clear';
    emit(w, { type: 'clear', x: w.field.w / 2, y: w.field.h / 2 });
    return;
  }
  if (w.balls.length > 0) return;
  w.lives--;
  w.combo = 0;
  emit(w, { type: 'lost', x: w.paddle.x, y: w.paddleY });
  if (w.lives <= 0) {
    w.lives = 0;
    w.phase = 'over';
    emit(w, { type: 'over', x: w.field.w / 2, y: w.field.h / 2 });
  } else resetServe(w);
}
