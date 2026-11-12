// Overlay screens driven by game phase: title/setup, pause, scorecard, settings glue.
import type { Game } from '../game/game';
import { buildScorecard } from '../game/scorecard';
import { relLabel } from '../game/scoring';
import { recordBest } from '../setupStore';
import { S } from '../strings';
import { closeDialog, dialogOpen, openDialog } from './dialogs';
import { must } from './dom';
import { renderCard } from './scorecardView';

export interface ScreenHooks { openSettings: (opener: HTMLElement | null) => void; announce: (t: string) => void; onBest: () => void }

export function createScreens(game: Game, hooks: ScreenHooks): { sync: () => void; openCard: (opener?: HTMLElement | null) => void; closeTop: () => void } {
  const title = must('title-overlay');
  const pause = must('pause-overlay');
  const card = must('card-overlay');
  const confirm = must('pause-confirm');
  let pending: 'restart' | 'quit' | null = null;
  let manualCard = false;
  let bestDone = false;

  const askConfirm = (kind: 'restart' | 'quit'): void => {
    pending = kind;
    must('pause-confirm-text').textContent = kind === 'restart' ? S.confirmRestart : S.confirmQuit;
    confirm.hidden = false;
    must('pause-confirm-no').focus();
  };
  const clearConfirm = (): void => { pending = null; confirm.hidden = true; };

  function fillCard(): void {
    const m = game.match;
    if (!m) return;
    const done = game.phase === 'complete';
    must('card-h').textContent = done ? S.resultsTitle : S.scorecard;
    must('card-sub').textContent = done ? summary() : `${S.hole(m.hole.id)} · ${S.par(m.hole.par)}`;
    renderCard(must('card-table'), buildScorecard(m), m.players, String(m.hole.id));
    const main = must('card-main');
    const alt = must('card-alt');
    const badge = must('card-badge');
    badge.hidden = !(done && bestDone);
    badge.textContent = S.newBest;
    if (done) { main.textContent = S.playAgain; alt.textContent = S.changeSetup; alt.hidden = false; }
    else if (manualCard) { main.textContent = 'Close'; alt.hidden = true; }
    else { main.textContent = m.isLastHole ? S.finish : S.nextHole; alt.hidden = true; }
  }

  function summary(): string {
    const m = game.match;
    if (!m) return '';
    const st = m.standings();
    if (m.players.length === 1) {
      const t = m.total(0);
      return S.solo(t.strokes, relLabel(t.strokes - t.par));
    }
    const names = st.winners.map((i) => m.players[i]?.name ?? '').join(' and ');
    return S.winner(names, Math.min(...st.totals));
  }

  /** Scroll the scorecard so the current hole column is centred (needs the dialog visible). */
  const scrollToCurrent = (): void => {
    const wrap = must('card-table').parentElement;
    const cur = must('card-table').querySelector<HTMLElement>('thead th.cur');
    if (wrap && cur) wrap.scrollLeft = Math.max(0, cur.offsetLeft - wrap.clientWidth / 2 + cur.offsetWidth / 2);
  };
  const showCard = (opener: HTMLElement | null, manual: boolean): void => {
    manualCard = manual;
    fillCard();
    if (!dialogOpen('card-overlay')) openDialog(card, { opener, first: must('card-main'), onEscape: manual ? () => { closeCard(); game.resume(); } : undefined });
    scrollToCurrent();
  };
  const closeCard = (): void => { closeDialog(card); manualCard = false; };
  const openManual = (opener: HTMLElement | null): void => { manualCard = true; game.pause(); showCard(opener, true); };

  title.addEventListener('click', (e) => { if ((e.target as HTMLElement).id === 'title-settings') hooks.openSettings(e.target as HTMLElement); });
  must('pause-resume').addEventListener('click', () => game.resume());
  must('pause-restart').addEventListener('click', () => askConfirm('restart'));
  must('pause-quit').addEventListener('click', () => askConfirm('quit'));
  must('pause-settings').addEventListener('click', (e) => hooks.openSettings(e.currentTarget as HTMLElement));
  must('pause-confirm-no').addEventListener('click', () => { clearConfirm(); must('pause-resume').focus(); });
  must('pause-confirm-yes').addEventListener('click', () => {
    const kind = pending;
    clearConfirm();
    if (kind === 'quit') game.toSetup(); else game.restartMatch();
  });
  must('open-card').addEventListener('click', (e) => openManual(e.currentTarget as HTMLElement));
  must('card-main').addEventListener('click', () => {
    if (game.phase === 'complete') { game.restartMatch(); return; }
    if (manualCard) { closeCard(); game.resume(); return; }
    game.nextHole();
  });
  must('card-alt').addEventListener('click', () => game.toSetup());

  const want = (el: HTMLElement, on: boolean, first: HTMLElement | null, onEscape?: () => void): void => {
    if (on && !dialogOpen(el.id)) openDialog(el, { first, onEscape });
    else if (!on && dialogOpen(el.id)) closeDialog(el);
  };

  function sync(): void {
    const ph = game.phase;
    want(title, ph === 'setup', must('title-play'));
    const showPause = game.paused && !manualCard;
    want(pause, showPause, must('pause-resume'), () => game.resume());
    if (!showPause) clearConfirm();
    if (ph === 'holeDone' || ph === 'complete') {
      if (ph === 'complete' && game.match?.players.length === 1 && !bestDone) {
        const t = game.match.total(0);
        bestDone = recordBest(game.match.setup.course, t.strokes);
        if (bestDone) hooks.onBest();
      }
      showCard(null, false);
    } else if (!manualCard && dialogOpen('card-overlay')) closeCard();
    if (ph !== 'complete') bestDone = false;
    if (manualCard && !game.paused) closeCard();
  }

  return { sync, openCard: (o = null) => openManual(o), closeTop: () => { /* handled by dialog stack */ } };
}
