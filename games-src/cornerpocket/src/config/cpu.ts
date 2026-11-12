// CPU opponent tuning.
export const CPU = Object.freeze({
  noise: { easy: 0.035, pro: 0.003 } as const, // aim sd, radians
  powerNoise: { easy: 0.08, pro: 0.01 } as const,
  runnerUpChance: 0.4, // Easy: chance to take the second-best candidate
  candidates: 40,
  placementCandidates: 8,
  simSeconds: 14,
  thinkSeconds: 0.7, // before the aim line shows
  showSeconds: 0.8, // aim line visible before firing
  workPerFrame: 2, // candidate simulations per animation frame (about 4 ms each), so planning never blocks a frame
});
