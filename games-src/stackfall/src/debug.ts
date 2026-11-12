// Debug/test hooks, built only when ?debug=1 (or a dev build) asks for them.
import type { AudioEngine } from './audio/engine';
import type { Ambient } from './audio/ambient';
import type { GameState } from './core/state';
import type { Phase } from './session';
import type { Settings } from './settings';
import type { Layout } from './ui/layout';

export interface DebugSources {
  state(): GameState | null;
  phase(): Phase;
  settings(): Settings;
  layout(): Layout;
  profile(): unknown;
  audio: AudioEngine;
  ambient: Ambient;
}

export function debugHandle(src: DebugSources): Record<string, unknown> {
  return {
    state: src.state,
    phase: src.phase,
    settings: src.settings,
    layout: src.layout,
    profile: src.profile,
    audio: () => ({ state: src.audio.state, muted: src.audio.muted, ambientLive: src.ambient.liveCount, ambientRunning: src.ambient.running }),
    measureMix: async () => (await import('./audio/measure')).measureMix(),
  };
}
