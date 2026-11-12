// "+N" that flies from the lane banner into the frame cell it scored in.
import { frameIndexOfLastRoll } from '../provisional';

const FLY_MS = 750;
const FLASH_MS = 700;

function targetCell(board: HTMLElement, player: number, frame: number): HTMLElement | null {
  const block = board.children.item(player);
  return block?.querySelector<HTMLElement>(`.frames > .f:nth-child(${frame + 1})`) ?? null;
}

function flash(cell: HTMLElement, reduce: boolean): void {
  cell.dataset.flash = reduce ? 'still' : 'pop';
  window.setTimeout(() => { delete cell.dataset.flash; }, FLASH_MS);
}

function centre(r: DOMRect): { x: number; y: number } {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Fly "+pins" from `from` to the scoreboard cell. Reduce motion: no flight, just a highlight on the cell. */
export function flyScore(board: HTMLElement, from: HTMLElement, player: number, rolls: readonly number[], pins: number, reduce: boolean): void {
  if (pins <= 0) return;
  const frame = frameIndexOfLastRoll(rolls);
  // The board re-renders on the next animation frame; wait for it so the target cell exists.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const cell = targetCell(board, player, frame);
    if (!cell) return;
    if (reduce || typeof cell.animate !== 'function') { flash(cell, true); return; }
    const a = centre(from.getBoundingClientRect()), b = centre(cell.getBoundingClientRect());
    const node = document.createElement('span');
    node.className = 'fly';
    node.textContent = `+${pins}`;
    node.setAttribute('aria-hidden', 'true');
    document.body.append(node);
    const anim = node.animate(
      [
        { transform: `translate(${a.x}px, ${a.y}px) translate(-50%, -50%) scale(1.5)`, opacity: 1 },
        { transform: `translate(${b.x}px, ${b.y}px) translate(-50%, -50%) scale(0.8)`, opacity: 0.9 },
      ],
      { duration: FLY_MS, easing: 'cubic-bezier(0.5, 0, 0.7, 0.4)', fill: 'forwards' },
    );
    const done = (): void => { node.remove(); flash(cell, false); };
    anim.onfinish = done;
    anim.oncancel = () => node.remove();
  }));
}
