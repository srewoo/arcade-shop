// Tone synthesis shared by the live engine and the offline mix meter.
import { COMBO_BASE_HZ } from '../config/audio';
import { SFX_TABLE, type Sfx, type ToneSpec } from '../config/sfx';
import { comboHz } from './bus';

export function tone(ctx: BaseAudioContext, dest: AudioNode, t0: number, spec: ToneSpec): void {
  const [freq, dur, wave, gain, delay = 0, slideTo] = spec;
  const t = t0 + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.onended = () => g.disconnect();
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function specsFor(name: Sfx, arg = 0): readonly ToneSpec[] {
  if (name === 'combo') {
    const f = comboHz(arg, COMBO_BASE_HZ);
    return [[f, 0.12, 'triangle', 0.16], [f * 1.5, 0.14, 'sine', 0.12, 0.05]];
  }
  return SFX_TABLE[name];
}

export function playSfx(ctx: BaseAudioContext, dest: AudioNode, name: Sfx, t0: number, arg = 0): void {
  for (const spec of specsFor(name, arg)) tone(ctx, dest, t0, spec);
}
