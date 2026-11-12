// Test/debug hooks, exposed only with `?debug=1` or in the dev server.
import type { App } from './appState';
import { advance } from './loop';
import { startGame } from './flow';
import { throwNow } from './match';
import { totals } from './match';
import { frameState } from './scoring';

export interface DebugApi {
  state(): Record<string, unknown>;
  bowl(angle: number, power: number, curve: number): void;
  ff(seconds: number): void;
  restart(seed: number): void;
}

export function exposeDebug(a: App): void {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (!enabled) return;
  const api: DebugApi = {
    state: () => {
      const m = a.match;
      return {
        screen: a.screen, phase: m?.phase ?? null, current: m?.current ?? 0, curve: m?.curve ?? 0,
        aim: m ? m.aim.angle : 0, aimSpeed: m ? m.aim.speed : 0, power: m ? m.power.value : 0,
        rolls: m?.players.map((p) => [...p.rolls]) ?? [], frame: m ? frameState(m.players[m.current]?.rolls ?? []) : null,
        totals: m ? totals(m) : [], fishFrames: m ? [...m.fishFrames] : [], settings: a.settings, scores: a.scores,
        paused: !document.getElementById('pause-overlay')?.hidden,
        kinds: m?.world.cats.map((c) => c.kind) ?? [], fish: m?.world.fish ?? null,
      };
    },
    bowl: (angle, power, curve) => { if (a.match) throwNow(a.match, angle, power, curve); },
    ff: (seconds) => advance(a, seconds),
    restart: (seed) => { a.fixedSeed = seed; startGame(a); },
  };
  (window as unknown as { __pp: DebugApi }).__pp = api;
}
