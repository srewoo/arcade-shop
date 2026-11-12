// Pre-rendered noise tiles used as repeating patterns (turf speckle, rough, sand grain).
import { rng } from './rng';

function tile(size: number, draw: (c: CanvasRenderingContext2D, r: () => number) => void, seed: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d');
  if (c) draw(c, rng(seed));
  return cv;
}

let cache: { speckle: HTMLCanvasElement; rough: HTMLCanvasElement; grain: HTMLCanvasElement } | null = null;

export function textures(): { speckle: HTMLCanvasElement; rough: HTMLCanvasElement; grain: HTMLCanvasElement } {
  cache ??= {
    speckle: tile(256, (c, r) => {
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,30,10,0.12)';
        c.fillRect(r() * 256, r() * 256, 1 + r() * 1.5, 1 + r() * 1.5);
      }
      c.lineWidth = 1;
      for (let i = 0; i < 700; i++) {
        const x = r() * 256;
        const y = r() * 256;
        c.strokeStyle = r() < 0.5 ? 'rgba(200,255,190,0.16)' : 'rgba(0,40,15,0.18)';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4); c.stroke();
      }
    }, 11),
    rough: tile(256, (c, r) => {
      for (let i = 0; i < 3200; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(90,170,100,0.13)' : 'rgba(0,20,8,0.22)';
        c.fillRect(r() * 256, r() * 256, 1 + r() * 2.2, 1 + r() * 2.2);
      }
    }, 23),
    grain: tile(128, (c, r) => {
      for (let i = 0; i < 900; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(255,248,214,0.55)' : 'rgba(120,88,30,0.4)';
        const s = 0.5 + r() * 1.1;
        c.fillRect(r() * 128, r() * 128, s, s);
      }
    }, 37),
  };
  return cache;
}
