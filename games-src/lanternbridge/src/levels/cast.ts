// The original cast of the bridge pack, ordered from quickest to slowest.
import type { ArtKey } from '../puzzle/types';

export interface CastMember {
  readonly name: string;
  readonly art: ArtKey;
}

export const BRIDGE_CAST: readonly CastMember[] = [
  { name: 'Wren', art: 'courier' },
  { name: 'Tobin', art: 'tinker' },
  { name: 'Ines', art: 'baker' },
  { name: 'Odo', art: 'porter' },
  { name: 'Hester', art: 'herbalist' },
  { name: 'Bram', art: 'smith' },
  { name: 'Quill', art: 'elder' },
];

/** Spread n travellers (3..7) across the roster so the fastest and slowest are always in. */
export function pickCast(n: number): CastMember[] {
  const last = BRIDGE_CAST.length - 1;
  return Array.from({ length: n }, (_, i) => BRIDGE_CAST[n === 1 ? 0 : Math.round((i * last) / (n - 1))] as CastMember);
}
