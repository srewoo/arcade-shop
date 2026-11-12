// Shared mutable UI state (one app, one instance) plus the helpers every module needs.
import { CONFIG } from '../config';
import type { Progress } from '../progress';
import type { Run } from '../run';
import type { Settings } from '../settings';
import { $ } from './dom';
import { createFx } from './fx';
import type { InputHandle } from './input';

export interface AppState {
  settings: Settings;
  progress: Progress;
  run: Run | null;
  screen: 'title' | 'game';
  paused: boolean;
  acc: number;
  autoplay: boolean;
  reduced: boolean;
  systemReduced: boolean;
  input: InputHandle | null;
  seed: number;
  resultOpen: boolean;
}

export const fx = createFx();
export const app = {
  settings: null,
  progress: null,
  run: null,
  screen: 'title',
  paused: false,
  acc: 0,
  autoplay: false,
  reduced: false,
  systemReduced: false,
  input: null,
  seed: 1,
  resultOpen: false,
} as unknown as AppState;

/** Politely announce a message to screen readers. */
export function say(text: string): void {
  $('live').textContent = text;
}

export const stepSeconds = CONFIG.sim.step;
