/** Car handling / physics tuning (original: ze). Units: world units (rug) and seconds. */
export const PHYSICS = {
  top: 37, // top speed
  boostTop: 54, // top speed while boosting (player)
  aiBoostTop: 50, // RE: boost top speed for AI cars
  accel: 34,
  boostAccel: 62,
  brake: 60,
  offroad: 0.58, // RE: speed factor off the road (on the pile)
  pond: 0.42, // RE: speed factor in water
  turn: 3.5, // steering rate
  grip: 11,
  offGrip: 7.3, // grip off-road
  slide: 0.25,
  jumpV: 17,
  gravity: 40,
  boostFill: 1 / 7, // boost meter gained per pickup
  spinImpact: 17, // impact speed that spins the car
};

/** Car collision size (original: wr). RE: radius = collision circle, axle = wheelbase. */
export const CAR_SIZE = { radius: 1.45, axle: 1.6 };
