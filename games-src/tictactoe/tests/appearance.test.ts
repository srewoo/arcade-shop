import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/settings';
import { applyAppearance, applyFxVars, isReducedMotion } from '../src/ui/appearance';
import { createArmed } from '../src/ui/armed';

const fakeRoot = () => {
  const props: Record<string, string> = {};
  return { dataset: {} as Record<string, string>, style: { setProperty: (k: string, v: string) => (props[k] = v) }, props };
};

describe('reduce motion', () => {
  it('System follows the OS, On/Off override it', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });

  it('is written to the root element with the other appearance settings', () => {
    const root = fakeRoot();
    applyAppearance({ ...DEFAULT_SETTINGS, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'dark' }, false, root as never);
    expect(root.dataset).toMatchObject({ motion: 'reduce', assist: 'on', text: '150', theme: 'dark' });
    applyAppearance(DEFAULT_SETTINGS, false, root as never);
    expect(root.dataset).toMatchObject({ motion: 'full', assist: 'off', text: '100' });
    expect(root.dataset.theme).toBeUndefined();
  });

  it('exports CSS timings from the config', () => {
    const root = fakeRoot();
    applyFxVars(root as never);
    expect(root.props['--draw-ms']).toBe('220ms');
    expect(root.props['--win-delay']).toBe('340ms');
  });
});

describe('armed confirmation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('arms, then disarms itself after the timeout', () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) });
    let changes = 0;
    const armed = createArmed(3000, () => (changes += 1));
    armed.arm();
    expect(armed.armed).toBe(true);
    vi.advanceTimersByTime(2999);
    expect(armed.armed).toBe(true);
    vi.advanceTimersByTime(2);
    expect(armed.armed).toBe(false);
    expect(changes).toBe(2);
    armed.arm();
    armed.disarm();
    expect(armed.armed).toBe(false);
    vi.useRealTimers();
  });
});
