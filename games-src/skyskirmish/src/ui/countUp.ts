// Counts a number up in a node (the results score payoff). Jumps straight to the end with reduced motion.
import { countValue } from '../summary';

export function countUp(node: HTMLElement, target: number, ms: number, reduce: boolean): void {
  const fmt = (n: number): string => n.toLocaleString('en-US');
  if (reduce || ms <= 0 || target <= 0) {
    node.textContent = fmt(target);
    return;
  }
  node.textContent = '0';
  const t0 = performance.now();
  const tick = (now: number): void => {
    if (!node.isConnected) return;
    const t = (now - t0) / 1000;
    node.textContent = fmt(countValue(target, t, ms / 1000));
    if (t < ms / 1000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
