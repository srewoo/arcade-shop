// Overlay screens (title, pause, game over) driven by the game phase.
import type { Game, Phase } from '../game';
import { MODES, type Mode } from '../modes';
import { MODE_DESC, MODE_LABEL, S } from '../strings';
import { closeDialog, dialogOpen, openDialog } from './dialogs';
import { countUpValue } from './countUp';
import { must } from './dom';

export interface ScreenHooks { openSettings: (opener: HTMLElement | null) => void; setMode: (m: Mode) => void; announce: (t: string) => void; reduced: () => boolean }

export function createScreens(game: Game, hooks: ScreenHooks): { sync: (prev: Phase) => void; refreshTitle: () => void } {
  const title = must('title-overlay');
  const pause = must('pause-overlay');
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

  const refreshTitle = (): void => {
    for (const b of title.querySelectorAll<HTMLButtonElement>('.mode')) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === game.mode));
    }
    must('mode-desc').textContent = MODE_DESC[game.mode];
    must('title-best').textContent = `${MODE_LABEL[game.mode]} ${S.best(game.bestScore)}`;
  };
  title.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.mode');
    if (b?.dataset.mode && (MODES as readonly string[]).includes(b.dataset.mode)) hooks.setMode(b.dataset.mode as Mode);
  });
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
  must('over-retry').addEventListener('click', () => game.start());
  must('over-title').addEventListener('click', () => game.toTitle());

  let raf = 0;
  const animateScore = (target: number): void => {
    const el = must('over-score');
    cancelAnimationFrame(raf);
    if (hooks.reduced() || target === 0) { el.textContent = String(target); return; }
    const t0 = performance.now();
    const tick = (now: number): void => {
      el.textContent = String(countUpValue(target, now - t0, 700));
      if (now - t0 < 700) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const fillOver = (): void => {
    const r = game.result;
    if (!r) return;
    animateScore(r.score);
    must('over-m').textContent = `${r.metres} m`;
    must('over-coins').textContent = String(r.coins);
    must('over-best').textContent = String(game.bestScore);
    must('over-detail').textContent = `${r.metres} m · ${r.coins} ${r.coins === 1 ? 'coin' : 'coins'} · ${MODE_LABEL[game.mode]} ${S.best(game.bestScore)}`;
    const badge = must('over-new');
    badge.hidden = !r.isNew;
    badge.textContent = S.newBest;
    hooks.announce(`${S.crashed(r.metres, r.coins, r.score)}${r.isNew ? ` ${S.newBest}` : ''}`);
  };

  const sync = (): void => {
    const p = game.phase;
    const want = { title: p === 'title', pause: p === 'paused', over: p === 'over' };
    if (!want.pause && dialogOpen('pause-overlay')) { clearConfirm(); closeDialog(pause); }
    if (!want.title && dialogOpen('title-overlay')) closeDialog(title);
    if (!want.over && dialogOpen('over-overlay')) closeDialog(over);
    if (want.title) { refreshTitle(); openDialog(title, { first: must('title-play') }); }
    if (want.pause) openDialog(pause, { first: must('pause-resume'), onEscape: () => game.resume() });
    if (want.over) { fillOver(); openDialog(over, { first: must('over-retry') }); }
    if (document.activeElement instanceof HTMLElement && !dialogOpen()) document.activeElement.blur();
  };
  return { sync, refreshTitle };
}
