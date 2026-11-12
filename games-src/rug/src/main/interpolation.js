// Render interpolation: the sim runs at a fixed 240 Hz; the pose that is drawn is blended between the
// previous and the current step by alpha = accumulator / step. Only the poses used for drawing are swapped
// (and restored after the frame), the simulation state is never changed.
import { FIXED_STEP } from "../config/constants.js";
import { blendPose, renderAlpha } from "../logic/interp.js";

const saved = [];

/** Remember the pose before a step (call at the start of every sim step). */
export function snapshotPoses(cars) {
  for (const car of cars) {
    const p = car.prevPose ?? (car.prevPose = { x: car.x, y: car.y, z: car.z, a: car.a });
    p.x = car.x;
    p.y = car.y;
    p.z = car.z;
    p.a = car.a;
  }
}

/** Swap in blended poses for drawing. Pair with restorePoses(). */
export function applyBlend(cars, accumulator) {
  const alpha = renderAlpha(accumulator, FIXED_STEP);
  saved.length = 0;
  for (const car of cars) {
    saved.push(car.x, car.y, car.z, car.a);
    if (car.grabbed || !car.prevPose) continue;
    const pose = blendPose(car.prevPose, car, alpha);
    car.x = pose.x;
    car.y = pose.y;
    car.z = pose.z;
    car.a = pose.a;
  }
}

export function restorePoses(cars) {
  cars.forEach((car, i) => {
    car.x = saved[i * 4];
    car.y = saved[i * 4 + 1];
    car.z = saved[i * 4 + 2];
    car.a = saved[i * 4 + 3];
  });
}
