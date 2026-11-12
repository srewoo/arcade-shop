// Keyboard / mouse / touch input (bundle class `Xm`).
//
// Keyboard: Space/ArrowUp/KeyW jump (hold = keep jumping on landing), ArrowDown/KeyS duck, Enter = onJump only
//   (acts as "start/restart"), A/H/M/P/Escape/Left/Right/1-4 forwarded through onKey.  S ducks while running but opens
//   the settings panel and W cycles the environment when `claims(code)` says so (title / game over).
// Mouse: left button = onJump.
// Touch (pointerType !== 'mouse'): a tap jumps; a downward swipe ducks; an upward swipe jumps immediately.
//   A touch is "undecided" until it moves or TAP_DECIDE_MS elapses (then it counts as an early jump).
//   A second finger while one is down jumps.  Ducking from a swipe lasts at least DUCK_MIN_MS.
import { INPUT } from './tuning.js';

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const HOTKEYS = new Set(['KeyA', 'KeyH', 'KeyM', 'KeyP', 'Escape', 'ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4']);
// Thresholds live in tuning.js (INPUT): tap-decide time, swipe distances and the minimum duck length.
const { tapDecideMs: TAP_DECIDE_MS, swipeDownPx: SWIPE_DOWN_PX, swipeUpPx: SWIPE_UP_PX, swipeDownLatePx: SWIPE_DOWN_LATE_PX, duckMinMs: DUCK_MIN_MS } = INPUT;

export class Input {
  constructor() {
    this.onJump = null; // () => void
    this.onKey = null; // (code) => void for the HOTKEYS above and KeyS
    this.claims = () => false; // (code) => boolean: S / W act as hotkeys (settings / environment) instead of duck / jump
    this.jumpHeld = false;
    this._keyDuck = false;
    this._touchDuck = false;
    this._duckUntil = 0;
    this._ptr = null; // active touch pointer
    this._timer = 0;
    window.addEventListener('keydown', (e) => this._keyDown(e));
    window.addEventListener('keyup', (e) => this._keyUp(e));
    window.addEventListener('blur', () => this.release());
    window.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => {
      if (!(e.target instanceof Element && e.target.closest('[data-scroll]'))) e.preventDefault(); // the settings panel scrolls
    }, { passive: false });
  }

  get duck() {
    return this._keyDuck || this._touchDuck || performance.now() < this._duckUntil;
  }

  /** Drop every held key / touch (pause, blur, focus loss). */
  release() {
    this.jumpHeld = false;
    this._keyDuck = false;
    this._touchDuck = false;
    this._ptr = null;
    clearTimeout(this._timer);
  }

  _keyDown(e) {
    if (e.target instanceof HTMLInputElement) return; // typing the leaderboard name
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.code === 'KeyS' || e.code === 'KeyW') && this.claims(e.code)) {
      e.preventDefault();
      if (!e.repeat) this.onKey?.(e.code);
    } else if (JUMP_KEYS.has(e.code) || e.code === 'Enter') {
      // let Space/Enter activate focused buttons natively
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (e.repeat) return;
      if (e.code !== 'Enter') this.jumpHeld = true;
      this.onJump?.();
    } else if (DUCK_KEYS.has(e.code)) {
      e.preventDefault();
      this._keyDuck = true;
    } else if (!e.repeat && HOTKEYS.has(e.code)) {
      this.onKey?.(e.code);
    }
  }

  _keyUp(e) {
    if (JUMP_KEYS.has(e.code)) this.jumpHeld = false;
    else if (DUCK_KEYS.has(e.code)) this._keyDuck = false;
  }

  _down(e) {
    if (e.target instanceof Element && e.target.closest('button, input, form, #board, [data-ui]')) return;
    if (e.pointerType === 'mouse') {
      if (e.button === 0) this.onJump?.();
      return;
    }
    if (this._ptr) {
      this.onJump?.(); // second finger
      return;
    }
    const ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, decided: false, swipe: false };
    this._ptr = ptr;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      if (this._ptr === ptr && !ptr.decided) {
        ptr.decided = true;
        this.onJump?.();
      }
    }, TAP_DECIDE_MS);
  }

  _move(e) {
    const ptr = this._ptr;
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    if (ptr.decided) {
      if (!ptr.swipe && dy > SWIPE_DOWN_LATE_PX && dy > Math.abs(dx)) this._startDuck(ptr);
    } else if (dy > SWIPE_DOWN_PX && dy > Math.abs(dx)) {
      this._startDuck(ptr);
    } else if (dy < SWIPE_UP_PX) {
      ptr.decided = true;
      this.onJump?.();
    }
  }

  _startDuck(ptr) {
    ptr.decided = true;
    ptr.swipe = true;
    this._touchDuck = true;
    this._duckUntil = performance.now() + DUCK_MIN_MS;
  }

  _up(e) {
    const ptr = this._ptr;
    if (!ptr || e.pointerId !== ptr.id) return;
    clearTimeout(this._timer);
    if (!ptr.decided && e.type === 'pointerup') this.onJump?.(); // quick tap released before TAP_DECIDE_MS
    this._touchDuck = false;
    this._ptr = null;
  }
}
