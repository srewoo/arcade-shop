// "Copy seed link": the simulation is seeded, so a link replays the same shape order.
import { S } from '../strings';

export const seedUrl = (origin: string, path: string, seed: number): string => `${origin}${path}?seed=${seed}`;

export async function copySeed(seed: number, out: HTMLElement | null): Promise<void> {
  const url = seedUrl(location.origin, location.pathname, seed);
  try {
    await navigator.clipboard.writeText(url);
    if (out) out.textContent = S.result.copied;
  } catch {
    if (out) out.textContent = url; // clipboard blocked: show the link instead
  }
}
