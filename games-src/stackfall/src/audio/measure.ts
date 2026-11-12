// Offline mix meter (debug only): renders each SFX and one ambient pad through the
// real bus graph and reports peak and loudest-window RMS in dBFS.
import { A_PAD_ROOT_SEMI } from '../config/audio';
import { SFX_NAMES } from '../config/sfx';
import { playPad } from './ambient';
import { busGains, createBus } from './bus';
import { playSfx } from './synth';
import { mix } from '../config/audio';

export interface Level { peakDb: number; rmsDb: number }
const RATE = 44100;

const db = (x: number): number => (x > 1e-9 ? 20 * Math.log10(x) : -180);

export function levelOf(data: Float32Array): Level {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const win = Math.round(RATE * 0.2);
  let best = 0;
  for (let i = 0; i + win <= data.length; i += win >> 1) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += (data[j] as number) ** 2;
    best = Math.max(best, Math.sqrt(sum / win));
  }
  return { peakDb: db(peak), rmsDb: db(best) };
}

async function render(seconds: number, build: (ctx: OfflineAudioContext, sfx: AudioNode, music: AudioNode) => void): Promise<Level> {
  const ctx = new OfflineAudioContext(1, Math.round(RATE * seconds), RATE);
  const bus = createBus(ctx);
  const g = busGains({ sfxOn: true, musicOn: true, muted: false, master: 100, sfx: 100, music: 100 });
  bus.master.gain.value = g.master;
  bus.sfx.gain.value = g.sfx;
  bus.music.gain.value = g.music;
  build(ctx, bus.sfx, bus.music);
  const buf = await ctx.startRendering();
  return levelOf(buf.getChannelData(0));
}

export async function measureMix(): Promise<Record<string, Level>> {
  const out: Record<string, Level> = {};
  for (const name of SFX_NAMES) {
    out[name] = await render(1.6, (ctx, sfx) => playSfx(ctx, sfx, name, 0.05, name === 'combo' ? 3 : 0));
  }
  out.pad = await render(9, (ctx, _sfx, music) => void playPad(ctx, music, 0, A_PAD_ROOT_SEMI, mix.padPeak));
  return out;
}
