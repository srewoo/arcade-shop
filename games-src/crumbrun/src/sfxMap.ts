// Which sound each simulation event plays. A table keyed by every EventType (the type system and
// tests/sfxmap.test.ts both fail if a new event is added without a decision here).
import type { Sfx } from './audio';
import type { EventType } from './world';

export type SfxName = 'squeak' | 'pistol' | 'splash' | 'meow' | 'cheese' | 'cheeseAppear' | 'death' | 'jingleClear'
  | 'extraLife' | 'release' | 'drenchTick' | 'drenchEnd' | 'phase' | 'pounce';

/** An empty list means the event is deliberately silent. */
export const SFX_FOR_EVENT: Readonly<Record<EventType, readonly SfxName[]>> = {
  crumb: ['squeak'], sugar: ['squeak'], pistol: ['pistol'], splash: ['splash', 'meow'], cheese: ['cheese'],
  cheeseSpawn: ['cheeseAppear'], death: ['death'], clear: ['jingleClear'], extralife: ['extraLife'],
  phase: ['phase'], release: ['release'], drenchEnd: ['drenchEnd'], drenchWarn: ['drenchTick'], pounce: ['pounce'],
};

export function sfxForEvent(sfx: Sfx, type: EventType): void {
  for (const name of SFX_FOR_EVENT[type]) sfx[name]();
}
