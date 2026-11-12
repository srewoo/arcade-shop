// Keyboard map, kept pure so it can be tested without a DOM.
export type KeyAction =
  | { type: 'pause' }
  | { type: 'mute' }
  | { type: 'cross' }
  | { type: 'undo' }
  | { type: 'restart' }
  | { type: 'hint' }
  | { type: 'next' }
  | { type: 'pick'; n: number };

export function keyAction(key: string): KeyAction | null {
  const k = key.length === 1 ? key.toLowerCase() : key;
  switch (k) {
    case 'p': case 'Escape': return { type: 'pause' };
    case 'm': return { type: 'mute' };
    case 'c': return { type: 'cross' };
    case 'u': return { type: 'undo' };
    case 'r': return { type: 'restart' };
    case 'h': return { type: 'hint' };
    case 'n': return { type: 'next' };
    default:
      return /^[1-9]$/.test(k) ? { type: 'pick', n: Number(k) } : null;
  }
}

/** The n-th (1-based) actor index currently on the carrier's bank, in roster order. */
export function nthOnBank(bank: number, size: number, n: number): number | null {
  let seen = 0;
  for (let i = 0; i < size; i++) {
    if (bank & (1 << i) && ++seen === n) return i;
  }
  return null;
}
