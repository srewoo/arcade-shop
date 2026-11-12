import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { VANISH_LIMIT, VANISH_MOVE_CAP } from '../src/game';

describe('tuning config', () => {
  it('keeps the values the game shipped with (sim behaviour unchanged)', () => {
    expect(CONFIG.cpu.delayMs).toBe(380);
    expect(CONFIG.cpu.mediumBestRate).toBe(0.5);
    expect(CONFIG.ai.vanishDepth).toBe(8);
    expect(CONFIG.rules.vanishLimit).toBe(3);
    expect(CONFIG.rules.vanishMoveCap).toBe(60);
    expect(CONFIG.fx.drawMs).toBe(220);
    expect(CONFIG.fx.strokeStaggerMs).toBe(120);
    expect(CONFIG.audio.cueGain).toBe(0.18);
  });

  it('feeds the rules module', () => {
    expect(VANISH_LIMIT).toBe(CONFIG.rules.vanishLimit);
    expect(VANISH_MOVE_CAP).toBe(CONFIG.rules.vanishMoveCap);
  });

  it('is deeply frozen', () => {
    expect(Object.isFrozen(CONFIG)).toBe(true);
    expect(Object.isFrozen(CONFIG.cpu)).toBe(true);
    expect(Object.isFrozen(CONFIG.stats.milestones)).toBe(true);
  });

  it('keeps the warning threshold inside the move cap', () => {
    expect(CONFIG.rules.vanishWarnAt).toBeLessThan(CONFIG.rules.vanishMoveCap);
  });
});
