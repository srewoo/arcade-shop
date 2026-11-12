// Balance telemetry for tuning from real play (debug only, in memory): deaths by obstacle kind and time to death.
export function createTelemetry() {
  return { runs: 0, deaths: {}, timesToDeath: [] };
}

/** Record a crash of `kind` after `runTime` seconds of play. */
export function recordDeath(t, kind, runTime) {
  t.runs++;
  const key = kind ?? 'none';
  t.deaths[key] = (t.deaths[key] ?? 0) + 1;
  t.timesToDeath.push(Math.round(runTime * 10) / 10);
  if (t.timesToDeath.length > 500) t.timesToDeath.shift();
}

/** { runs, byKind, medianS } summary for the console. */
export function summarize(t) {
  const sorted = [...t.timesToDeath].sort((a, b) => a - b);
  return { runs: t.runs, byKind: { ...t.deaths }, medianS: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0 };
}

export const telemetry = createTelemetry();
