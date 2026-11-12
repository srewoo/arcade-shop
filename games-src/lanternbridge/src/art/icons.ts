// Icon geometry generated in code (no external assets).

/** Closed SVG path for a cog: `teeth` trapezoid teeth between radii `inner` and `outer`, centred on (cx, cy). */
export function gearPath(teeth = 8, outer = 10, inner = 7.6, cx = 12, cy = 12): string {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  const pt = (a: number, r: number): string => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    pts.push(pt(a - step * 0.32, inner), pt(a - step * 0.17, outer), pt(a + step * 0.17, outer), pt(a + step * 0.32, inner));
  }
  return `M${pts.join('L')}Z`;
}

export const cogIcon = (): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${gearPath()}"/><circle cx="12" cy="12" r="3.2"/></svg>`;
