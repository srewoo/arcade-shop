// The seven 4-cell shapes, with all four rotation states precomputed.
export type Cell = readonly [number, number];

export const SHAPE_IDS = ['bar', 'cube', 'spur', 'ripple', 'tide', 'hookL', 'hookR'] as const;
export type ShapeId = (typeof SHAPE_IDS)[number];

interface ShapeDef {
  readonly size: number; // side of the square bounding box
  readonly base: readonly Cell[];
}

const DEFS: Record<ShapeId, ShapeDef> = {
  bar: { size: 4, base: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  cube: { size: 2, base: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  spur: { size: 3, base: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  ripple: { size: 3, base: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  tide: { size: 3, base: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  hookL: { size: 3, base: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  hookR: { size: 3, base: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

/** Rotate cells clockwise inside a size x size box. */
function rotateCw(cells: readonly Cell[], size: number): Cell[] {
  return cells.map(([x, y]): Cell => [size - 1 - y, x]);
}

function buildStates(def: ShapeDef): Cell[][] {
  const states: Cell[][] = [[...def.base]];
  for (let r = 1; r < 4; r++) states.push(rotateCw(states[r - 1] as Cell[], def.size));
  return states;
}

export const ROTATIONS: Record<ShapeId, readonly (readonly Cell[])[]> = {
  bar: buildStates(DEFS.bar),
  cube: buildStates(DEFS.cube),
  spur: buildStates(DEFS.spur),
  ripple: buildStates(DEFS.ripple),
  tide: buildStates(DEFS.tide),
  hookL: buildStates(DEFS.hookL),
  hookR: buildStates(DEFS.hookR),
};

export const shapeSize = (id: ShapeId): number => DEFS[id].size;

export function cellsOf(id: ShapeId, rot: number): readonly Cell[] {
  return (ROTATIONS[id][((rot % 4) + 4) % 4] as readonly Cell[]);
}

/** Palette index 1..7 for a shape (0 = empty, 8 = garbage). */
export const shapeIndex = (id: ShapeId): number => SHAPE_IDS.indexOf(id) + 1;
export const GARBAGE_CELL = 8;
