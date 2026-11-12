// Canvas layout constants (render-only).
export const layoutCfg = {
  rows: 20,
  cols: 10,
  gapPx: 4,
  bedRows: 0.55, // pebble bed under the well, in cells
  sideCells: 4.2, // width reserved on each side of the well, in cells
  minCell: 6,
  portraitBelow: 0.8, // width / height ratio
  miniFactor: 0.74,
  labelMinPx: 12,
} as const;
