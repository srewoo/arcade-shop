// Player actions during a level: pick, cross, undo, hint, restart, finish.
import { emit } from '../audio';
import { CONFIG } from '../config';
import { carrierBank } from '../puzzle/engine';
import { solve } from '../puzzle/solver';
import { recordResult, saveProgress } from '../progress';
import type { Session } from '../session';
import { S } from '../strings';
import { anyModalOpen, confirmAction } from '../ui/dialogs';
import { confetti, motionOn, shake } from '../ui/fx';
import { namesOf, refresh, say, type App } from './app';

const live = (app: App): Session | null =>
  app.session && app.shell.view() === 'play' && !anyModalOpen() ? app.session : null;

export function pick(app: App, i: number): void {
  const s = live(app);
  if (!s) return;
  const r = s.toggle(i);
  app.hint = [];
  if (r === 'selected') emit('select');
  else if (r === 'deselected') emit('deselect');
  else if (r !== 'locked') { emit('error'); shake(app.scene.root); }
  if (r === 'wrong-side') app.hud.status(S.status.wrongSide, 'bad');
  else if (r === 'full') app.hud.status(S.status.full(s.level.capacity), 'bad');
  else app.hud.status(s.selected().length ? S.status.picked(namesOf(s.level, s.selected())) : S.status.start);
  refresh(app, false);
}

export function cross(app: App): void {
  const s = live(app);
  if (!s || s.outcome() !== 'playing') return;
  const group = [...s.selected()];
  const res = s.cross();
  app.hint = [];
  if (!res.ok) {
    const text = res.reason === 'rule' && res.rule ? `${S.fail.rule} ${res.rule.text}` : S.fail[res.reason];
    app.hud.status(text, 'bad');
    say(app, text);
    emit('error');
    shake(app.scene.root);
    return;
  }
  emit('cross');
  emit('clink', 0.6);
  refresh(app, true);
  afterMove(app, s, group);
}

function afterMove(app: App, s: Session, group: readonly number[]): void {
  const st = s.state();
  const lastCost = s.level.pack === 'bridge' ? Math.max(...group.map((g) => s.level.actors[g]?.time ?? 0)) : 0;
  const done = S.status.crossed(namesOf(s.level, group), lastCost, s.level.pack);
  const out = s.outcome();
  if (out === 'playing') {
    if (s.stuck()) { app.hud.status(S.status.stuck, 'bad'); say(app, S.status.stuck); return; }
    const back = st.carrierAtStart ? '' : ` ${s.level.pack === 'bridge' ? S.status.lanternBack : S.status.raftBack}`;
    app.hud.status(done + back);
    return;
  }
  app.hud.status(done);
  if (out === 'won') {
    app.progress = recordResult(app.progress, s.level.id, s.stars(), st.cost);
    saveProgress(app.progress);
  }
  let delay = CONFIG.fx.moveMs + 450;
  if (out === 'won') {
    // Let the scene pay off first: lamp glow, hop and confetti, then the card.
    emit('win');
    confetti(app.scene.root.querySelector<HTMLElement>('.confetti') ?? app.scene.root);
    delay = motionOn() ? CONFIG.fx.winDelayMs : CONFIG.fx.reducedWinDelayMs;
  }
  app.resultTimer = window.setTimeout(() => finish(app, s), delay);
}

function finish(app: App, s: Session): void {
  if (app.session !== s || anyModalOpen()) return;
  const st = s.state();
  const won = s.outcome() === 'won';
  if (!won) emit('lose');
  say(app, won ? S.announce.won(s.stars()) : S.announce.lost);
  app.hud.status(won ? S.result.won : S.announce.lost, won ? 'info' : 'bad');
  const hasNext = !!app.ctx && app.ctx.index + 1 < app.ctx.levels.length;
  app.dlg.result.show({ level: s.level, won, cost: st.cost, moves: st.moves, stars: s.stars(), hinted: s.hintsUsed() > 0, hasNext });
  app.dlg.result.modal.open();
}

export function showRoute(app: App): void {
  if (!app.session) return;
  app.dlg.route.show(app.session.level, solve(app.session.level)?.path ?? []);
  app.dlg.route.modal.open();
}

export function undo(app: App): void {
  const s = live(app);
  if (!s || !s.undo()) return;
  window.clearTimeout(app.resultTimer);
  app.hint = [];
  emit('undo');
  app.hud.status(S.status.undone);
  refresh(app, true);
}

export function giveHint(app: App): void {
  const s = live(app);
  if (!s || s.outcome() !== 'playing') return;
  const g = s.hint();
  if (!g) { app.hud.status(S.status.noHint, 'bad'); emit('error'); return; }
  const text = S.status.hint(namesOf(s.level, g));
  app.hint = g;
  emit('hint');
  app.hud.status(text);
  say(app, text);
  refresh(app, false);
}

/** Restart the attempt; confirms first when there is progress to lose. */
export async function restart(app: App): Promise<boolean> {
  const s = app.session;
  if (!s) return false;
  const fresh = s.log().length === 0 && s.selected().length === 0;
  if (!fresh && !(await confirmAction(S.confirm.restart, S.pause.restart))) return false;
  window.clearTimeout(app.resultTimer);
  s.restart();
  app.hint = [];
  emit('click');
  app.hud.status(S.status.start);
  refresh(app, false);
  return true;
}

export function resetCurrent(app: App): void {
  app.session?.restart();
  app.hint = [];
  refresh(app, false);
}

export const bankOf = (s: Session): number => carrierBank(s.level, s.state());
