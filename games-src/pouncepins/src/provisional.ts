// Provisional scoring while the ball is still rolling. Pure and DOM-free.
import { frameState, groupFrames, scoreFrames } from './scoring';

export interface ProvisionalMark {
  /** 0-based frame index the in-flight roll belongs to. */
  readonly frame: number;
  /** 0-based mark slot inside that frame. */
  readonly index: number;
  readonly mark: string;
}

/** The mark the in-flight roll would show if it stopped now, or null when nothing has fallen yet. */
export function provisionalMark(rolls: readonly number[], pins: number): ProvisionalMark | null {
  const st = frameState(rolls);
  if (st.complete || !Number.isInteger(pins) || pins <= 0 || pins > st.standing) return null;
  const next = [...rolls, pins];
  const frame = groupFrames(next).length - 1;
  const marks = scoreFrames(next)[frame]?.marks ?? [];
  const index = marks.length - 1;
  const mark = marks[index];
  return mark === undefined ? null : { frame, index, mark };
}

/** 0-based frame index that a just-recorded roll landed in (for the "+N" fly target). */
export const frameIndexOfLastRoll = (rolls: readonly number[]): number => Math.max(0, groupFrames(rolls).length - 1);
