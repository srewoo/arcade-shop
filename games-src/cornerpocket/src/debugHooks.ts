// Test hooks, loaded only with ?debug=1 (dynamic import keeps them out of the normal path).
import type { Fx } from './fx';
import type { Game } from './game';
import type { GameOptions } from './gameTypes';
import { Sfx } from './audio';
import { SFX_NAMES, type SfxName } from './sfxNames';
import type { Settings } from './settings';
import type { View } from './view';

export interface DebugDeps {
  start: (o: GameOptions) => void; fx: Fx; sfx: Sfx; pause: () => void; resume: () => void;
  getGame: () => Game | null; getView: () => View | null; getSettings: () => Settings;
}

/** Render one sound into an OfflineAudioContext and return its peak sample (0..1). */
async function peak(name: SfxName): Promise<number> {
  const off = new OfflineAudioContext(1, 44100 * 2, 44100);
  const s = new Sfx();
  s.useContext(off);
  s.play(name, 3);
  const buf = await off.startRendering();
  let p = 0;
  for (const v of buf.getChannelData(0)) p = Math.max(p, Math.abs(v));
  return p;
}

export function install(d: DebugDeps): void {
  (window as unknown as Record<string, unknown>)['__cp'] = {
    start: d.start, fx: d.fx, pause: d.pause, resume: d.resume, peak, sfxNames: SFX_NAMES,
    get game() { return d.getGame(); },
    get view() { return d.getView(); },
    get settings() { return d.getSettings(); },
  };
}
