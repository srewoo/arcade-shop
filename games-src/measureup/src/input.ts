// Keyboard shortcuts. Dialog keys (Esc, Tab trap) are handled by ui/overlay.
import type { Ctx } from './ctx';
import type { Nav } from './nav';
import type { PlayController } from './play';
import { closeTop, isOverlayOpen, topOverlay } from './ui/overlay';

interface Actions {
  readonly ctx: Ctx;
  readonly nav: Nav;
  readonly play: () => PlayController;
  toggleSound(): void;
}

export function installKeys(a: Actions): void {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'm' && !e.repeat) {
      a.toggleSound();
      return;
    }
    if (isOverlayOpen()) {
      overlayKey(a, e, key);
      return;
    }
    if (a.ctx.screen === 'play') playKey(a, e, key);
    else if (key === 'escape' && a.ctx.screen === 'levels') a.nav.toTitle();
  });
}

function overlayKey(a: Actions, e: KeyboardEvent, key: string): void {
  if (key === 'escape') {
    e.preventDefault();
    closeTop();
  } else if (key === 'p' && topOverlay()?.id === 'pause-overlay') a.nav.resume();
}

function playKey(a: Actions, e: KeyboardEvent, key: string): void {
  const play = a.play();
  if (key === 'escape' || key === 'p') {
    e.preventDefault();
    a.nav.openPause();
  } else if (/^[1-4]$/.test(key)) play.pick(Number(key) - 1);
  else if (e.repeat) return;
  else if (key === 'f') play.fill();
  else if (key === 'e') play.empty();
  else if (key === 'u') play.undo();
  else if (key === 'h') play.hint();
  else if (key === 'r') a.nav.askRestart();
}
