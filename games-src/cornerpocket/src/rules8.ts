// Simplified 8-ball rules as a pure state machine: groups, call-free, 8 last, scratch = ball in hand.
import type { ShotReport } from './sim';

export type Group = 'solids' | 'stripes';
export type Player = 0 | 1;

export interface EightState {
  groups: [Group | null, Group | null];
  current: Player;
  ballInHand: boolean;
  winner: Player | null;
  message: string;
}

export const initialEight = (first: Player = 0): EightState => ({
  groups: [null, null], current: first, ballInHand: false, winner: null, message: 'Break!',
});

export const groupOf = (id: number): Group | null =>
  id >= 1 && id <= 7 ? 'solids' : id >= 9 && id <= 15 ? 'stripes' : null;

const other = (p: Player): Player => (p === 0 ? 1 : 0);
const inGroup = (id: number, g: Group): boolean => groupOf(id) === g;

/** Ball ids the current player may legally contact first. */
export function legalTargets(s: EightState, onTable: readonly number[]): number[] {
  const g = s.groups[s.current];
  if (g === null) return onTable.filter((id) => id !== 8);
  const own = onTable.filter((id) => inGroup(id, g));
  return own.length > 0 ? own : onTable.filter((id) => id === 8);
}

function lose(s: EightState, p: Player, why: string): EightState {
  return { ...s, winner: other(p), ballInHand: false, message: why };
}

function checkEight(s: EightState, r: ShotReport, foul: boolean): EightState | null {
  if (!r.potted.includes(8)) return null;
  const g = s.groups[s.current];
  if (g === null) return lose(s, s.current, 'Eight potted on the break: loss');
  const ownLeft = r.onTableBefore.some((id) => inGroup(id, g));
  if (ownLeft) return lose(s, s.current, 'Eight potted early: loss');
  if (foul) return lose(s, s.current, 'Eight potted with a foul: loss');
  return { ...s, winner: s.current, message: 'Eight potted: win!' };
}

function foulReason(s: EightState, r: ShotReport): string | null {
  if (r.cuePotted) return 'Scratch';
  if (r.firstHit === null) return 'No ball hit';
  if (!legalTargets(s, r.onTableBefore).includes(r.firstHit)) return 'Wrong ball first';
  return null;
}

function assignGroups(s: EightState, r: ShotReport): EightState {
  if (s.groups[s.current] !== null) return s;
  const first = r.potted.find((id) => groupOf(id) !== null);
  if (first === undefined) return s;
  const g = groupOf(first)!;
  const groups: [Group | null, Group | null] = [null, null];
  groups[s.current] = g;
  groups[other(s.current)] = g === 'solids' ? 'stripes' : 'solids';
  return { ...s, groups };
}

/** Apply a finished shot to the rules state. */
export function resolveShot(s: EightState, r: ShotReport): EightState {
  const reason = foulReason(s, r);
  const eight = checkEight(s, r, reason !== null);
  if (eight) return eight;
  if (reason !== null) {
    return { ...s, current: other(s.current), ballInHand: true, message: `${reason}: ball in hand` };
  }
  const assigned = assignGroups(s, r);
  const g = assigned.groups[assigned.current];
  const scored = g !== null && r.potted.some((id) => inGroup(id, g));
  if (scored) {
    const msg = s.groups[s.current] === null ? `Assigned ${g}` : 'Pot! Shoot again';
    return { ...assigned, ballInHand: false, message: msg };
  }
  return { ...assigned, current: other(s.current), ballInHand: false, message: 'No pot: turn passes' };
}
