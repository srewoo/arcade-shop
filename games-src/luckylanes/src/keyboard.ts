// Keyboard controls. Overlays handle their own keys; here a form control with focus keeps Space/Enter.
import type { Game } from './game';
import { TUNING } from './tuning';

export interface KeyHandlers {
  /** An overlay (menu, pause, settings, results) is open. */
  isBlocked(): boolean;
  toggleMute(): void;
  unlockAudio(): void;
  /** P: open the pause overlay, or resume if it is already open. */
  togglePause(): void;
  /** Esc during play: open the pause overlay. */
  openPause(): void;
  /** A slide key was pressed (not auto-repeat): play the tap cue. */
  slideCue(): void;
}

const isFormControl = (t: EventTarget | null): boolean => t instanceof HTMLElement && ['BUTTON', 'SELECT', 'INPUT', 'SUMMARY'].includes(t.tagName);
/** Elements where letters are typing or type-ahead, not shortcuts. */
const isTyping = (t: EventTarget | null): boolean => t instanceof HTMLElement && ['SELECT', 'INPUT', 'TEXTAREA'].includes(t.tagName);
const isLeft = (k: string): boolean => k === 'ArrowLeft' || k === 'a' || k === 'A';
const isRight = (k: string): boolean => k === 'ArrowRight' || k === 'd' || k === 'D';

export function bindKeyboard(game: Game, h: KeyHandlers): void {
  const nudge = TUNING.timing.nudgeCm;
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    h.unlockAudio();
    const k = e.key;
    const control = isFormControl(e.target);
    if ((k === 'm' || k === 'M') && !isTyping(e.target)) { h.toggleMute(); return; }
    if ((k === 'p' || k === 'P') && !isTyping(e.target) && !e.repeat) { h.togglePause(); return; }
    if (h.isBlocked()) return;
    if (k === 'Escape') { if (!e.repeat) h.openPause(); e.preventDefault(); }
    else if (isLeft(k)) { game.hold = -1; if (!e.repeat) { game.nudge(-nudge); h.slideCue(); } e.preventDefault(); }
    else if (isRight(k)) { game.hold = 1; if (!e.repeat) { game.nudge(nudge); h.slideCue(); } e.preventDefault(); }
    else if ((k === ' ' || k === 'Enter') && !control) { if (!e.repeat) (game.humanTurn ? game.confirm() : game.skip()); e.preventDefault(); }
    else if (k === 'Backspace' && !control) { game.back(); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if ((isLeft(e.key) && game.hold === -1) || (isRight(e.key) && game.hold === 1)) game.hold = 0;
  });
  window.addEventListener('blur', () => { game.hold = 0; });
}
