// Overlay screens (title, pause, game over) driven by the game phase.
import type { Game, Phase } from '../game';
import { CONFIG } from '../config';
import { isMode, MODES } from '../modes';
import { isUnlocked } from '../scores';
import { MODE_DESC, MODE_LABEL, S } from '../strings';
import { closeDialog, dialogOpen, openDialog } from './dialogs';
import { countUpValue } from './countUp';
import { must } from './dom';

export interface ScreenHooks { openSettings: (opener: HTMLElement | null) => void; setMode: (m: string) => void; announce: (t: string) => void; reduced: () => boolean }

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
      const m = b.dataset.mode;
      const ok = isMode(m) && isUnlocked(m, game.best);
      b.setAttribute('aria-pressed', String(m === game.mode));
      b.setAttribute('aria-disabled', String(!ok));
      b.classList.toggle('locked', !ok);
      if (isMode(m)) b.textContent = ok ? MODE_LABEL[m] : `${MODE_LABEL[m]} (locked)`;
    }
    must('mode-desc').textContent = MODE_DESC[game.mode];
    must('title-best').textContent = game.unlocked
      ? `${MODE_LABEL[game.mode]} ${S.best(game.bestScore)}`
      : `${MODE_LABEL[game.mode]} ${S.best(game.bestScore)} · Two Balls: ${S.locked(CONFIG.twoBalls.unlockScore)}`;
  };
  title.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.mode');
    const m = b?.dataset.mode;
    if (!m || !(MODES as readonly string[]).includes(m)) return;
    if (isMode(m) && !isUnlocked(m, game.best)) { hooks.announce(S.locked(CONFIG.twoBalls.unlockScore)); return; }
    hooks.setMode(m);
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
    if (kind === 'quit') game.toTitle(); else game.start();
  });
  must('over-retry').addEventListener('click', () => game.start());
  must('over-title').addEventListener('click', () => game.toTitle());

  let raf = 0;
  let overTimer = 0;
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
    must('over-tier').textContent = r.tier ?? S.noRank;
    must('over-best').textContent = String(game.bestScore);
    must('over-detail').textContent = `${S.over(r.score, r.tier)} ${MODE_LABEL[game.mode]} ${S.best(game.bestScore)}`;
    const badge = must('over-new');
    badge.hidden = !r.isNew || r.score === 0;
    badge.textContent = S.newBest;
    const un = must('over-unlock');
    un.hidden = !r.unlocked;
    un.textContent = S.unlockedNow;
    hooks.announce(`${S.over(r.score, r.tier)}${r.isNew && r.score > 0 ? ` ${S.newBest}` : ''}${r.unlocked ? ` ${S.unlockedNow}` : ''}`);
  };

  const sync = (): void => {
    const p = game.phase;
    const want = { title: p === 'title', pause: p === 'paused', over: p === 'over' };
    if (!want.pause && dialogOpen('pause-overlay')) { clearConfirm(); closeDialog(pause); }
    if (!want.title && dialogOpen('title-overlay')) closeDialog(title);
    if (!want.over && dialogOpen('over-overlay')) closeDialog(over);
    if (want.title) { refreshTitle(); openDialog(title, { first: must('title-play') }); }
    if (want.pause) openDialog(pause, { first: must('pause-resume'), onEscape: () => game.resume() });
    window.clearTimeout(overTimer);
    if (want.over) {
      // Let the player see where the ball landed before the dialog covers it.
      overTimer = window.setTimeout(() => {
        if (game.phase !== 'over' || dialogOpen('over-overlay')) return;
        fillOver();
        openDialog(over, { first: must('over-retry') });
      }, hooks.reduced() ? 250 : 750);
    }
    if (document.activeElement instanceof HTMLElement && !dialogOpen()) document.activeElement.blur();
  };
  return { sync, refreshTitle };
}
