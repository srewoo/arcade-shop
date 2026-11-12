// Table geometry and physics constants. Logical units (px) on an 800x400 playfield;
// ball centres live inside [BALL_R, W-BALL_R] x [BALL_R, H-BALL_R].
export const TABLE_W = 800;
export const TABLE_H = 400;
export const BALL_R = 10;
export const RAIL = 36; // decorative rail drawn around the playfield

export const STEP = 1 / 240; // fixed physics timestep (s)
export const MAX_SPEED = 1500; // px/s at power 1
export const ROLL_DECEL = 260; // constant rolling-friction deceleration (px/s^2)
export const DRAG = 0.35; // viscous drag (1/s)
export const STOP_SPEED = 6; // below this a ball stops
export const CUSHION_E = 0.78; // cushion restitution
export const BALL_E = 1; // ball-ball restitution (elastic)
export const SPIN_GAIN = 0.55; // fraction of impact speed given to cue ball by top/back spin
export const MAX_SHOT_SECONDS = 25;

export interface Pocket {
  readonly x: number;
  readonly y: number;
  readonly r: number; // capture radius (jaw mouth)
}

export const POCKETS: readonly Pocket[] = [
  { x: 0, y: 0, r: 24 },
  { x: TABLE_W / 2, y: 0, r: 20 },
  { x: TABLE_W, y: 0, r: 24 },
  { x: 0, y: TABLE_H, r: 24 },
  { x: TABLE_W / 2, y: TABLE_H, r: 20 },
  { x: TABLE_W, y: TABLE_H, r: 24 },
];

export const CUE_START = { x: 200, y: TABLE_H / 2 } as const;
