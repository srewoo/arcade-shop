import { describe, expect, it } from 'vitest';
import { frameState, groupFrames, isValidRoll, labelFor, scoreFrames, totalScore } from '../src/scoring';

const rep = (n: number, v: number): number[] => Array.from({ length: n }, () => v);

describe('scoring', () => {
  it('scores a perfect game as 300', () => expect(totalScore(rep(12, 10))).toBe(300));
  it('scores all gutters as 0', () => expect(totalScore(rep(20, 0))).toBe(0));
  it('scores nine-and-miss as 90', () => expect(totalScore(rep(10, 0).flatMap(() => [9, 0]))).toBe(90));
  it('scores all 5/ spares with a 5 fill as 150', () => expect(totalScore(rep(21, 5))).toBe(150));
  it('adds a strike bonus of the next two rolls', () => {
    const f = scoreFrames([10, 3, 4]);
    expect(f.map((x) => x.total)).toEqual([17, 24]);
  });
  it('adds a spare bonus of the next roll', () => {
    expect(scoreFrames([6, 4, 5, 2]).map((x) => x.total)).toEqual([15, 22]);
  });
  it('holds the total back while a strike bonus is pending', () => {
    expect(scoreFrames([10, 10]).map((x) => x.total)).toEqual([null, null]);
    expect(scoreFrames([10, 10, 10]).map((x) => x.total)).toEqual([30, null, null]);
  });
  it('scores a known mixed game', () => {
    const rolls = [10, 7, 3, 9, 0, 10, 0, 8, 8, 2, 0, 6, 10, 10, 10, 8, 1];
    expect(totalScore(rolls)).toBe(167);
  });
  it('plays a three-ball tenth after a strike or spare only', () => {
    expect(frameState([...rep(18, 0), 10, 10]).complete).toBe(false);
    expect(frameState([...rep(18, 0), 5, 5]).complete).toBe(false);
    expect(frameState([...rep(18, 0), 5, 4]).complete).toBe(true);
    expect(frameState([...rep(18, 0), 10, 10, 10]).complete).toBe(true);
  });
  it('tracks frame, ball and standing pins', () => {
    expect(frameState([])).toMatchObject({ frame: 1, ball: 1, standing: 10, fresh: true });
    expect(frameState([7])).toMatchObject({ frame: 1, ball: 2, standing: 3, fresh: false });
    expect(frameState([7, 3])).toMatchObject({ frame: 2, ball: 1, standing: 10 });
    expect(frameState([10])).toMatchObject({ frame: 2, ball: 1, standing: 10 });
    expect(frameState([0])).toMatchObject({ frame: 1, ball: 2, standing: 10, fresh: false });
  });
  it('re-racks in the tenth after a strike', () => {
    expect(frameState([...rep(18, 0), 10])).toMatchObject({ frame: 10, ball: 2, standing: 10, fresh: true });
    expect(frameState([...rep(18, 0), 10, 6])).toMatchObject({ ball: 3, standing: 4, fresh: false });
    expect(frameState([...rep(18, 0), 4, 6])).toMatchObject({ ball: 3, standing: 10, fresh: true });
  });
  it('marks X, / and - correctly, including tenth-frame fills', () => {
    const f = scoreFrames([0, 10, ...rep(16, 0), 10, 10, 6]);
    expect(f[0]?.marks).toEqual(['-', '/']);
    expect(f[9]?.marks).toEqual(['X', 'X', '6']);
    expect(scoreFrames([...rep(18, 0), 4, 6, 10])[9]?.marks).toEqual(['4', '/', 'X']);
    expect(scoreFrames([...rep(18, 0), 10, 4, 6])[9]?.marks).toEqual(['X', '4', '/']);
  });
  it('groups rolls into frames', () => {
    expect(groupFrames([10, 3, 4, 10])).toEqual([[10], [3, 4], [10]]);
  });
  it('validates rolls against the rack', () => {
    expect(isValidRoll([7], 4)).toBe(false);
    expect(isValidRoll([7], 3)).toBe(true);
    expect(isValidRoll([], 11)).toBe(false);
    expect(isValidRoll([], 2.5)).toBe(false);
    expect(isValidRoll(rep(20, 0), 1)).toBe(false);
  });
  it('labels rolls', () => {
    expect(labelFor(10, 10, true)).toBe('strike');
    expect(labelFor(3, 3, false)).toBe('spare');
    expect(labelFor(10, 10, false)).toBe('spare');
    expect(labelFor(0, 10, true)).toBe('gutter');
    expect(labelFor(4, 10, true)).toBe('pins');
  });
});
