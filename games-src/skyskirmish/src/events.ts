// Turns simulation events into sound, effects, banners and screen-reader announcements.
import { A } from './appState';
import { emit, type Sfx } from './audio';
import { explodeAt, fxHandle } from './fx';
import { systemPrefersReduced } from './appearance';
import { motionReduced } from './settings';
import { S } from './strings';
import type { GameState, SimEvent } from './types';

let shots = 0;
let hitSounds = 0;

export function announce(text: string): void {
  const node = document.getElementById('status');
  if (node) node.textContent = text;
}

export const reduced = (): boolean => motionReduced(A.settings, systemPrefersReduced());

function sound(e: SimEvent): Sfx | null {
  switch (e.type) {
    case 'shot': return ++shots % 3 === 0 ? 'shot' : null;
    case 'hit': return ++hitSounds % 2 === 0 ? 'hit' : null;
    case 'hurt': return 'hurt';
    case 'kill': return e.big ? 'bigBoom' : 'boom';
    case 'pickup': return 'pickup';
    case 'bomb': return 'bomb';
    case 'shieldBreak': return 'shield';
    case 'multUp': return 'multUp';
    case 'wave': return e.boss ? 'boss' : 'wave';
    case 'down': return 'lose';
    case 'win': return 'win';
    case 'waveClear': return null;
    default: return null;
  }
}

function narrate(e: SimEvent, g: GameState): void {
  if (e.type === 'wave') {
    A.banner = { text: e.boss ? S.bossBanner : S.waveBanner(e.index), t: 1.8 };
    announce(e.boss ? S.bossBanner : S.waveBanner(e.index));
  } else if (e.type === 'waveClear') A.banner = { text: S.waveClear(e.index, e.bonus), t: 1.4 };
  else if (e.type === 'hurt') announce(S.live.hit(g.player.lives));
  else if (e.type === 'shieldBreak') announce(S.live.shield);
  else if (e.type === 'pickup') announce(S.live.pickup[e.kind]);
  else if (e.type === 'bomb') announce(S.live.bomb);
  else if (e.type === 'multUp') announce(S.live.mult(e.mult));
}

/** Consume and clear the events the last sim steps produced. */
export function handleEvents(g: GameState): void {
  if (g.events.length === 0) return;
  const events = g.events;
  g.events = [];
  fxHandle(A.fx, events, reduced());
  for (const e of events) {
    if (e.type === 'down') explodeAt(A.fx, g.player.x, g.player.y, reduced());
    if (e.type === 'win') explodeAt(A.fx, g.player.x, g.player.y - 120, reduced());
  }
  for (const e of events) {
    const cue = sound(e);
    if (cue) emit(cue);
    narrate(e, g);
  }
}

export function tickBanner(dt: number): void {
  if (!A.banner) return;
  A.banner.t -= dt;
  if (A.banner.t <= 0) A.banner = null;
}
