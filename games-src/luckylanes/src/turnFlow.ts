// Turn-flow rules that do not need the physics world: stage names, which waits can be
// skipped and how much faster they run. Pure.
import { TUNING } from './tuning';

export type Stage = 'ready' | 'cpu' | 'rolling' | 'settle' | 'sweep' | 'banner' | 'over';

/** Non-physics waits that Space, Enter or a tap can fast-forward. */
export const SKIPPABLE: readonly Stage[] = ['cpu', 'settle', 'sweep', 'banner'];

export const isSkippable = (stage: Stage): boolean => SKIPPABLE.includes(stage);

/** Multiplier for the clock of the current wait. Physics (`rolling`) always runs at 1. */
export function waitScale(stage: Stage, skipRequested: boolean, fastCpuTurn: boolean): number {
  return isSkippable(stage) && (skipRequested || fastCpuTurn) ? TUNING.timing.fastForward : 1;
}

/**
 * May a skip request fast-forward this wait right now? CPU waits always can. After a human
 * throw the pin-fall (settle, sweep) always plays; only the closing banner wait can be skipped,
 * and only after a short guard so a late Space press never cuts the payoff.
 */
export function canSkip(stage: Stage, stageT: number, byCpu: boolean): boolean {
  if (!isSkippable(stage)) return false;
  if (stage === 'cpu' || byCpu) return true;
  return stage === 'banner' && stageT >= TUNING.timing.skipGuardS;
}

/** Skip and fast-forward bookkeeping for the non-physics waits. */
export class Pacing {
  /** "Fast CPU turns" setting. */
  fastCpu = false;
  private skipRequested = false;
  private lastThrowerCpu = false;

  /** A new turn starts: forget any skip request. */
  reset(): void {
    this.skipRequested = false;
  }

  noteThrow(byCpu: boolean): void {
    this.lastThrowerCpu = byCpu;
  }

  /** True if a skip would apply right now (drives the button label and state). */
  can(stage: Stage, stageT = Number.POSITIVE_INFINITY): boolean {
    return canSkip(stage, stageT, this.lastThrowerCpu);
  }

  /** Ask to fast-forward the current wait. Returns true if it newly applies. */
  request(stage: Stage, stageT = Number.POSITIVE_INFINITY): boolean {
    if (!this.can(stage, stageT) || this.skipRequested) return false;
    this.skipRequested = true;
    return true;
  }

  /** Clock multiplier for the current stage. CPU waits cover their think time and the frame they threw. */
  scale(stage: Stage): number {
    const cpuWait = stage === 'cpu' || (this.lastThrowerCpu && isSkippable(stage));
    return waitScale(stage, this.skipRequested, this.fastCpu && cpuWait);
  }
}
