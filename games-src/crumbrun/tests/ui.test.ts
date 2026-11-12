import { describe, expect, it, vi } from 'vitest';
import { Announcer } from '../src/ui/announcer';
import { trapTarget, whenEnabled } from '../src/ui/dom';
import { isInteractive } from '../src/input';
import { padIntent } from '../src/gamepad';
import { FX_FOR_EVENT } from '../src/fx';
import { SFX_FOR_EVENT } from '../src/sfxMap';
import { Sfx } from '../src/audio';
import { fitScale, logicalSize, MIN_READABLE_CSS_SCALE } from '../src/layout';
import { sized, MIN_LABEL_PX } from '../src/textStyle';
import { setTextScale } from '../src/textStyle';

const EVENT_TYPES = ['crumb', 'sugar', 'pistol', 'splash', 'cheese', 'cheeseSpawn', 'death', 'clear', 'extralife', 'phase',
  'release', 'drenchEnd', 'drenchWarn', 'pounce'] as const;

describe('every event has a sound and a visual decision', () => {
  it('SFX and FX tables cover exactly the event types', () => {
    expect(Object.keys(SFX_FOR_EVENT).sort()).toEqual([...EVENT_TYPES].sort());
    expect(Object.keys(FX_FOR_EVENT).sort()).toEqual([...EVENT_TYPES].sort());
  });
  it('every named sound exists on Sfx', () => {
    for (const names of Object.values(SFX_FOR_EVENT)) {
      for (const n of names) expect(typeof (Sfx.prototype as unknown as Record<string, unknown>)[n]).toBe('function');
    }
  });
  it('only crumbs and sugar are allowed to share the quiet squeak; the other events are audible', () => {
    const silent = Object.entries(SFX_FOR_EVENT).filter(([, v]) => v.length === 0).map(([k]) => k);
    expect(silent).toEqual([]);
  });
});

describe('Sfx respects mute and volume', () => {
  it('does nothing (and never throws) before unlock or while muted', () => {
    const s = new Sfx();
    expect(() => { s.squeak(); s.splash(); s.gameOver(); s.bass(0.5); }).not.toThrow();
    s.setMuted(true);
    s.setVolume(0);
    expect(s.muted).toBe(true);
    expect(s.volume).toBe(0);
    s.setVolume(7);
    expect(s.volume).toBe(1);
  });
});

describe('Announcer rate limit', () => {
  function make() {
    let t = 0;
    const out: string[] = [];
    const queue: { fn: () => void; at: number }[] = [];
    const a = new Announcer({ set: (s) => out.push(s.trim()), now: () => t, later: (fn, ms) => queue.push({ fn, at: t + ms }) }, 900);
    const advance = (ms: number): void => {
      t += ms;
      for (const q of queue.splice(0).filter((x) => { if (x.at <= t) { x.fn(); return false; } return true; })) queue.push(q);
    };
    return { a, out, advance };
  }
  it('speaks the first message at once and defers a burst to the latest one', () => {
    const { a, out, advance } = make();
    a.say('one');
    a.say('two');
    a.say('three');
    expect(out).toEqual(['one']);
    advance(1000);
    expect(out).toEqual(['one', 'three']);
  });
  it('urgent messages bypass the limit and cancel the pending one', () => {
    const { a, out, advance } = make();
    a.say('a');
    a.say('b');
    a.say('game over', true);
    expect(out).toEqual(['a', 'game over']);
    advance(2000);
    expect(out).toEqual(['a', 'game over']);
  });
  it('alternates trailing space so an identical message is re-announced', () => {
    let t = 0;
    const raw: string[] = [];
    const a = new Announcer({ set: (s) => raw.push(s), now: () => t, later: vi.fn() }, 100);
    a.say('x');
    t = 500;
    a.say('x');
    expect(raw[0]).not.toBe(raw[1]);
  });
});

describe('focus trap', () => {
  const mk = (n: number): HTMLElement[] => Array.from({ length: n }, (_, i) => ({ id: String(i) }) as unknown as HTMLElement);
  it('wraps forward from the last and backward from the first', () => {
    const l = mk(3);
    expect(trapTarget(l, l[2] as Element, false)).toBe(l[0]);
    expect(trapTarget(l, l[0] as Element, true)).toBe(l[2]);
  });
  it('lets the browser move focus inside the list, and pulls stray focus in', () => {
    const l = mk(3);
    expect(trapTarget(l, l[1] as Element, false)).toBeNull();
    expect(trapTarget(l, null, false)).toBe(l[0]);
    expect(trapTarget(l, null, true)).toBe(l[2]);
    expect(trapTarget([], null, false)).toBeNull();
  });
});

