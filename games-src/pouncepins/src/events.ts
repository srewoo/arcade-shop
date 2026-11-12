// Turns match events into sound, particles, banners and screen-reader announcements.
import type { App } from './appState';
import { isReduced } from './appState';
import { emit } from './audio';
import { CONFIG } from './config';
import type { GameEvent, RollResult } from './match';
import { addBubble, burst } from './render/fx';
import { S } from './strings';
import { showBanner } from './ui/controls';
import { flyScore } from './ui/fly';
import { at } from './util';

const say = (a: App, text: string): void => { a.els.live.textContent = text; };

function catSpot(a: App, id: number): { x: number; y: number } {
  const c = a.match?.world.cats[id];
  return { x: c?.x ?? 0, y: c?.y ?? 0 };
}

function onResult(a: App, r: RollResult): void {
  const reduce = isReduced(a);
  const name = a.match?.players[r.player]?.name ?? '';
  const prefix = (a.match?.players.length ?? 1) > 1 ? `${name}: ` : '';
  let text: string = S.pins(r.pins);
  if (r.label === 'strike') {
    text = S.strike; emit('strike');
    burst(a.fx, 'confetti', 1250, 0, reduce);
    if (!reduce) a.fx.shake = 1;
  } else if (r.label === 'spare') {
    text = S.spare; emit('spare');
    burst(a.fx, 'sparkle', 1250, 0, reduce);
  } else if (r.label === 'gutter') {
    text = r.pins === 0 && a.match?.world.ball.gutter ? S.gutter : S.miss; emit('gutter');
  }
  showBanner(a.els, text, (r.label === 'strike' ? CONFIG.flow.strikeSecs : CONFIG.flow.resultSecs) * 800);
  const rolls = a.match?.players[r.player]?.rolls ?? [];
  flyScore(a.els.board, a.els.banner, r.player, rolls, r.pins, reduce);
  say(a, prefix + text);
}

/** Handle one match event. */
export function handleEvent(a: App, e: GameEvent): void {
  const reduce = isReduced(a);
  switch (e.type) {
    case 'aimLock': emit('lock'); break;
    case 'throw': a.hitSounds = 0; emit('throw'); emit('roll', 0.05); break;
    case 'hit': {
      const p = catSpot(a, e.id);
      if (a.hitSounds++ < 5) emit('hit', 0, 0.8 + (e.id % 4) * 0.12);
      burst(a.fx, 'fluff', p.x, p.y, reduce);
      if (!reduce) a.fx.shake = Math.max(a.fx.shake, 0.35);
      break;
    }
    case 'wobble': emit('wobble', 0, 0.9 + (e.id % 3) * 0.1); break;
    case 'scare': {
      emit('scare', 0, 0.9 + (e.id % 3) * 0.1);
      const p = catSpot(a, e.id);
      addBubble(a.fx, p.x, p.y, 'Eek!');
      break;
    }
    case 'land': case 'cushion': {
      const p = catSpot(a, e.id);
      emit(e.type === 'cushion' ? 'cushion' : 'hit', 0, 1);
      emit('yowl', 0.04, 0.8 + ((e.id * 37) % 7) / 10);
      addBubble(a.fx, p.x, p.y, at(S.yowls, (e.id + (a.match?.throwNo ?? 0)) % S.yowls.length));
      if (e.type === 'cushion') burst(a.fx, 'fluff', p.x, p.y, reduce);
      break;
    }
    case 'fish': emit('fish'); burst(a.fx, 'sparkle', a.match?.world.fish?.x ?? 600, a.match?.world.fish?.y ?? 0, reduce); say(a, S.fishGot); break;
    case 'gutter': break;
    case 'result': onResult(a, e.result); break;
    case 'frameStart': say(a, `${S.frame} ${e.frame}. ${a.match?.players[e.player]?.name ?? ''}`); break;
    case 'over': emit('over'); break;
  }
}

/** Drain and handle everything the match queued. */
export function drainEvents(a: App): void {
  const m = a.match;
  if (!m) return;
  const list = m.events.splice(0, m.events.length);
  for (const e of list) handleEvent(a, e);
}
