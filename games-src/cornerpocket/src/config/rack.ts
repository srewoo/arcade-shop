// Rack Attack tuning: time economy and scoring. Values marked (v1) are the original game.
export const RACK = Object.freeze({
  scratchPenalty: 5, // seconds (v1)
  cleanSweepSeconds: 10, // seconds (v1)
  baseSeconds: 15, // rack time = base + perBall * balls (v1)
  perBallSeconds: 5, // (v1)
  comboBonusCap: 3, // max seconds earned per pot (v1: 5)
  comboPoints: 100, // points per pot = comboPoints * combo (v1)
  holeInOnePoints: 250, // (v1)
  cleanSweepPoints: 500, // (v1)
  clearPointsPerRack: 200, // (v1)
  startOnFirstShot: true, // clock waits for the first shot (new)
  rampFromRack: 4, // from this rack on, each rack gives less time (new)
  rampSeconds: 5, // seconds removed per rack past rampFromRack (new)
  minRackSeconds: 15, // floor for the ramp (new)
  lowTimeSeconds: 10, // tick sound starts below this
  fastTickSeconds: 5, // tick sound doubles below this
});
