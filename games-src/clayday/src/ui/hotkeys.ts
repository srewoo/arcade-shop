// Global keys: Esc and P (pause/resume), M (mute). Aiming keys live in input.ts.
import type { GameState } from '../game';
import { closeTop, isOverlayOpen, topOverlay } from './overlay';

export interface HotkeyActions {
  state(): GameState;
  pause(): void;
  resume(): void;
  toggleSound(): void;
}

/** Overlays that Esc must never dismiss. */
const LOCKED = new Set(['title-overlay', 'result-overlay']);

export function installHotkeys(a: HotkeyActions): void {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const inInput = (e.target as HTMLElement | null)?.tagName === 'INPUT';
    const key = e.key.toLowerCase();
    if (e.key === 'Escape') {
      if (LOCKED.has(topOverlay()?.id ?? '')) return;
      if (isOverlayOpen()) {
        e.preventDefault();
        closeTop();
      } else if (a.state() === 'play') {
        e.preventDefault();
        a.pause();
      }
    } else if (key === 'p' && !inInput) {
      if (a.state() === 'play') a.pause();
      else if (a.state() === 'pause' && topOverlay()?.id === 'pause-overlay') a.resume();
    } else if (key === 'm' && !inInput) {
      a.toggleSound();
    }
  });
}
