// Mixer graph: sfx + music buses -> master -> compressor -> destination.
import { mix } from '../config/audio';

export interface Bus {
  readonly master: GainNode;
  readonly sfx: GainNode;
  readonly music: GainNode;
  readonly musicDuck: GainNode; // 0 while paused, so pads fall silent without suspending SFX
  readonly compressor: DynamicsCompressorNode;
}

export function createBus(ctx: BaseAudioContext): Bus {
  const compressor = ctx.createDynamicsCompressor();
  const c = mix.compressor;
  compressor.threshold.value = c.threshold;
  compressor.ratio.value = c.ratio;
  compressor.knee.value = c.knee;
  compressor.attack.value = c.attack;
  compressor.release.value = c.release;
  const master = ctx.createGain();
  const sfx = ctx.createGain();
  const music = ctx.createGain();
  const musicDuck = ctx.createGain();
  sfx.gain.value = mix.sfxBase;
  music.gain.value = mix.musicBase;
  sfx.connect(master);
  music.connect(musicDuck).connect(master);
  master.connect(compressor).connect(ctx.destination);
  return { master, sfx, music, musicDuck, compressor };
}

export interface Levels {
  sfxOn: boolean;
  musicOn: boolean;
  muted: boolean;
  master: number; // 0..100
  sfx: number;
  music: number;
}

/** Linear gains for the three buses given the user's levels. */
export function busGains(l: Levels): { master: number; sfx: number; music: number } {
  return {
    master: l.muted ? 0 : l.master / 100,
    sfx: l.sfxOn ? (l.sfx / 100) * mix.sfxBase : 0,
    music: l.musicOn ? (l.music / 100) * mix.musicBase : 0,
  };
}

export const comboHz = (combo: number, base: number): number => base * Math.pow(2, Math.min(12, Math.max(0, combo)) / 12);
