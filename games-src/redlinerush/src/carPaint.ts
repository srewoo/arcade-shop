// Vehicle painters. Each draws one car centred on the origin, front pointing up, light from the top-left.
// They run once per variant into a cached sprite (see renderCar.ts), so gradients here are free per frame.
export interface Shades { main: string; light: string; dark: string; deep: string }

export const shades = (hue: number, sat: number, light: number): Shades => ({
  main: `hsl(${hue} ${sat}% ${light}%)`,
  light: `hsl(${hue} ${Math.min(100, sat + 6)}% ${Math.min(92, light + 16)}%)`,
  dark: `hsl(${hue} ${sat}% ${Math.max(10, light - 20)}%)`,
  deep: `hsl(${hue} ${sat}% ${Math.max(6, light - 34)}%)`,
});

type G = CanvasRenderingContext2D;

/** Car outline with a tapered nose and rounded tail. */
export function outline(g: G, w: number, h: number, inset = 0): void {
  const hw = w / 2 - inset;
  const hh = h / 2 - inset;
  g.beginPath();
  g.moveTo(-hw * 0.8, -hh);
  g.bezierCurveTo(-hw * 0.5, -hh - 1.6, hw * 0.5, -hh - 1.6, hw * 0.8, -hh);
  g.bezierCurveTo(hw * 1.02, -hh * 0.9, hw, -hh * 0.6, hw, -hh * 0.4);
  g.lineTo(hw, hh * 0.62);
  g.bezierCurveTo(hw, hh * 0.86, hw * 0.92, hh, hw * 0.68, hh);
  g.lineTo(-hw * 0.68, hh);
  g.bezierCurveTo(-hw * 0.92, hh, -hw, hh * 0.86, -hw, hh * 0.62);
  g.lineTo(-hw, -hh * 0.4);
  g.bezierCurveTo(-hw, -hh * 0.6, -hw * 1.02, -hh * 0.9, -hw * 0.8, -hh);
  g.closePath();
}

export function tyres(g: G, w: number, ys: readonly number[]): void {
  for (const y of ys) {
    for (const s of [-1, 1]) {
      const x = s * (w / 2 + 0.2);
      g.fillStyle = '#0b0e12';
      g.beginPath();
      g.roundRect(x - 2.6, y - 6.5, 5.2, 13, 1.6);
      g.fill();
      g.fillStyle = 'rgba(190,200,215,0.35)';
      g.fillRect(x + (s > 0 ? 0.4 : -1.4), y - 4, 1, 8);
    }
  }
}

export function bodyShell(g: G, w: number, h: number, c: Shades, blur: number): void {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)';
  g.shadowBlur = blur;
  g.shadowOffsetX = blur * 0.35;
  g.shadowOffsetY = blur * 0.55;
  outline(g, w, h);
  g.fillStyle = c.dark;
  g.fill();
  g.restore();
  const grad = g.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, c.light);
  grad.addColorStop(0.35, c.main);
  grad.addColorStop(1, c.dark);
  outline(g, w, h);
  g.fillStyle = grad;
  g.fill();
  // Silhouette edge in the mid tone keeps the car readable on dark asphalt; a fine dark seam sits inside it.
  g.lineWidth = 1.6;
  g.strokeStyle = c.main;
  g.stroke();
  outline(g, w, h, 1.3);
  g.lineWidth = 0.6;
  g.strokeStyle = c.deep;
  g.stroke();
  // Rim light on the lit (top-left) edge.
  g.save();
  outline(g, w, h, 1);
  g.lineWidth = 0.8;
  g.strokeStyle = 'rgba(255,255,255,0.4)';
  g.setLineDash([h * 0.5, h * 2]);
  g.lineDashOffset = -h * 0.55;
  g.stroke();
  g.restore();
}

export function glassPane(g: G, x: number, y: number, w: number, h: number, r: number): void {
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#34506b');
  grad.addColorStop(0.5, '#142234');
  grad.addColorStop(1, '#0a121c');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.beginPath();
  g.moveTo(x + w * 0.1, y + h);
  g.lineTo(x + w * 0.42, y);
  g.lineTo(x + w * 0.62, y);
  g.lineTo(x + w * 0.3, y + h);
  g.fill();
  g.restore();
}

export function roofPanel(g: G, x: number, y: number, w: number, h: number, c: Shades): void {
  const grad = g.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, c.light);
  grad.addColorStop(1, c.main);
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(x, y, w, h, 3);
  g.fill();
  g.strokeStyle = c.dark;
  g.lineWidth = 0.7;
  g.stroke();
}

