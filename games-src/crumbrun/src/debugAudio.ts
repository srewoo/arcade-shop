// Debug-only: render every sound offline through the real audio graph and report its peak level.
import { Sfx } from './audio';
import { SFX_FOR_EVENT } from './sfxMap';

export async function renderAudioPeaks(): Promise<Record<string, number>> {
  const names = [...new Set(Object.values(SFX_FOR_EVENT).flat()), 'jingleStart', 'gameOver', 'ui'] as const;
  const out: Record<string, number> = {};
  for (const name of names) {
    const ac = new OfflineAudioContext(1, 44100 * 3, 44100);
    const sfx = new Sfx();
    sfx.attach(ac);
    (sfx as unknown as Record<string, () => void>)[name]?.();
    const buf = await ac.startRendering();
    let peak = 0;
    for (const v of buf.getChannelData(0)) peak = Math.max(peak, Math.abs(v));
    out[name] = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  }
  return out;
}
