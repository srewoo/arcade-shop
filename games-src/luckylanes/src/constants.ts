// Lane geometry and physics tuning. Units: centimetres, seconds.
// x runs across the lane (0 = centre), y runs from the foul line (0) to the pins.

export const LANE_HALF = 53;
export const GUTTER_WIDTH = 24;
export const BALL_R = 10.9;
export const BALL_MASS = 7;
export const PIN_R = 6;
export const PIN_MASS = 1.5;
export const PIN_SPACING = 30.48;
export const ROW_SPACING = PIN_SPACING * Math.sin(Math.PI / 3);
export const HEAD_Y = 1800;
export const BACK_ROW_Y = HEAD_Y + 3 * ROW_SPACING;
export const PIT_Y = BACK_ROW_Y + 45;
export const SIDE_WALL = LANE_HALF + GUTTER_WIDTH;

export const DT = 1 / 120;
export const MAX_SIM_TIME = 9;

export const MIN_SPEED = 520;
export const MAX_SPEED = 1100;
export const MAX_AIM = 0.075;
export const HOOK_ACCEL = 90;
export const HOOK_START_Y = 700;
export const ROLL_DECEL = 4;

export const BALL_PIN_RESTITUTION = 0.55;
export const PIN_PIN_RESTITUTION = 0.72;
export const CONTACT_FRICTION = 0.25;
export const PIN_SLIDE_DECEL = 190;
export const FALLEN_DECEL = 130;
export const WOBBLE_SPEED = 25;
export const FALL_SPEED = 110;
export const STRESS_DECAY = 0.8;
export const REST_SPEED = 4;
export const FALL_TIME = 0.45;

export const START_X_LIMIT = LANE_HALF - BALL_R - 2;
export const PIN_COUNT = 10;
