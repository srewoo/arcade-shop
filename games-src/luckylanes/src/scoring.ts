// Pure ten-pin scoring. A game is just the flat list of pins knocked per roll.

export interface FrameView {
  readonly rolls: readonly number[];
  readonly symbols: readonly string[];
  /** Running total through this frame, or null while bonus rolls are pending. */
  readonly total: number | null;
}

interface RawFrame {
  readonly rolls: number[];
  readonly complete: boolean;
}

const isStrike = (r: readonly number[]): boolean => r[0] === 10;

/** Split the flat roll list into up to 10 frames. */
function splitFrames(rolls: readonly number[]): RawFrame[] {
  const frames: RawFrame[] = [];
  let i = 0;
  for (let f = 0; f < 9 && i < rolls.length; f++) {
    const first = rolls[i] as number;
    if (first === 10) {
      frames.push({ rolls: [10], complete: true });
      i += 1;
    } else if (i + 1 < rolls.length) {
      frames.push({ rolls: [first, rolls[i + 1] as number], complete: true });
      i += 2;
    } else {
      frames.push({ rolls: [first], complete: false });
      i += 1;
    }
  }
  if (frames.length === 9 && i < rolls.length) {
    const rest = rolls.slice(i, i + 3);
    const needsThird = rest[0] === 10 || (rest.length > 1 && (rest[0] as number) + (rest[1] as number) === 10);
    frames.push({ rolls: rest, complete: needsThird ? rest.length === 3 : rest.length === 2 });
  }
  return frames;
}

type Mark = 'X' | '/' | number;

/** Label each roll of a frame: strike, spare or the pin count. */
function labelFrame(rolls: readonly number[]): Mark[] {
  let standing = 10;
  let fresh = true;
  return rolls.map((r) => {
    if (r === standing) {
      const mark: Mark = fresh ? 'X' : '/';
      standing = 10;
      fresh = true;
      return mark;
    }
    standing -= r;
    fresh = false;
    return r;
  });
}

const toSymbol = (m: Mark): string => (m === 0 ? '-' : String(m));

/** Bonus pins for frame `f` (0-based, < 9) given the rolls following it. */
function bonusFor(frame: readonly number[], following: readonly number[]): number | null {
  const need = isStrike(frame) ? 2 : (frame[0] as number) + (frame[1] ?? 0) === 10 ? 1 : 0;
  if (following.length < need) return null;
  return following.slice(0, need).reduce((a, b) => a + b, 0);
}

export function scoreGame(rolls: readonly number[]): FrameView[] {
  const frames = splitFrames(rolls);
  const views: FrameView[] = [];
  let total: number | null = 0;
  let offset = 0;
  frames.forEach((fr, f) => {
    const sum = fr.rolls.reduce((a, b) => a + b, 0);
    let frameScore: number | null = null;
    if (fr.complete) {
      frameScore = f === 9 ? sum : bonusFor(fr.rolls, rolls.slice(offset + fr.rolls.length));
      if (frameScore !== null && f !== 9) frameScore += sum;
    }
    total = total === null || frameScore === null ? null : total + frameScore;
    views.push({ rolls: fr.rolls, symbols: labelFrame(fr.rolls).map(toSymbol), total });
    offset += fr.rolls.length;
  });
  return views;
}

export function totalScore(rolls: readonly number[]): number {
  const views = scoreGame(rolls);
  for (let i = views.length - 1; i >= 0; i--) {
    const t = (views[i] as FrameView).total;
    if (t !== null) return t;
  }
  return 0;
}

export function isGameComplete(rolls: readonly number[]): boolean {
  const frames = splitFrames(rolls);
  return frames.length === 10 && (frames[9] as RawFrame).complete;
}

/** 0-based index of the frame the next roll belongs to (10 when finished). */
export function currentFrame(rolls: readonly number[]): number {
  if (isGameComplete(rolls)) return 10;
  const frames = splitFrames(rolls);
  const last = frames[frames.length - 1];
  if (!last) return 0;
  return last.complete ? frames.length : frames.length - 1;
}

/** Ball number (1-based) within the current frame for the next roll. */
export function ballInFrame(rolls: readonly number[]): number {
  if (isGameComplete(rolls)) return 0;
  const frames = splitFrames(rolls);
  const last = frames[frames.length - 1];
  if (!last || last.complete) return 1;
  return last.rolls.length + 1;
}

/** Pins standing before the next roll if the rack is respotted only when scoring demands it. */
export function pinsStandingBeforeNext(rolls: readonly number[]): number {
  if (isGameComplete(rolls)) return 0;
  const frames = splitFrames(rolls);
  const last = frames[frames.length - 1];
  if (!last || last.complete) return 10;
  const rs = last.rolls;
  if (frames.length < 10) return 10 - (rs[0] as number);
  let standing = 10;
  for (const r of rs) standing = standing - r === 0 ? 10 : standing - r;
  return standing;
}

/** True when the next roll starts on a fresh rack of ten. */
export const freshRackNext = (rolls: readonly number[]): boolean => pinsStandingBeforeNext(rolls) === 10;

export const isValidRoll = (rolls: readonly number[], pins: number): boolean =>
  Number.isInteger(pins) && pins >= 0 && !isGameComplete(rolls) && pins <= pinsStandingBeforeNext(rolls);

function lastMark(rolls: readonly number[]): Mark | null {
  const frames = splitFrames(rolls);
  const last = frames[frames.length - 1];
  return last ? (labelFrame(last.rolls).at(-1) ?? null) : null;
}

/** Strike on the roll just thrown (includes 10th-frame bonus strikes). */
export const lastRollWasStrike = (rolls: readonly number[]): boolean => lastMark(rolls) === 'X';

/** Spare on the roll just thrown (includes 10th-frame fill-ball spares). */
export const lastRollWasSpare = (rolls: readonly number[]): boolean => lastMark(rolls) === '/';

/** Number of consecutive strikes ending at the last roll. */
export function strikeStreak(rolls: readonly number[]): number {
  let n = 0;
  for (let i = rolls.length - 1; i >= 0 && rolls[i] === 10; i--) n++;
  return n;
}
