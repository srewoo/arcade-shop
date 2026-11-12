// The boss gunship: armoured plates, glowing engines, a pulsing reactor core.
import { castShadow, dot, glow, hgrad, line, poly, shade, vgrad, type Ctx, type Pt } from './renderKit';

const BODY: readonly Pt[] = [[0, 34], [36, 6], [50, -14], [26, -24], [0, -32], [-26, -24], [-50, -14], [-36, 6]];

export function drawBoss(c: Ctx, hurt: boolean, t: number): void {
  c.scale(1.2, 1.2);
  const edge = hurt ? '#ffffff' : '#0a1220';
  castShadow(c, BODY);
  const pulse = 0.6 + 0.4 * Math.sin(t * 6);
  for (const x of [-22, 22]) {
    glow(c, x, -22, 26, 'rgba(255,120,60,0.5)');
    glow(c, x, -26, 10, `rgba(255,220,150,${0.3 + 0.3 * pulse})`);
  }
  poly(c, BODY, hurt ? '#ffffff' : vgrad(c, -32, 34, '#8ea2c2', '#38455e'), edge, 2);
  if (!hurt) shade(c, BODY, 50, 1);
  for (const s of [-1, 1] as const) {
    poly(c, [[s * 50, -14], [s * 60, 4], [s * 44, 8], [s * 36, 6]], hgrad(c, 36, 60, [[0, '#45546f'], [1, '#222c3f']]), edge);
    poly(c, [[s * 42, -6], [s * 31, 14], [s * 23, -6]], '#ffb020', edge);
    poly(c, [[s * 38, -4], [s * 32, 8], [s * 28, -4]], 'rgba(255,240,170,0.55)');
    line(c, [[s * 8, -28], [s * 26, -10], [s * 34, 4]], 'rgba(10,18,32,0.7)', 1.1);
    line(c, [[s * 12, 12], [s * 24, 2]], 'rgba(10,18,32,0.55)', 1);
    dot(c, s * 46, 3, 1.6, pulse > 0.8 ? '#ff5b6e' : '#6d2330');
  }
  poly(c, [[0, 24], [17, 0], [0, -15], [-17, 0]], vgrad(c, -15, 24, '#ff8a6a', '#b52f2a'), edge);
  poly(c, [[0, 18], [10, 0], [0, -9], [-10, 0]], 'rgba(30,6,6,0.45)');
  glow(c, 0, 4, 16, `rgba(255,210,140,${0.35 + 0.35 * pulse})`);
  dot(c, 0, 4, 4, `rgba(255,240,170,${pulse})`);
}
