// Colour maths for contrast and colour-vision-deficiency checks (tests and tooling).
export type Rgb = readonly [number, number, number];
export type Cvd = 'protan' | 'deutan' | 'tritan';

export const parseHex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as unknown as Rgb;
const lin = (c: number): number => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const gam = (v: number): number => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export const luminance = (c: Rgb): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Machado, Oliveira, Fernandes 2009, severity 1.0, applied in linear RGB.
const MATRIX: Record<Cvd, readonly (readonly number[])[]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

export function simulate(c: Rgb, kind: Cvd): Rgb {
  const l = c.map(lin);
  const m = MATRIX[kind];
  const o = m.map((row) => Math.min(1, Math.max(0, row.reduce((s, k, j) => s + k * (l[j] as number), 0))));
  return [gam(o[0] as number), gam(o[1] as number), gam(o[2] as number)];
}

function lab(c: Rgb): [number, number, number] {
  const [r, g, b] = c.map(lin) as [number, number, number];
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 delta-E. */
export function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Smallest pairwise delta-E of a colour list under an optional CVD simulation. */
export function minPairDeltaE(colors: readonly Rgb[], kind?: Cvd): number {
  const list = kind ? colors.map((c) => simulate(c, kind)) : colors;
  let min = Infinity;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) min = Math.min(min, deltaE(list[i] as Rgb, list[j] as Rgb));
  return min;
}
