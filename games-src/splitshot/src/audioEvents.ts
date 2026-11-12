// Maps sim events to sound cues (pure, so it can be unit tested).
import type { Sfx } from './audioCues';
import type { SimEvent } from './sim/types';

const POP: readonly Sfx[] = ['pop0', 'pop1', 'pop2', 'pop3'];

export function cuesFor(e: SimEvent): readonly Sfx[] {
  switch (e.type) {
    case 'fire': return ['fire'];
    case 'hitLine': return [POP[Math.min(3, Math.max(0, e.size))] as Sfx];
    case 'bounce': return e.size >= 2 ? ['bounce'] : [];
    case 'block': return [e.broke ? 'blockBreak' : 'block'];
    case 'drop': return ['drop'];
    case 'collect': return ['collect'];
    case 'shieldBreak': return ['shieldBreak'];
    case 'hit': return ['hit'];
    case 'clear': return ['clear'];
    case 'timeout': return ['timeout'];
    case 'warn': return ['warn'];
    default: return [];
  }
}
