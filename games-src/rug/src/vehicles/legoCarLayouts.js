import { STUD_PITCH, BRICK_HEIGHT, PLATE_HEIGHT } from "./legoBricks.js";

const H = BRICK_HEIGHT; // full brick
const P = PLATE_HEIGHT; // plate
const pitch = STUD_PITCH;

/**
 * Brick list for a lego car model (0 coupe, 1 pickup, 2 van, 3 racer).
 * Tuple: [studsX, studsZ, height, materialKey, x, y, z, "cabin"?]
 * y is relative to the top of the chassis; x forward, z sideways.
 * materialKey: main | accent | grey | dark | glass | head | tail (see legoCar materials).
 * "cabin" bricks are the ones that can be knocked off first / hidden in first person.
 */
export function legoBodyLayout(model) {
  const mirror = (fn) => [fn(-1), fn(1)];
  // headlights (front, at z = +-0.62 studs) and tail lights (rear)
  const lights = (frontX, frontH, rearX, rearH) => [
    ...mirror((s) => [1, 1, P, "head", frontX, frontH, s * pitch, "cabin"]),
    ...mirror((s) => [1, 1, P, "tail", rearX, rearH, s * pitch]),
  ];
  const bumpers = [
    [1, 4, P * 2, "accent", 3.1, -P, 0],
    [1, 4, P * 2, "accent", -3.1, -P, 0],
  ];
  if (model === 1) {
    return [
      [3, 4, H, "main", 2.17, 0, 0],
      ...mirror((s) => [3, 1, H, "main", 0, 0, s * 0.93]),
      [1, 4, H, "glass", 0.93, H, 0, "cabin"],
      [1, 4, H, "main", -0.93, H, 0, "cabin"],
      [4, 4, P, "accent", 0, H * 2, 0, "cabin"],
      ...mirror((s) => [4, 1, H, "main", -2.17, 0, s * 0.93]),
      [1, 2, H, "accent", -3.1 + 0.31, 0, 0],
      [2, 2, H, "grey", -2, 0, 0],
      ...bumpers,
      ...lights(2.8, H, -2.8, H),
    ];
  }
  if (model === 2) {
    return [
      [2, 4, H, "main", 2.48, 0, 0],
      ...mirror((s) => [7, 1, H, "main", -0.62, 0, s * 0.93]),
      ...mirror((s) => [5, 1, H, "accent", -1.24, H, s * 0.93]),
      [1, 4, H, "glass", 1.55, 0, 0, "cabin"],
      [1, 4, H, "glass", 1.24, H, 0, "cabin"],
      [1, 4, H * 2, "main", -2.8, 0, 0],
      [7, 4, P, "main", -0.62, H * 2, 0, "cabin"],
      [3, 2, P, "accent", -0.93, H * 2 + P, 0, "cabin"],
      ...bumpers,
      ...lights(2.8, H, -2.8, H * 2),
    ];
  }
  if (model === 3) {
    return [
      [3, 2, P * 2, "main", 2.48, 0, 0],
      [2, 4, P, "accent", 3.1, -P, 0],
      ...mirror((s) => [4, 1, H, "main", -0.3, 0, s * 0.93]),
      ...mirror((s) => [2, 1, P * 2, "accent", 1.3, 0, s * 0.93]),
      [2, 2, H, "grey", -2, 0, 0],
      [1, 2, H, "dark", -2.8, H, 0],
      [3, 6, P, "accent", -2.8, H * 2, 0],
      ...mirror((s) => [1, 1, P, "head", 3.1, 0, s * 0.62]),
      [1, 4, P * 2, "accent", -3.1, -P, 0],
    ];
  }
  // model 0: coupe
  return [
    [3, 4, H, "main", 2.17, 0, 0],
    ...mirror((s) => [4, 1, H, "main", -0.31, 0, s * 0.93]),
    [3, 4, H, "main", -2.17, 0, 0],
    [1, 4, H, "glass", 0.93, H, 0, "cabin"],
    [1, 4, H, "main", -1.55, H, 0, "cabin"],
    [5, 4, P, "main", -0.31, H * 2, 0, "cabin"],
    [2, 2, P, "accent", -0.31, H * 2 + P, 0, "cabin"],
    [1, 4, P * 2, "dark", -2.8, H, 0],
    [2, 6, P, "accent", -2.8, H + P * 2, 0],
    ...bumpers,
    ...lights(2.8, H, -2.8, H),
  ];
}
