import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTopScores, hasScoreServer } from '../leaderboard.js';

afterEach(() => vi.unstubAllGlobals());

describe('leaderboard inside the arcadeShop extension', () => {
  it('reports offline without making a request', async () => {
    vi.stubGlobal('location', { protocol: 'chrome-extension:' });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(hasScoreServer()).toBe(false);
    expect(await fetchTopScores()).toEqual({ error: 'offline' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still calls the server on the web', async () => {
    vi.stubGlobal('location', { protocol: 'https:' });
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ top: [] }) })));
    expect(hasScoreServer()).toBe(true);
    expect(await fetchTopScores()).toEqual({ top: [] });
  });
});
