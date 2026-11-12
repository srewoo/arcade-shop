// Seeded star field for the night scene (deterministic: same seed, same sky).
import { createRng } from '../rng';

export interface Star { readonly x: number; readonly y: number; readonly r: number; readonly delay: number }

export function starField(seed: number, count = 34): Star[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => ({
    x: rng.int(2, 98), y: rng.int(2, 34), r: rng.int(2, 6) / 10, delay: rng.int(0, 30) / 10,
  }));
}

export function createStars(seed: number): string {
  const dots = starField(seed).map((s) => `<circle class="star" cx="${s.x}" cy="${s.y}" r="${s.r}" style="animation-delay:-${s.delay}s"/>`).join('');
  return `<svg class="sky" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${dots}</svg>`;
}