describe('Enter on a focused button', () => {
  it('is treated as interactive so the game does not hijack it', () => {
    const el = (match: boolean): EventTarget => ({ closest: () => (match ? {} : null) }) as unknown as EventTarget;
    expect(isInteractive(el(true))).toBe(true);
    expect(isInteractive(el(false))).toBe(false);
    expect(isInteractive(null)).toBe(false);
  });
});

describe('gamepad intent', () => {
  const snap = (pressed: number[] = [], axes: number[] = [0, 0]) => ({
    buttons: Array.from({ length: 17 }, (_, i) => pressed.includes(i)), axes,
  });
  it('maps the d-pad and the stick to directions', () => {
    expect(padIntent(null, snap([12])).dir).toBe('U');
    expect(padIntent(null, snap([15])).dir).toBe('R');
    expect(padIntent(null, snap([], [-0.9, 0.2])).dir).toBe('L');
    expect(padIntent(null, snap([], [0.2, 0.9])).dir).toBe('D');
    expect(padIntent(null, snap([], [0.3, 0.3])).dir).toBeNull();
  });
  it('A and Start fire once per press, not while held', () => {
    const a = snap([0, 9]);
    expect(padIntent(null, a)).toMatchObject({ action: true, pause: true });
    expect(padIntent(a, a)).toMatchObject({ action: false, pause: false });
  });
});

describe('viewport fit', () => {
  const size = logicalSize({ cols: 21, rows: 23 });
  it('fills a 1280x800 desktop window instead of stopping at an integer scale', () => {
    const f = fitScale(1280, 748, 1, size);
    expect(f.cssH).toBeGreaterThanOrEqual(748 * 0.9);
    expect(f.cssH).toBeLessThanOrEqual(748);
    expect(f.scale).toBeGreaterThan(1.4);
  });
  it('fills a 1920x1080 window', () => {
    const f = fitScale(1920, 1028, 1, size);
    expect(f.cssH).toBeGreaterThanOrEqual(1028 * 0.9);
    expect(f.cssH).toBeLessThanOrEqual(1028);
    expect(f.scale).toBeGreaterThan(2);
  });
  it('caps the pixel ratio at 2 and the scale at 5', () => {
    expect(fitScale(1000, 1000, 3, size).cssW).toBe(fitScale(1000, 1000, 2, size).cssW);
    expect(fitScale(9000, 9000, 1, size).scale).toBe(5);
  });
  it('a landscape phone (860x400, controls in side columns) keeps >= 85% of the height', () => {
    const f = fitScale(860 - 196 - 70, 400, 1, size);
    expect(f.cssH).toBeGreaterThanOrEqual(400 * 0.85);
    expect(f.tooSmall).toBe(false);
  });
  it('flags a board that would be too small to read', () => {
    const f = fitScale(200, 200, 1, size);
    expect(f.cssScale).toBeLessThan(MIN_READABLE_CSS_SCALE);
    expect(f.tooSmall).toBe(true);
  });
  it('never exceeds the available space and survives zero sizes', () => {
    for (const [w, h, d] of [[400, 860, 1], [400, 860, 2], [378, 300, 1.5], [1280, 748, 1]] as const) {
      const f = fitScale(w, h, d, size);
      expect(f.cssW).toBeLessThanOrEqual(w);
      expect(f.cssH).toBeLessThanOrEqual(h);
    }
    const zero = fitScale(0, 0, 1, size);
    expect(Number.isFinite(zero.scale) && zero.pxW >= 1 && zero.pxH >= 1).toBe(true);
  });
  it('portrait phone 400x860 uses the full width', () => {
    const f = fitScale(400, 700, 1, size);
    expect(f.cssW).toBeGreaterThanOrEqual(398);
  });
});

describe('text size', () => {
  it('never draws below 12 logical px and scales with the setting', () => {
    setTextScale(1);
    expect(sized(7)).toBe(MIN_LABEL_PX);
    expect(sized(30)).toBe(30);
    setTextScale(1.5);
    expect(sized(12)).toBe(18);
    setTextScale(9);
    expect(sized(12)).toBe(24);
    setTextScale(1);
  });
  it('at 400 px wide (scale ~1.06) the smallest label is at least 12 css px', () => {
    setTextScale(1);
    const css = fitScale(400, 800, 1, logicalSize({ cols: 21, rows: 23 })).cssScale * sized(1);
    expect(css).toBeGreaterThanOrEqual(12);
  });
});

describe('whenEnabled (game over button guard)', () => {
  it('ignores clicks while disabled and runs the action once enabled, exactly once per click', () => {
    let locked = true;
    const act = vi.fn();
    const handler = whenEnabled(() => locked, act);
    handler(); handler();
    expect(act).not.toHaveBeenCalled();
    locked = false;
    handler();
    expect(act).toHaveBeenCalledTimes(1);
  });
});
