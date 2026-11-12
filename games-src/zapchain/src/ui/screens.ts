// Overlay screens (title, pause, level cleared, game over) driven by the game phase.
import type { Game, Phase } from '../game';
import { OVER_DETAIL, OVER_TITLE, S } from '../strings';
import { closeDialog, dialogOpen, openDialog } from './dialogs';
import { countUpValue } from './countUp';
import { must } from './dom';

export interface ScreenHooks { openSettings: (opener: HTMLElement | null) => void; announce: (t: string) => void; reduced: () => boolean }

const fmt = (n: number): string => n.toLocaleString('en-US');

export function createScreens(game: Game, hooks: ScreenHooks): { sync: (prev: Phase) => void; refreshTitle: () => void } {
  const title = must('title-overlay');
  const pause = must('pause-overlay');
  const clear = must('clear-overlay');
  const over = must('over-overlay');
  const confirm = must('pause-confirm');
  const confirmText = must('pause-confirm-text');
  let pending: 'restart' | 'quit' | null = null;

  const askConfirm = (kind: 'restart' | 'quit'): void => {
    pending = kind;
    confirmText.textContent = kind === 'restart' ? S.confirmRestart : S.confirmQuit;
    confirm.hidden = false;
    must('pause-confirm-no').focus();
  };
  const clearConfirm = (): void => { pending = null; confirm.hidden = true; };
  const refreshTitle = (): void => { must('title-best').textContent = game.scores.best > 0 ? `${S.best(game.scores.best)} · level ${game.scores.bestLevel}` : ''; };

  must('title-play').addEventListener('click', () => game.start());
  must('title-settings').addEventListener('click', (e) => hooks.openSettings(e.currentTarget as HTMLElement));
  must('pause-resume').addEventListener('click', () => game.resume());
  must('pause-restart').addEventListener('click', () => askConfirm('restart'));
  must('pause-quit').addEventListener('click', () => askConfirm('quit'));
  must('pause-settings').addEventListener('click', (e) => hooks.openSettings(e.currentTarget as HTMLElement));
  must('pause-confirm-no').addEventListener('click', () => { clearConfirm(); must('pause-resume').focus(); });
  must('pause-confirm-yes').addEventListener('click', () => {
    const kind = pending;
    clearConfirm();
    if (kind === 'quit') game.toTitle();
    else game.start();
  });
  must('clear-next-btn').addEventListener('click', () => game.nextLevel());
  must('over-retry').addEventListener('click', () => game.start());
  must('over-title').addEventListener('click', () => game.toTitle());

  let raf = 0;
  const countUp = (el: HTMLElement, target: number): void => {
    cancelAnimationFrame(raf);
    if (hooks.reduced() || target === 0) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    const tick = (now: number): void => {
      el.textContent = fmt(countUpValue(target, now - t0, 800));
      if (now - t0 < 800) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const fillClear = (): void => {
    const c = game.clearInfo;
    if (!c) return;
    must('clear-h').textContent = `LEVEL ${c.level} COMPLETED!`;
    must('clear-bonus').textContent = `+${fmt(c.bonus)}`;
    must('clear-score').textContent = fmt(c.score);
    must('clear-next').textContent = `Next: level ${c.level + 1}`;
    hooks.announce(S.levelCleared(c.level, c.bonus));
  };

  const fillOver = (): void => {
    const r = game.result;
    if (!r) return;
    must('over-h').textContent = OVER_TITLE[r.reason];
    must('over-reason').textContent = OVER_DETAIL[r.reason];
    countUp(must('over-score'), r.score);
    must('over-level').textContent = String(r.level);
    must('over-best').textContent = fmt(game.scores.best);
    must('over-detail').textContent = `${S.gameOver(r.reason, r.score, r.level)} ${S.best(game.scores.best)}`;
    const badge = must('over-new');
    badge.hidden = !r.isNew;
    badge.textContent = S.newBest;
    hooks.announce(`${S.gameOver(r.reason, r.score, r.level)}${r.isNew ? ` ${S.newBest}` : ''}`);
  };

  const sync = (): void => {
    const p = game.phase;
    const want = { title: p === 'title', pause: p === 'paused', clear: p === 'cleared', over: p === 'over' };
    if (!want.pause && dialogOpen('pause-overlay')) { clearConfirm(); closeDialog(pause); }
    if (!want.title && dialogOpen('title-overlay')) closeDialog(title);
    if (!want.clear && dialogOpen('clear-overlay')) closeDialog(clear);
    if (!want.over && dialogOpen('over-overlay')) closeDialog(over);
    if (want.title) { refreshTitle(); openDialog(title, { first: must('title-play') }); }
    if (want.pause) openDialog(pause, { first: must('pause-resume'), onEscape: () => game.resume() });
    if (want.clear) { fillClear(); openDialog(clear, { first: must('clear-next-btn') }); }
    if (want.over) { fillOver(); openDialog(over, { first: must('over-retry') }); }
    if (document.activeElement instanceof HTMLElement && !dialogOpen()) document.activeElement.blur();
  };
  return { sync, refreshTitle };
}
