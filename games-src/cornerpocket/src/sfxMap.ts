// Maps game outcomes to sound calls. Pure, so every outcome is provably covered by a test.
import type { OverInfo } from './gameTypes';
import type { SfxCall } from './sfxNames';

export function sfxForOver(info: OverInfo): SfxCall[] {
  if (info.mode === 'trick') {
    if (!info.won) return [{ name: 'lose' }];
    return [{ name: 'win' }, { name: 'star', n: info.stars ?? 1 }];
  }
  if (info.mode === 'rack') return [{ name: info.newBest ? 'newBest' : 'lose' }];
  return [{ name: info.won ? 'win' : 'lose' }];
}
