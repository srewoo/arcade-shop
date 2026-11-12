// Audio mix constants. Engine voices keep the original gains; the buses default to 1 so nothing changes
// until a player moves the SFX / Engine sliders. Master level lives in audioEngine.js (MASTER_GAIN).
export const ENGINE_MIX = Object.freeze({
  idle: 0.05,
  throttle: 0.05,
  boost: 0.04,
  pile: 0.03,
  pileOffroad: 0.12,
  rush: 0.11,
  skid: 0.1,
  rival: 0.05,
});
export const BUS_DEFAULT = 1;
/** Peak target for any one-shot cue (linear gain before the master; the compressor sits after). */
export const CUE_PEAK = 0.3;
