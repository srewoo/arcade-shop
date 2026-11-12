// Standard ten-pin scoring (strikes, spares, three-ball tenth frame). Pure.
import { CONFIG } from './config';
import { sum } from './util';

const LAST = CONFIG.frames.count;
const PINS = 10;

export interface FrameState {
  /** 1-based frame about to be bowled (LAST when finished). */
  readonly frame: number;
  /** 1-based ball within the frame. */
  readonly ball: number;
  /** Pins standing before the next roll. */
  readonly standing: number;
  readonly complete: boolean;
  /** The next roll faces a freshly set rack (a strike/spare there is a "strike"). */
  readonly fresh: boolean;
}

export interface FrameScore {
  readonly rolls: readonly number[];
  readonly marks: readonly string[];
  /** Running total through this frame, or null while a bonus is pending. */
  readonly total: number | null;
}

/** Split a flat roll list into per-frame groups (the tenth holds up to three). */
export function groupFrames(rolls: readonly number[]): number[][] {
  const frames: number[][] = [];
  let i = 0;
  while (frames.length < LAST - 1 && i < rolls.length) {
    const take = rolls[i] === PINS ? 1 : 2;
    frames.push(rolls.slice(i, i + take));
    i += take;
  }
  if (frames.length === LAST - 1 && i < rolls.length) frames.push(rolls.slice(i, i + 3));
  return frames;
}

interface Rack {
  readonly standing: number;
  /** True when the next roll faces a full, freshly set rack. */
  readonly fresh: boolean;
  readonly marks: string[];
  /** Number of rolls that cleared the rack (strike or spare). */
  readonly clears: number;
}

/** Replay a frame's rolls, tracking the rack so X, / and tenth-frame fills read right. */
function replay(group: readonly number[]): Rack {
  let standing = PINS;
  let fresh = true;
  let clears = 0;
  const marks = group.map((pins) => {
    const cleared = pins === standing;
    const mark = cleared ? (fresh ? 'X' : '/') : pins === 0 ? '-' : String(pins);
    standing = cleared ? PINS : standing - pins;
    fresh = cleared;
    clears += cleared ? 1 : 0;
    return mark;
  });
  return { standing, fresh, marks, clears };
}

function tenthStanding(r: readonly number[]): { standing: number; complete: boolean; fresh: boolean } {
  const rack = replay(r);
  const complete = r.length >= 3 || (r.length === 2 && rack.clears === 0);
  return { standing: complete ? 0 : rack.standing, complete, fresh: rack.fresh };
}

/** Where the game is after these rolls. */
export function frameState(rolls: readonly number[]): FrameState {
  const frames = groupFrames(rolls);
  const done = frames.length;
  const lastGroup = frames[done - 1];
  if (done < LAST) {
    if (lastGroup !== undefined && lastGroup.length === 1 && lastGroup[0] !== PINS) {
      return { frame: done, ball: 2, standing: PINS - (lastGroup[0] as number), complete: false, fresh: false };
    }
    return { frame: done + 1, ball: 1, standing: PINS, complete: false, fresh: true };
  }
  const group = lastGroup ?? [];
  return { frame: LAST, ball: group.length + 1, ...tenthStanding(group) };
}

/** Is `pins` a legal next roll? */
export function isValidRoll(rolls: readonly number[], pins: number): boolean {
  const st = frameState(rolls);
  return Number.isInteger(pins) && pins >= 0 && !st.complete && pins <= st.standing;
}

/** Bonus-aware scoring for every frame bowled so far. */
export function scoreFrames(rolls: readonly number[]): FrameScore[] {
  const groups = groupFrames(rolls);
  let running = 0;
  let offset = 0;
  return groups.map((group, idx) => {
    const tenth = idx === LAST - 1;
    const next = (n: number): number | undefined => rolls[offset + group.length + n];
    let points: number | null = sum(group);
    if (!tenth && group[0] === PINS) points = next(0) !== undefined && next(1) !== undefined ? PINS + (next(0) as number) + (next(1) as number) : null;
    else if (!tenth && sum(group) === PINS) points = next(0) !== undefined ? PINS + (next(0) as number) : null;
    else if (!tenth && group.length < 2) points = null;
    offset += group.length;
    running = points === null || running === -1 ? -1 : running + points;
    return { rolls: group, marks: replay(group).marks, total: running === -1 ? null : running };
  });
}

export const totalScore = (rolls: readonly number[]): number =>
  scoreFrames(rolls).reduce<number>((best, f) => f.total ?? best, 0);

export type RollLabel = 'strike' | 'spare' | 'gutter' | 'pins';

/** Describe a roll that knocked `pins` when `standingBefore` were up. */
export function labelFor(pins: number, standingBefore: number, fresh: boolean): RollLabel {
  if (pins === 0) return 'gutter';
  if (pins === standingBefore) return fresh ? 'strike' : 'spare';
  return 'pins';
}
