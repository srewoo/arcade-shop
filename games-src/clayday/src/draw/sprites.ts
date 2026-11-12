// Pre-rendered sprites for the backdrop and effects: trees, clouds, soft puffs. Baked once, blitted per frame.
import { PALETTE as P } from '../palette';

const RES = 2;
const cache = new Map<string, HTMLCanvasElement>();

export function baked(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void, res = RES): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * res);
  c.height = Math.ceil(h * res);
  const g = c.getContext('2d')!;
  g.scale(res, res);
  paint(g);
  cache.set(key, c);
  return c;
}

/** Deciduous tree, 100 wide x 140 tall: trunk at the bottom centre (x 50, y 136), layered lit crown. */
export function treeSprite(variant: number): HTMLCanvasElement {
  const v = variant % 3;
  return baked(`tree${v}`, 100, 140, (g) => {
    g.fillStyle = 'rgba(8,24,10,0.28)';
    g.beginPath();
    g.ellipse(58, 134, 30, 6, 0, 0, Math.PI * 2);
    g.fill();
    const trunk = g.createLinearGradient(44, 0, 56, 0);
    trunk.addColorStop(0, '#5a3d24');
    trunk.addColorStop(1, '#3a2614');
    g.fillStyle = trunk;
    g.beginPath();
    g.moveTo(45, 136); g.lineTo(48, 84); g.lineTo(53, 84); g.lineTo(56, 136);
    g.fill();
    const blobs: Array<[number, number, number]> = v === 0
      ? [[50, 56, 38], [30, 70, 24], [70, 72, 25], [50, 36, 26]]
      : v === 1 ? [[50, 60, 34], [32, 52, 24], [68, 54, 24], [50, 30, 24], [50, 82, 22]] : [[50, 52, 30], [50, 78, 28], [50, 28, 20], [34, 64, 22], [66, 64, 22]];
    for (const [x, y, r] of blobs) {
      const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      gr.addColorStop(0, '#5fae52');
      gr.addColorStop(0.55, P.treeLight);
      gr.addColorStop(1, P.treeDark);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(210,255,190,0.16)';
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(34 + ((i * 37) % 34), 28 + ((i * 53) % 40), 3 + (i % 3), 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Fluffy cumulus 260 x 110: bright top, blue-grey underside. */
export function cloudSprite(variant: number): HTMLCanvasElement {
  const v = variant % 3;
  return baked(`cloud${v}`, 260, 110, (g) => {
    const puffs: Array<[number, number, number]> = v === 0
      ? [[60, 64, 34], [100, 50, 44], [150, 56, 40], [196, 68, 30], [130, 72, 36]]
      : v === 1 ? [[50, 66, 28], [90, 52, 38], [136, 46, 36], [180, 60, 34], [214, 72, 24], [120, 74, 34]]
        : [[70, 68, 30], [112, 54, 42], [162, 62, 34], [140, 78, 30]];
    for (const [x, y, r] of puffs) {
      const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.5, r * 0.1, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.96)');
      gr.addColorStop(0.7, 'rgba(240,247,255,0.9)');
      gr.addColorStop(1, 'rgba(190,210,232,0.85)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const base = g.createLinearGradient(0, 60, 0, 108);
    base.addColorStop(0, 'rgba(160,182,210,0)');
    base.addColorStop(1, 'rgba(150,172,204,0.55)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = base;
    g.fillRect(0, 60, 260, 50);
  });
}

/** Soft round puff in the given colour (radial alpha falloff). 64 px square. */
export function puffSprite(color: string): HTMLCanvasElement {
  return baked(`puff${color}`, 64, 64, (g) => {
    g.fillStyle = color;
    g.shadowColor = color;
    g.shadowBlur = 10;
    g.beginPath();
    g.arc(32, 32, 18, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    const hole = g.createRadialGradient(26, 26, 2, 32, 32, 30);
    hole.addColorStop(0, 'rgba(255,255,255,0.35)');
    hole.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = hole;
    g.fillRect(0, 0, 64, 64);
  });
}
