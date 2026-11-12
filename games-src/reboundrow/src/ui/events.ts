// Turns simulation events into sound, particles and screen-reader text.
import { emitSfx } from '../audio';
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import { comboMultiplier } from '../sim/scoring';
import type { GameEvent, World } from '../sim/world';
import { S } from '../strings';
import { fx, say } from './state';

export interface EventHooks { onClear(): void; onOver(): void; onLaunch(): void }

function brickColor(ev: GameEvent): string {
  const row = Math.max(0, Math.floor((ev.y - CONFIG.field.top) / CONFIG.field.brickH));
  return PALETTE.rows[row % PALETTE.rows.length] as string;
}

const comboTag = (ev: GameEvent): string => {
  const m = comboMultiplier(ev.combo ?? 0);
  return m > 1 ? ` x${m}` : '';
};

function handle(ev: GameEvent, w: World, hooks: EventHooks): void {
  switch (ev.type) {
    case 'wall': return void emitSfx('wall');
    case 'paddle':
      fx.squashPaddle();
      return void emitSfx('paddle');
    case 'steel': return void emitSfx('steel');
    case 'hit':
      fx.burst(ev.x, ev.y, PALETTE.steel, 4);
      fx.hitFlash(ev.x, ev.y);
      return void emitSfx('hit', 1 + Math.min(ev.combo ?? 0, 12) * 0.04);
    case 'break':
      fx.burst(ev.x, ev.y, brickColor(ev));
      fx.ring(ev.x, ev.y, brickColor(ev));
      fx.hitFlash(ev.x, ev.y);
      fx.popup(ev.x, ev.y, `+${ev.points ?? 0}${comboTag(ev)}`, brickColor(ev));
      if ((ev.combo ?? 0) >= 5) fx.nudge();
      return void emitSfx('break', 1 + Math.min(ev.combo ?? 0, 12) * 0.05);
    case 'catch':
    case 'multi': {
      emitSfx(ev.type === 'multi' ? 'multi' : 'catch');
      if (ev.kind) {
        say(S.announce.catch(S.power[ev.kind]));
        fx.popup(ev.x, ev.y - 16, S.power[ev.kind], PALETTE.power[ev.kind]);
      }
      return;
    }
    case 'laser': return void emitSfx('laser');
    case 'launch':
      emitSfx('launch');
      return hooks.onLaunch();
    case 'life':
      emitSfx('life');
      fx.popup(ev.x, ev.y - 40, S.extraLife, PALETTE.heart);
      return say(S.announce.life);
    case 'lost':
      emitSfx('lost');
      fx.kick();
      if (w.lives > 0) fx.announce(S.ballLost(w.lives), PALETTE.heart);
      return say(S.announce.lost(w.lives));
    case 'clear':
      emitSfx('clear');
      fx.confetti(w.field.w, w.field.h);
      fx.announce(S.cleared, PALETTE.confetti[1]);
      say(S.announce.cleared(w.score));
      return hooks.onClear();
    case 'over':
      emitSfx('over');
      fx.announce(S.gameOver, PALETTE.heart);
      return hooks.onOver();
  }
}

export function drainEvents(w: World, hooks: EventHooks): void {
  const events = w.events.splice(0, w.events.length);
  for (const ev of events) handle(ev, w, hooks);
}
