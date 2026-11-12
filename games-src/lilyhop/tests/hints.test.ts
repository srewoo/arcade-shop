import { describe, expect, it } from 'vitest';
import { escalate } from '../src/hints';

describe('two-tier hints', () => {
  it('first press shows the piece and counts as a hint', () => {
    expect(escalate('none')).toEqual({ stage: 'piece', counts: true });
  });
  it('second press reveals the target without a second charge', () => {
    expect(escalate('piece')).toEqual({ stage: 'full', counts: false });
    expect(escalate('full')).toEqual({ stage: 'full', counts: false });
  });
});
