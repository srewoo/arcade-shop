import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/ui/cards', () => ({
  resultCard: () => ({ card: true }), titleCard: () => ({}), pauseCard: () => ({}), confirmCard: () => ({}),
}));

import { feel } from '../src/config/feel';
import { Flow, type FlowDeps } from '../src/flow';
import type { ResultInfo } from '../src/records';

const info: ResultInfo = { mode: 'ultra', status: 'over', score: 10, lines: 1, ticks: 5, pieces: 3, level: 1, seed: 1 };

function make(settingsOpen: { v: boolean }, phase = 'ended') {
  const showResult = vi.fn();
  const deps = {
    session: { phase }, screens: { showResult }, audio: {}, ambient: { halt: vi.fn() }, hud: {},
    controls: { releaseAll: vi.fn() }, book: { commit: () => ({ previous: null, newBest: false }) },
    isSettingsOpen: () => settingsOpen.v,
  } as unknown as FlowDeps;
  return { flow: new Flow(deps), showResult };
}

describe('result card vs the Settings dialog (end-delay race)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { documentElement: { dataset: {} }, getElementById: () => null });
    vi.stubGlobal('window', { setTimeout, clearTimeout });
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('shows the card after the delay when Settings is closed', () => {
    const { flow, showResult } = make({ v: false });
    flow.finish(info);
    vi.advanceTimersByTime(feel.resultDelayMs);
    expect(showResult).toHaveBeenCalledTimes(1);
  });
  it('holds the card while Settings is open and shows it once it closes', () => {
    const open = { v: true };
    const { flow, showResult } = make(open);
    flow.finish(info);
    vi.advanceTimersByTime(feel.resultDelayMs + 5000);
    expect(showResult).not.toHaveBeenCalled();
    open.v = false;
    flow.onSettingsClosed();
    expect(showResult).toHaveBeenCalledTimes(1);
    flow.onSettingsClosed();
    expect(showResult).toHaveBeenCalledTimes(1);
  });
  it('drops a held card if the run was left meanwhile', () => {
    const open = { v: true };
    const { flow, showResult } = make(open);
    flow.finish(info);
    vi.advanceTimersByTime(feel.resultDelayMs);
    flow.cancelResult();
    flow.onSettingsClosed();
    expect(showResult).not.toHaveBeenCalled();
  });
});
