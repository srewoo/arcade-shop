/** Ordinal suffix for a finishing position (1 -> "st", 2 -> "nd", 3 -> "rd", otherwise "th"). */
export const ordinalSuffix = (n) => (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");

/** Format seconds as m:ss.cc (negative values clamp to 0). */
export const formatTime = (seconds) => {
  seconds = Math.max(0, seconds);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(2).padStart(5, "0")}`;
};
