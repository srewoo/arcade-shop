// Look-ahead on a shot using the same deterministic physics: does it clear the rack, and
// how close to the pocket does a first ball cross the head-pin line? Pure.
import { ballXAtHead } from './cpu';
import { pocketCall, type PocketCall } from './meterMap';
import { knockedCount, simulate } from './physics';
import { countStanding, type PinMask } from './pins';
import type { Shot } from './worldTypes';

export interface ShotInfo {
  /** Every standing pin goes down (strike on a full rack, spare or clear otherwise). */
  readonly clears: boolean;
  readonly call: PocketCall;
}

export function analyseShot(mask: PinMask, shot: Shot): ShotInfo {
  const standing = countStanding(mask);
  const clears = standing > 0 && knockedCount(simulate(mask, shot)) === standing;
  const fullRack = standing === mask.length;
  return { clears, call: fullRack ? pocketCall(ballXAtHead(shot.x, shot.aim, shot.power, shot.spin)) : null };
}
