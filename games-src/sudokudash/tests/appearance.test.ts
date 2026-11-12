import { describe, expect, it } from 'vitest';
import { effectiveReduceMotion } from '../src/ui/appearance';
import { PauseReasons } from './pauseReasons';
import { DASH } from '../src/config/dash';
import { STR, dashRulesLines, hintLabel } from '../src/strings';
import { floatsOnBoard } from '../src/ui/popups';

describe('reduce motion resolution', () => {
  it('System follows the OS, On and Off override it', () => {
    expect(effectiveReduceMotion('system', true)).toBe(true);
    expect(effectiveReduceMotion('system', false)).toBe(false);
    expect(effectiveReduceMotion('on', false)).toBe(true);
    expect(effectiveReduceMotion('off', true)).toBe(false);
  });
});

describe('strings', () => {
  it('has a pause caption for every pause reason', () => {
    for (const r of PauseReasons) expect(STR.pausedReason[r]).toBeTruthy();
  });

  it('the Dash rules text is generated from the live config numbers', () => {
    const text = dashRulesLines().join(' ');
    expect(text).toContain(`${DASH.mistakePenaltySeconds}s`);
    expect(text).toContain(`${DASH.hintPenaltySeconds}s`);
    expect(text).toContain(`x${DASH.maxCombo}`);
    expect(text).toContain(`${DASH.capFactor}x`);
    expect(text).toContain(`${DASH.pointsPerSecondLeft} points per second`);
    expect(text).toContain('3:40');
  });
});

describe('hint label and penalty popups', () => {
  it('shows the Dash time cost on the Hint button, and nothing extra in Classic', () => {
    expect(hintLabel(true)).toBe(`Hint (-${DASH.hintPenaltySeconds}s)`);
    expect(hintLabel(false)).toBe('Hint (H)');
  });

  it('floats only gains over the grid; penalties go to the HUD clock', () => {
    expect(floatsOnBoard(true)).toBe(true);
    expect(floatsOnBoard(false)).toBe(false);
  });
});
