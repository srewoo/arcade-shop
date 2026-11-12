// Deterministic star positions (seeded, so scenery never flickers between renders).
export interface Star { x: number; y: number; depth: number; phase: number }

export function starfield(count: number, seed: number): Star[] {
  let s = seed >>> 0 || 1;
  const rnd = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out: Star[] = [];
  for (let i = 0; i < count; i++) out.push({ x: rnd(), y: rnd(), depth: rnd(), phase: rnd() * 6.28 });
  return out;
}
