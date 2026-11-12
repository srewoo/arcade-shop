// Maps simulation events to sound cues. Every event type is either a cue or explicitly silent.
import type { GameEvent } from '../core/state';
import type { Sfx } from './engine';

export interface SfxCue { name: Sfx; arg?: number; delay?: number }

export const EVENT_SOUND: Readonly<Record<GameEvent['type'], 'cue' | 'silent'>> = {
  move: 'cue', rotate: 'cue', stash: 'cue', hardDrop: 'cue', lock: 'cue', clear: 'cue', levelUp: 'cue',
  garbage: 'cue', wipe: 'cue', end: 'cue', deny: 'cue', softDrop: 'cue',
  land: 'silent', // reserved: the lock thud already covers touching down
};

function clearCues(e: Extract<GameEvent, { type: 'clear' }>): SfxCue[] {
  const cues: SfxCue[] = [{ name: e.twist !== 'none' ? 'twist' : e.lines >= 4 ? 'clear4' : 'clear1' }];
  if (e.combo > 0) cues.push({ name: 'combo', arg: e.combo, delay: 0.15 });
  if (e.b2b) cues.push({ name: 'b2b', delay: 0.2 });
  if (e.allClear) cues.push({ name: 'allClear', delay: 0.3 });
  return cues;
}

export function cuesFor(events: readonly GameEvent[]): SfxCue[] {
  const hard = events.some((e) => e.type === 'hardDrop' && e.rows > 0);
  const out: SfxCue[] = [];
  for (const e of events) {
    switch (e.type) {
      case 'move': out.push({ name: 'move' }); break;
      case 'rotate': out.push({ name: 'rotate' }); break;
      case 'stash': out.push({ name: 'stash' }); break;
      case 'hardDrop': out.push({ name: 'hardDrop' }); break;
      case 'lock': if (!hard) out.push({ name: 'lock' }); break;
      case 'clear': out.push(...clearCues(e)); break;
      case 'levelUp': out.push({ name: 'levelUp', delay: 0.25 }); break;
      case 'garbage': out.push({ name: 'garbage' }); break;
      case 'wipe': out.push({ name: 'wipe' }); break;
      case 'deny': out.push({ name: 'deny' }); break;
      case 'softDrop': out.push({ name: 'softDrop' }); break;
      case 'end': out.push({ name: e.status === 'over' ? 'over' : 'win' }); break;
      case 'land': break;
    }
  }
  return out;
}