export function headLamps(g: G, w: number, h: number): void {
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 6.5);
    const y = -h / 2 + 2.4;
    const rg = g.createRadialGradient(x, y, 0.5, x, y, 9);
    rg.addColorStop(0, 'rgba(255,245,190,0.6)');
    rg.addColorStop(1, 'rgba(255,245,190,0)');
    g.fillStyle = rg;
    g.fillRect(x - 9, y - 9, 18, 18);
    g.fillStyle = '#fffbe6';
    g.beginPath();
    g.roundRect(x - 3.4, y - 1.6, 6.8, 3.4, 1.4);
    g.fill();
  }
}

export function tailLamps(g: G, w: number, h: number): void {
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 6.5);
    const y = h / 2 - 2.6;
    const rg = g.createRadialGradient(x, y, 0.5, x, y, 10);
    rg.addColorStop(0, 'rgba(255,70,50,0.55)');
    rg.addColorStop(1, 'rgba(255,70,50,0)');
    g.fillStyle = rg;
    g.fillRect(x - 10, y - 10, 20, 20);
    g.fillStyle = '#ff3b2c';
    g.beginPath();
    g.roundRect(x - 3.6, y - 1.5, 7.2, 3, 1.2);
    g.fill();
    g.fillStyle = '#ffb4a8';
    g.fillRect(x - 2.6, y - 0.9, 3, 0.9);
  }
}

export function sedanTop(g: G, w: number, h: number, c: Shades): void {
  const hw = w / 2;
  // Hood crease and trunk line.
  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(0, -h / 2 + 4);
  g.lineTo(0, -h * 0.22);
  g.stroke();
  g.strokeStyle = c.dark;
  g.beginPath();
  g.moveTo(-hw + 4, h * 0.36);
  g.lineTo(hw - 4, h * 0.36);
  g.stroke();
  glassPane(g, -hw + 4.5, -h * 0.22, w - 9, h * 0.15, 3);
  roofPanel(g, -hw + 5, -h * 0.075, w - 10, h * 0.26, c);
  glassPane(g, -hw + 5.5, h * 0.185, w - 11, h * 0.11, 2.5);
  for (const s of [-1, 1]) {
    g.fillStyle = c.dark;
    g.beginPath();
    g.ellipse(s * (hw + 1.2), -h * 0.17, 2.2, 1.5, 0, 0, 7);
    g.fill();
  }
}

export function taxiSign(g: G, h: number): void {
  const grad = g.createLinearGradient(0, 0, 0, 5);
  grad.addColorStop(0, '#fff8d6');
  grad.addColorStop(1, '#ffd23f');
  g.fillStyle = '#10151c';
  g.beginPath();
  g.roundRect(-7, h * 0.02 - 0.8, 14, 6.6, 1.6);
  g.fill();
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(-6, h * 0.02 + 0.2, 12, 4.4, 1);
  g.fill();
  g.fillStyle = '#10151c';
  for (let i = 0; i < 6; i++) if (i % 2 === 0) g.fillRect(-6 + i * 2, h * 0.02 + 5.8, 2, 1.2);
}

export function vanTop(g: G, w: number, h: number, c: Shades): void {
  const hw = w / 2;
  glassPane(g, -hw + 4.5, -h * 0.4, w - 9, h * 0.14, 3);
  roofPanel(g, -hw + 3.5, -h * 0.23, w - 7, h * 0.58, c);
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 1.2;
  for (const y of [-h * 0.08, h * 0.14, h * 0.3]) { g.beginPath(); g.moveTo(-hw + 5, y); g.lineTo(hw - 5, y); g.stroke(); }
  g.fillStyle = 'rgba(16,21,28,0.35)';
  g.fillRect(-1.2, -h * 0.2, 2.4, h * 0.52);
  g.fillStyle = c.deep;
  g.fillRect(-hw + 3.5, h * 0.37, w - 7, 1.4);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.fillRect(-hw + 5, h * 0.4, w - 10, 1.8);
}

export function truckTop(g: G, w: number, h: number, c: Shades): void {
  const hw = w / 2;
  const cab = 20;
  const box = g.createLinearGradient(-hw, 0, hw, 0);
  box.addColorStop(0, '#f1f4f8');
  box.addColorStop(0.5, '#d3d9e1');
  box.addColorStop(1, '#a5aebb');
  g.fillStyle = box;
  g.beginPath();
  g.roundRect(-hw + 1, -h / 2 + cab, w - 2, h - cab - 1, 3);
  g.fill();
  g.strokeStyle = '#6b7482';
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = 'rgba(20,28,38,0.2)';
  for (let y = -h / 2 + cab + 8; y < h / 2 - 6; y += 10) g.fillRect(-hw + 3, y, w - 6, 1.6);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillRect(-hw + 3, -h / 2 + cab + 3, 3, h - cab - 8);
  g.fillStyle = c.main;
  g.fillRect(-hw + 1, h / 2 - 10, w - 2, 3);
  glassPane(g, -hw + 4, -h / 2 + 4.5, w - 8, 7, 2.5);
  roofPanel(g, -hw + 3, -h / 2 + 12.5, w - 6, 7, c);
}
