// Medal targets. Par = the autopilot's (top 37, aLat 92) clean lap time on each map, measured with the
// headless sweep in docs/balance.md; thresholds are multiples of it. Read-only for UI, never feeds the sim.
export const MEDAL_MULTIPLIERS = Object.freeze({ gold: 1.04, silver: 1.12, bronze: 1.25 });

/** Par seconds per lap by map id (filled by the balance sweep; maps without an entry have no medals). */
export const PAR_LAP_SECONDS = Object.freeze({
  sol: 22.03,
  "sol-twist": 22.25,
  "sol-mirror": 19.75,
  claude: 16.55,
  "claude-bend": 17.64,
  "claude-wild": 18.91,
  round: 13.06,
  runner: 13.2,
});
