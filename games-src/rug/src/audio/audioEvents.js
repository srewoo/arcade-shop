// Event table: game code emits named events, this maps each to exactly one sfx cue.
// `createAudioEvents(sfx)` takes the sfx object so tests can pass a stub.

/** event name -> (sfx, payload) => void. Every entry plays one cue. */
export const AUDIO_EVENTS = Object.freeze({
  lap: (sfx) => sfx.lap(),
  split: (sfx, p) => sfx.split(!!p?.good),
  driftTier: (sfx, p) => sfx.driftTier(p?.tier ?? 1),
  driftBank: (sfx) => sfx.driftBank(),
  driftLost: (sfx) => sfx.driftLost(),
  turbo: (sfx, p) => sfx.turbo(p?.tier ?? 1),
  wrongWay: (sfx) => sfx.wrongWay(),
  nitroReady: (sfx) => sfx.nitroReady(),
  overtake: (sfx) => sfx.overtake(),
  newBest: (sfx) => sfx.newBest(),
  pad: (sfx) => sfx.pad(),
  confirm: (sfx) => sfx.confirm(),
  back: (sfx) => sfx.back(),
  pause: (sfx) => sfx.pause(),
  resume: (sfx) => sfx.resume(),
});

export function createAudioEvents(sfx) {
  /** @returns {boolean} true when the event name is known. */
  return function emit(name, payload) {
    const play = AUDIO_EVENTS[name];
    if (!play) return false;
    play(sfx, payload);
    return true;
  };
}
