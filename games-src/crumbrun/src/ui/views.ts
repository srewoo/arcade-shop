// Pause, confirmation, how-to and game-over panels. Pure DOM builders; the controller wires them.
import { STR } from '../strings';
import { h, whenEnabled } from './dom';
import type { RunResult } from '../flow';
import type { ScoreEntry, Stats } from '../storage';

type Act = () => void;
/** One click handler per button. While `aria-disabled="true"` is set (game over grace period) clicks are ignored. */
const btn = (text: string, onClick: Act, cls = 'btn', extra: Record<string, string> = {}): HTMLButtonElement => {
  const el = h('button', { cls, text, attrs: { type: 'button', ...extra } });
  el.addEventListener('click', whenEnabled(() => el.getAttribute('aria-disabled') === 'true', onClick));
  return el;
};

export interface PauseDeps {
  readonly auto: boolean;
  readonly resume: Act;
  readonly restart: Act;
  readonly settings: Act;
  readonly quit: Act;
}

export function pauseView(d: PauseDeps): HTMLElement {
  const P = STR.pause;
  return h('div', { cls: 'panel' },
    h('h2', { text: P.title }),
    d.auto ? h('p', { cls: 'note', text: P.auto }) : h('span'),
    h('div', { cls: 'stack' },
      btn(P.resume, d.resume, 'btn primary', { 'data-initial': '1' }),
      btn(P.settings, d.settings),
      btn(P.restart, d.restart),
      btn(P.quit, d.quit)),
    h('p', { cls: 'hint', text: P.hint }));
}

export interface ConfirmDeps {
  readonly kind: 'restart' | 'quit';
  readonly yes: Act;
  readonly cancel: Act;
}

/** Destructive actions ask first (in-page, never window.confirm). The safe choice has focus and sits apart. */
export function confirmView(d: ConfirmDeps): HTMLElement {
  const P = STR.pause;
  return h('div', { cls: 'panel' },
    h('h2', { text: d.kind === 'restart' ? P.confirmRestart : P.confirmQuit }),
    h('p', { text: P.confirmBody }),
    h('div', { cls: 'stack gap' },
      btn(P.cancel, d.cancel, 'btn primary', { 'data-initial': '1' }),
      btn(d.kind === 'restart' ? P.yesRestart : P.yesQuit, d.yes, 'btn danger')));
}

export function howToView(): HTMLElement {
  const cards = STR.howTo.cards.map((c) => h('section', { cls: 'card' }, h('h3', { text: c.head }), h('p', { text: c.body })));
  return h('div', { cls: 'panel howto' },
    h('h2', { text: STR.howTo.title }), ...cards,
    h('p', { cls: 'hint', text: STR.howTo.dismiss }));
}

export interface GameOverDeps {
  readonly run: RunResult;
  readonly scores: readonly ScoreEntry[];
  readonly best: Stats;
  readonly again: Act;
  readonly title: Act;
}

function scoreList(scores: readonly ScoreEntry[], current: number): HTMLElement {
  if (scores.length === 0) return h('p', { cls: 'hint', text: STR.gameOver.empty });
  let marked = false;
  const items = scores.map((s) => {
    const mine = !marked && s.score === current;
    if (mine) marked = true;
    const day = s.date.slice(0, 10);
    return h('li', { cls: mine ? 'mine' : '' }, h('span', { text: String(s.score) }), h('span', { cls: 'sub', text: `L${s.level}  ${day}` }));
  });
  return h('ol', { cls: 'scores', attrs: { 'aria-label': STR.gameOver.top5 } }, ...items);
}

export function gameOverView(d: GameOverDeps): HTMLElement {
  const G = STR.gameOver;
  const r = d.run;
  const stat = (k: string, v: string): HTMLElement => h('div', { cls: 'stat' }, h('dt', { text: k }), h('dd', { text: v }));
  const again = btn(G.again, d.again, 'btn primary', { 'data-initial': '1' });
  const title = btn(G.toTitle, d.title);
  // Input is ignored for a moment so a frantic last swipe cannot skip the screen.
  for (const b of [again, title]) b.setAttribute('aria-disabled', 'true');
  window.setTimeout(() => {
    for (const b of [again, title]) b.removeAttribute('aria-disabled');
  }, 700);
  return h('div', { cls: 'panel gameover' },
    h('h2', { text: G.title }),
    r.newHigh ? h('p', { cls: 'badge', text: G.newHigh }) : h('span'),
    h('dl', { cls: 'stats' }, stat(G.score, String(r.score)), stat(G.level, String(r.level)),
      stat(G.splashes, String(r.splashes)), stat(G.chain, String(r.bestChain)),
      stat(G.bestLevel, String(Math.max(d.best.bestLevel, r.level)))),
    h('h3', { text: G.top5 }), scoreList(d.scores, r.score),
    h('div', { cls: 'stack gap row-btns' }, again, title));
}
