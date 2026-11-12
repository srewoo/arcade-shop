// Small drawing helpers shared by the ship, shot and background renderers.
export type Ctx = CanvasRenderingContext2D;
export type Pt = readonly [number, number];

export function poly(c: Ctx, pts: readonly Pt[], fill: string | CanvasGradient, stroke?: string, lw = 1.2): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.lineWidth = lw;
    c.lineJoin = 'round';
    c.strokeStyle = stroke;
    c.stroke();
  }
}

export const vgrad = (c: Ctx, y0: number, y1: number, top: string, bottom: string): CanvasGradient => {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
};

export const hgrad = (c: Ctx, x0: number, x1: number, stops: readonly (readonly [number, string])[]): CanvasGradient => {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
};

/** Soft additive glow. */
export function glow(c: Ctx, x: number, y: number, r: number, color: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

/** Stroke a polyline as a thin highlight (panel lines, edge light). */
export function line(c: Ctx, pts: readonly Pt[], color: string, lw = 0.7): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.strokeStyle = color;
  c.stroke();
}

export function dot(c: Ctx, x: number, y: number, r: number, color: string): void {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

/** Ground shadow: the same outline, darkened and offset, so it reads as the plane's silhouette. */
export function castShadow(c: Ctx, pts: readonly Pt[], dx = 7, dy = 14, alpha = 0.16): void {
  c.save();
  c.translate(dx, dy);
  c.globalAlpha = alpha;
  poly(c, pts, '#020812');
  c.restore();
}

/** Offscreen canvas rendered once; draw it many times with drawImage. */
export function sprite(w: number, h: number, scale: number, draw: (c: Ctx) => void): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w * scale);
  cv.height = Math.ceil(h * scale);
  const c = cv.getContext('2d');
  if (c) {
    c.scale(scale, scale);
    draw(c);
  }
  return cv;
}

/** Volume shading: light from the upper left, shade on the right, clipped to the polygon. */
export function shade(c: Ctx, pts: readonly Pt[], half: number, strength = 1): void {
  c.save();
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  c.clip();
  c.fillStyle = hgrad(c, -half, half, [
    [0, `rgba(255,255,255,${0.34 * strength})`],
    [0.45, 'rgba(255,255,255,0)'],
    [1, `rgba(4,10,30,${0.42 * strength})`],
  ]);
  c.fillRect(-half - 4, -60, half * 2 + 8, 120);
  c.restore();
}
