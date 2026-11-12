import { audio, playTone, playNoise, rampTo, masterLevel, MUTE_STORAGE_KEY } from "./audioEngine.js";
import { clamp } from "../util/math.js";
import { ENGINE_MIX as M } from "../config/audio.js";

/** Public sound API used by the game (original object: ye). */
export const sfx = {
  get muted() {
    return audio.muted;
  },
  toggleMute() {
    audio.muted = !audio.muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, audio.muted ? "1" : "0");
    } catch {}
    if (audio.ctx) audio.master.gain.setTargetAtTime(masterLevel(), audio.ctx.currentTime, 0.02);
    return audio.muted;
  },
  /** Master volume 0..1 (settings panel); 1 = the original level. */
  setVolume(volume) {
    audio.volume = clamp(Number(volume) || 0, 0, 1);
    if (audio.ctx) audio.master.gain.setTargetAtTime(masterLevel(), audio.ctx.currentTime, 0.02);
  },
  /** SFX / engine channel level 0..1 (settings sliders). */
  setBus(name, level) {
    const value = clamp(Number(level) || 0, 0, 1);
    if (name === "sfx") audio.sfxVolume = value;
    else if (name === "engine") audio.engineVolume = value;
    else return;
    const node = name === "sfx" ? audio.sfxBus : audio.engineBus;
    if (audio.ctx && node) node.gain.setTargetAtTime(value, audio.ctx.currentTime, 0.02);
  },
  /**
   * Per-frame engine mix. `s` = {speed, boosting, throttle, active, offroad,
   * skid, rivalDist, rivalSpeed}.
   */
  engine(s) {
    const v = audio.voices;
    if (!v) return;
    const speed = Math.abs(s.speed);
    const freq = 62 + speed * 5.2 + (s.boosting ? 46 : 0);
    rampTo(v.low.frequency, freq);
    rampTo(v.high.frequency, freq * 2.01);
    rampTo(v.lp.frequency, 420 + speed * 26 + (s.boosting ? 900 : 0) + s.throttle * 250);
    rampTo(v.mix.gain, s.active ? M.idle + s.throttle * M.throttle + (s.boosting ? M.boost : 0) : 0, 0.09);
    rampTo(v.pileG.gain, s.active ? clamp(speed / 40, 0, 1) * (M.pile + s.offroad * M.pileOffroad) : 0, 0.08);
    rampTo(v.rushG.gain, s.active && s.boosting ? M.rush : 0, 0.08);
    rampTo(v.skidG.gain, s.active ? (s.skid || 0) * M.skid : 0, 0.05);
    const rivalNear = s.active ? clamp(1 - s.rivalDist / 60, 0, 1) : 0;
    rampTo(v.rival.frequency, 58 + s.rivalSpeed * 5);
    rampTo(v.rivalG.gain, rivalNear * rivalNear * M.rival, 0.1);
  },
  jump(k = 1) {
    playTone("triangle", 240, 620, 0.17, 0.2 * k);
  },
  land(k = 1) {
    playNoise(0.16, 0.32 * k, 240, 0.8);
    playTone("sine", 120, 50, 0.16, 0.26 * k);
  },
  /** Collision thud; `impact` is the impact speed (30 = full volume). */
  hit(impact, k = 1) {
    const e = clamp(impact / 30, 0.25, 1) * k;
    playNoise(0.22, 0.42 * e, 620, 0.7);
    playTone("square", 170, 60, 0.13, 0.16 * e);
  },
  /** Brick clatter (lego bits scattering). */
  bricks(count, k = 1) {
    for (let i = 0; i < Math.min(9, count * 3); i++) {
      const delay = i * 0.05 + Math.random() * 0.05;
      const freq = 1700 + Math.random() * 2400;
      playNoise(0.05, 0.22 * k, freq, 7, delay);
      playTone("square", freq * 0.55, freq * 0.4, 0.03, 0.05 * k, delay);
    }
  },
  /** Nitro start. `pitch` raises it for the mini-turbo tiers (1 = the original sound). */
  boost(pitch = 1) {
    playNoise(0.45, 0.2, 1100 * pitch, 0.7);
    playTone("sawtooth", 160 * pitch, 640 * pitch, 0.32, 0.08);
  },
  /** Mini-turbo release: the nitro cue pitched up per tier. */
  turbo(tier = 1) {
    sfx.boost(1 + 0.25 * clamp(tier, 1, 2));
  },
  /** Battery pad pickup: one dedicated cue (arpeggio plus a short airy sweep) instead of two stacked ones. */
  pad() {
    [660, 880, 1320].forEach((f, i) => playTone("triangle", f, f, 0.12, 0.15, i * 0.06));
    playNoise(0.22, 0.1, 1500, 1.2, 0.05);
  },
  /** Lap completed. */
  lap() {
    playTone("triangle", 660, 660, 0.14, 0.14);
    playTone("triangle", 880, 880, 0.22, 0.14, 0.12);
  },
  /** Sector split: brighter when faster than the best, a soft low blip when slower. */
  split(good) {
    if (good) playTone("triangle", 740, 988, 0.14, 0.12);
    else playTone("square", 330, 250, 0.16, 0.06);
  },
  /** Drift charge tier reached (1 = MINI, 2 = SUPER). */
  driftTier(tier = 1) {
    playTone("triangle", 520 + tier * 180, 780 + tier * 260, 0.12, 0.13);
    if (tier > 1) playTone("triangle", 1040, 1560, 0.16, 0.1, 0.07);
  },
  /** Drift points banked. */
  driftBank() {
    [880, 1175, 1568].forEach((f, i) => playTone("sine", f, f, 0.1, 0.12, i * 0.045));
  },
  /** Drift points lost (hit). */
  driftLost() {
    playTone("sawtooth", 320, 110, 0.28, 0.1);
    playNoise(0.18, 0.12, 500, 0.8);
  },
  /** Heading the wrong way: two short pulses. */
  wrongWay() {
    playTone("square", 440, 440, 0.12, 0.09);
    playTone("square", 330, 330, 0.16, 0.09, 0.17);
  },
  /** Nitro meter full again. */
  nitroReady() {
    [500, 700, 1000].forEach((f, i) => playTone("sine", f, f * 1.05, 0.1, 0.1, i * 0.07));
  },
  /** Gained a place. */
  overtake() {
    playNoise(0.2, 0.1, 1400, 1.4);
    playTone("triangle", 600, 980, 0.16, 0.12, 0.04);
  },
  /** New personal best. */
  newBest() {
    [523, 659, 784, 1047].forEach((f, i) => playTone("triangle", f, f, 0.16, 0.14, i * 0.08));
    playTone("triangle", 1319, 1319, 0.4, 0.14, 0.34);
  },
  /** Menu: confirm / back / pause / resume. */
  confirm() {
    playTone("triangle", 700, 1000, 0.08, 0.13);
  },
  back() {
    playTone("triangle", 620, 420, 0.08, 0.12);
  },
  pause() {
    playTone("triangle", 780, 440, 0.12, 0.12);
  },
  resume() {
    playTone("triangle", 440, 780, 0.12, 0.12);
  },
  beep() {
    playTone("square", 520, 520, 0.16, 0.14);
  },
  go() {
    playTone("square", 880, 880, 0.42, 0.16);
    playTone("triangle", 1320, 1320, 0.42, 0.1);
  },
  /** The grab-hand sequence (thump, grab, lift whoosh). */
  grab() {
    playTone("sine", 150, 90, 0.2, 0.2, 0.82);
    playNoise(0.14, 0.2, 900, 2, 0.95);
    playNoise(1, 0.16, 700, 0.6, 1.1);
    playTone("triangle", 200, 760, 1, 0.07, 1.1);
  },
  pickup() {
    [660, 880, 1320].forEach((f, i) => playTone("triangle", f, f, 0.12, 0.16, i * 0.06));
  },
  click() {
    playTone("triangle", 900, 620, 0.06, 0.13);
  },
  /** Finish jingle: `won` true = rising arpeggio, false = sad four-note. */
  finish(won) {
    (won ? [523, 659, 784, 1047, 1319] : [523, 494, 523, 659]).forEach((f, i) =>
      playTone("triangle", f, f, 0.3, 0.17, i * 0.13),
    );
  },
  meow() {
    playTone("sawtooth", 430, 860, 0.28, 0.1);
    playTone("sawtooth", 860, 360, 0.5, 0.1, 0.27);
    playNoise(0.7, 0.05, 1300, 3);
  },
  /** Cascade of rising sine blips (poppable objects chain). */
  popWave(startDelay, spread) {
    for (let i = 0; i < 26; i++) {
      const delay = startDelay + (i / 26) * spread + Math.random() * 0.05;
      const freq = 330 + Math.random() * 330;
      playTone("sine", freq * 0.6, freq * 1.5, 0.09, 0.06, delay);
    }
  },
};
