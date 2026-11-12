// Which lap-stat rows have something to say yet. Empty rows are hidden so the first lap is not a wall of dashes.

/**
 * @param {{delta: number|null, best: number|null, last: number|null, drift: number}} v
 * @returns {{delta: boolean, best: boolean, last: boolean, drift: boolean}} true = show the row
 */
export function statRowsVisible({ delta, best, last, drift }) {
  return {
    delta: delta !== null && delta !== undefined,
    best: best !== null && best !== undefined,
    last: last !== null && last !== undefined,
    drift: (drift ?? 0) > 0,
  };
}

/** Apply the visibility to the `.stat-*` rows inside `hud` (toggles the `empty` class only when it changes). */
export function applyStatRows(hud, visible) {
  for (const [name, show] of Object.entries(visible)) {
    const row = hud.querySelector(`.stat-${name}`);
    if (row && row.classList.contains("empty") === show) row.classList.toggle("empty", !show);
  }
}
