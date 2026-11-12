// Nitro input: "hold" (original) follows the key; "toggle" latches on each fresh press. Pure.

/**
 * @param {"hold"|"toggle"} mode
 * @param {{latched:boolean}} state  mutated in toggle mode
 * @param {boolean} held       a boost key is currently down
 * @param {boolean} pressedNow a boost key went down this frame
 * @param {boolean} hasNitro   meter above zero (an empty meter releases the latch)
 */
export function boostActive(mode, state, held, pressedNow, hasNitro = true) {
  if (mode !== "toggle") {
    state.latched = false;
    return held;
  }
  if (pressedNow) state.latched = !state.latched;
  if (!hasNitro) state.latched = false;
  return state.latched;
}
