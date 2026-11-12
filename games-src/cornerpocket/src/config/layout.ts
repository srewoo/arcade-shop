// Canvas/HUD layout numbers.
export const LAYOUT = Object.freeze({
  dprCap: 2,
  textMinPx: 15,
  textMaxPx: 30,
  textWidthFraction: 0.92, // float text may use this much of the canvas width
  numberMinScreenPx: 11, // ball numbers never render smaller than this on screen
  stickLength: 260,
  stickFade: 60, // table px over which the cue fades out
  stickMargin: 6,
  textLiftBalls: 2.6, // float text sits this many ball radii above the cue ball
  coachSeconds: 9, // first-run hint fades out by itself after this long
  resultDelaySeconds: 0.7, // payoff plays on the table before the result card appears
  resultDelayReduced: 0.25,
  textAnchor: 0.2, // first float-text line sits this far along the table's long axis; later lines stack below it
});
