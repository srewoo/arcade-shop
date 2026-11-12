// DAS / ARR horizontal-repeat timer. All values in 60 Hz frames.
export interface DasState {
  dir: -1 | 0 | 1;
  timer: number;
  prevLeft: boolean;
  prevRight: boolean;
}

export const createDas = (): DasState => ({ dir: 0, timer: 0, prevLeft: false, prevRight: false });

/** Advance one frame. Returns signed horizontal steps to attempt (ARR 0 = slam to wall). */
export function stepDas(s: DasState, left: boolean, right: boolean, das: number, arr: number): number {
  const pressedL = left && !s.prevLeft;
  const pressedR = right && !s.prevRight;
  s.prevLeft = left;
  s.prevRight = right;
  if (pressedL !== pressedR) {
    s.dir = pressedL ? -1 : 1;
    s.timer = 0;
    return s.dir;
  }
  if (s.dir === -1 && !left) switchDir(s, right ? 1 : 0);
  else if (s.dir === 1 && !right) switchDir(s, left ? -1 : 0);
  if (s.dir === 0) return 0;
  s.timer++;
  if (s.timer < das) return 0;
  if (arr <= 0) return s.dir * 10;
  return (s.timer - das) % arr === 0 ? s.dir : 0;
}

function switchDir(s: DasState, dir: -1 | 0 | 1): void {
  s.dir = dir;
  s.timer = 0;
}

export const msToFrames = (ms: number): number => Math.round((ms * 60) / 1000);
