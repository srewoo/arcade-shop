/**
 * Pure WebAudio synth core (no audio samples are shipped).
 * The AudioContext is created lazily on the first keydown / pointerdown
 * (browser autoplay policy). Graph: sources -> master gain -> compressor -> out.
 */

/** localStorage key holding the mute flag ("1" = muted). */
export const MUTE_STORAGE_KEY = "rug-racers-muted";

/** Mutable audio state shared with sfx.js (original: jt, ni, Fr, Jn, ss). */
export const audio = {
  ctx: null, // jt: AudioContext
  master: null, // ni: master GainNode (0.8, or 0 when muted)
  noise: null, // Fr: 2 s white-noise AudioBuffer
  voices: null, // Jn: continuous engine voices (see createEngineVoices)
  muted: false, // ss
  volume: 1, // master volume setting 0..1 (settings panel)
  sfxBus: null, // one-shot cues -> master
  engineBus: null, // engine / tyre / rival loops -> master
  sfxVolume: 1, // SFX slider 0..1
  engineVolume: 1, // Engine slider 0..1
};

/** Master gain at full volume. */
export const MASTER_GAIN = 0.8;
/** Current master gain: 0 when muted, else MASTER_GAIN scaled by the volume setting. */
export const masterLevel = () => (audio.muted ? 0 : MASTER_GAIN * audio.volume);

try {
  audio.muted = localStorage.getItem(MUTE_STORAGE_KEY) === "1";
} catch {}

/**
 * One-shot oscillator blip with exponential frequency ramp and a short
 * attack / exponential decay gain envelope. (original: sn)
 */
export function playTone(type, freqStart, freqEnd, duration, gain, delay = 0) {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  env.gain.setValueAtTime(1e-4, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + Math.min(0.012, duration * 0.2));
  env.gain.exponentialRampToValueAtTime(1e-4, t0 + duration);
  osc.connect(env).connect(audio.sfxBus);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/**
 * One-shot filtered noise burst with exponential decay. (original: bs)
 * Starts at a random offset (0..1.5 s) in the looped noise buffer.
 */
export function playNoise(duration, gain, freq, q = 1, delay = 0, filterType = "bandpass") {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const env = ctx.createGain();
  src.buffer = audio.noise;
  src.loop = true;
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(1e-4, t0 + duration);
  src.connect(filter).connect(env).connect(audio.sfxBus);
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + duration + 0.02);
}

/**
 * Builds the always-running voices driven every frame by sfx.engine():
 * engine (saw + square into lowpass), pile rustle, boost rush, tyre skid and
 * the rival engine (heard when an opponent is near). (original: ww)
 */
function createEngineVoices() {
  const ctx = audio.ctx;
  const out = audio.engineBus;
  const mix = ctx.createGain();
  mix.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;
  const low = ctx.createOscillator();
  low.type = "sawtooth";
  const high = ctx.createOscillator();
  high.type = "square";
  const highGain = ctx.createGain();
  highGain.gain.value = 0.3;
  low.connect(lp);
  high.connect(highGain).connect(lp);
  lp.connect(mix).connect(out);

  // pile rustle (off-road carpet noise)
  const pileSrc = ctx.createBufferSource();
  pileSrc.buffer = audio.noise;
  pileSrc.loop = true;
  const pileFilter = ctx.createBiquadFilter();
  pileFilter.type = "lowpass";
  pileFilter.frequency.value = 500;
  const pileG = ctx.createGain();
  pileG.gain.value = 0;
  pileSrc.connect(pileFilter).connect(pileG).connect(out);

  // boost rush
  const rushSrc = ctx.createBufferSource();
  rushSrc.buffer = audio.noise;
  rushSrc.loop = true;
  const rushFilter = ctx.createBiquadFilter();
  rushFilter.type = "bandpass";
  rushFilter.frequency.value = 1800;
  rushFilter.Q.value = 0.8;
  const rushG = ctx.createGain();
  rushG.gain.value = 0;
  rushSrc.connect(rushFilter).connect(rushG).connect(out);

  // rival engine
  const rival = ctx.createOscillator();
  rival.type = "sawtooth";
  const rivalFilter = ctx.createBiquadFilter();
  rivalFilter.type = "lowpass";
  rivalFilter.frequency.value = 500;
  const rivalG = ctx.createGain();
  rivalG.gain.value = 0;
  rival.connect(rivalFilter).connect(rivalG).connect(out);

  // tyre skid
  const skidSrc = ctx.createBufferSource();
  skidSrc.buffer = audio.noise;
  skidSrc.loop = true;
  const skidFilter = ctx.createBiquadFilter();
  skidFilter.type = "bandpass";
  skidFilter.frequency.value = 1500;
  skidFilter.Q.value = 2.2;
  const skidG = ctx.createGain();
  skidG.gain.value = 0;
  skidSrc.connect(skidFilter).connect(skidG).connect(out);

  for (const node of [low, high, pileSrc, rushSrc, rival, skidSrc]) node.start();
  return { low, high, lp, mix, pileG, rushG, rival, rivalG, skidG };
}

/** Create (or resume) the AudioContext. Bound to keydown / pointerdown. (original: tm) */
export function initAudio() {
  if (audio.ctx) {
    if (audio.ctx.state === "suspended" && !document.hidden) audio.ctx.resume();
    return;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  audio.ctx = new Ctor();
  const compressor = audio.ctx.createDynamicsCompressor();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = masterLevel();
  audio.master.connect(compressor).connect(audio.ctx.destination);
  audio.sfxBus = audio.ctx.createGain();
  audio.sfxBus.gain.value = audio.sfxVolume;
  audio.sfxBus.connect(audio.master);
  audio.engineBus = audio.ctx.createGain();
  audio.engineBus.gain.value = audio.engineVolume;
  audio.engineBus.connect(audio.master);
  audio.noise = audio.ctx.createBuffer(1, audio.ctx.sampleRate * 2, audio.ctx.sampleRate);
  const data = audio.noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  audio.voices = createEngineVoices();
}

window.addEventListener("keydown", initAudio);
window.addEventListener("pointerdown", initAudio);
document.addEventListener("visibilitychange", () => {
  if (audio.ctx) document.hidden ? audio.ctx.suspend() : audio.ctx.resume();
});

/** Smoothly move an AudioParam to a value (time constant default 0.06 s). (original: Di) */
export const rampTo = (param, value, timeConstant = 0.06) =>
  param.setTargetAtTime(value, audio.ctx.currentTime, timeConstant);
