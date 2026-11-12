import { describe, it, expect, beforeEach, vi } from 'vitest';

// The Input class registers listeners on window / document at construction: capture them and replay synthetic events.
const handlers = {};
class FakeElement {
  closest() { return null; }
}
beforeEach(() => {
  for (const k of Object.keys(handlers)) delete handlers[k];
  vi.stubGlobal('Element', FakeElement);
  vi.stubGlobal('HTMLInputElement', class {});
  vi.stubGlobal('HTMLButtonElement', class {});
  vi.stubGlobal('window', { addEventListener: (t, fn) => (handlers[t] = fn) });
  vi.stubGlobal('document', { addEventListener: () => {} });
  vi.useFakeTimers();
});

async function makeInput() {
  const { Input } = await import('../input.js');
  const input = new Input();
  input.onJump = vi.fn();
  input.onKey = vi.fn();
  return input;
}

const down = (x, y, id = 1) => handlers.pointerdown({ target: new FakeElement(), pointerType: 'touch', pointerId: id, clientX: x, clientY: y });
const move = (x, y, id = 1) => handlers.pointermove({ pointerType: 'touch', pointerId: id, clientX: x, clientY: y });
const up = (id = 1) => handlers.pointerup({ type: 'pointerup', pointerId: id });
const key = (code, extra = {}) => handlers.keydown({ code, target: new FakeElement(), preventDefault() {}, ...extra });

describe('touch swipes', () => {
  it('a quick tap jumps once', async () => {
    const input = await makeInput();
    down(100, 100);
    up();
    expect(input.onJump).toHaveBeenCalledTimes(1);
  });
  it('a held touch counts as a jump after the decide time', async () => {
    const input = await makeInput();
    down(100, 100);
    vi.advanceTimersByTime(80);
    expect(input.onJump).toHaveBeenCalledTimes(1);
    up();
    expect(input.onJump).toHaveBeenCalledTimes(1);
  });
  it('a downward swipe ducks (no jump) and holds the duck for the minimum time', async () => {
    const input = await makeInput();
    down(100, 100);
    move(100, 125);
    expect(input.onJump).not.toHaveBeenCalled();
    expect(input.duck).toBe(true);
    up();
    expect(input.duck).toBe(true); // DUCK_MIN_MS keeps it for a moment
  });
  it('an upward swipe jumps immediately', async () => {
    const input = await makeInput();
    down(100, 100);
    move(100, 70);
    expect(input.onJump).toHaveBeenCalledTimes(1);
  });
  it('a second finger jumps', async () => {
    const input = await makeInput();
    down(100, 100, 1);
    down(200, 100, 2);
    expect(input.onJump).toHaveBeenCalledTimes(1);
  });
  it('release() drops every held input (used on pause)', async () => {
    const input = await makeInput();
    key('Space');
    key('ArrowDown');
    expect(input.jumpHeld).toBe(true);
    expect(input.duck).toBe(true);
    input.release();
    expect(input.jumpHeld).toBe(false);
    expect(input.duck).toBe(false);
  });
});

describe('keyboard routing', () => {
  it('sends P and Escape to the hotkey handler and Space to jump', async () => {
    const input = await makeInput();
    key('KeyP');
    key('Escape');
    expect(input.onKey.mock.calls.map((c) => c[0])).toEqual(['KeyP', 'Escape']);
    key('Space');
    expect(input.onJump).toHaveBeenCalledTimes(1);
    key('Space', { repeat: true });
    expect(input.onJump).toHaveBeenCalledTimes(1); // a held key does not re-trigger (no accidental restart)
  });
  it('treats S / W as hotkeys only when claimed', async () => {
    const input = await makeInput();
    key('KeyS');
    expect(input.onKey).not.toHaveBeenCalled();
    expect(input.duck).toBe(true);
    input.claims = () => true;
    key('KeyS');
    expect(input.onKey).toHaveBeenCalledWith('KeyS');
  });
});
