// Floating score popups over the board (one per cell, a handful at a time) and the clock delta
// that lives in its own reserved slot beside the time.
import { JUICE } from '../config/juice';
import { $ } from './dom';

const live = new Map<number, HTMLElement>();
let deltaTimer = 0;

function drop(cell: number): void {
  live.get(cell)?.remove();
  live.delete(cell);
}

/** Only positive score popups float over the grid; penalties live on the HUD clock so they never cover notes. */
export function floatsOnBoard(good: boolean): boolean {
  return good;
}

export function scorePopup(cell: number, cellEl: HTMLElement, text: string, good: boolean): void {
  const layer = $('popups');
  drop(cell);
  while (live.size >= JUICE.maxPopups) {
    const oldest = live.keys().next().value;
    if (oldest === undefined) break;
    drop(oldest);
  }
  const wrap = layer.getBoundingClientRect();
  const r = cellEl.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = good ? 'pop' : 'pop bad';
  pop.textContent = text;
  // Keep the text inside the board: it is centred on the cell but clamped from the edges.
  const half = Math.max(22, text.length * 4.5);
  const x = Math.min(Math.max(r.left - wrap.left + r.width / 2, half), Math.max(half, wrap.width - half));
  const y = Math.max(r.top - wrap.top + r.height / 2, 16);
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  layer.append(pop);
  live.set(cell, pop);
  window.setTimeout(() => {
    if (live.get(cell) === pop) live.delete(cell);
    pop.remove();
  }, JUICE.popupLifeMs);
}

export function clockPopup(text: string, good: boolean): void {
  const slot = $('clock-pop');
  window.clearTimeout(deltaTimer);
  slot.classList.remove('show', 'good', 'bad');
  void slot.offsetWidth; // restart the animation
  slot.textContent = text;
  slot.classList.add('show', good ? 'good' : 'bad');
  deltaTimer = window.setTimeout(() => {
    slot.classList.remove('show');
    slot.textContent = '';
  }, JUICE.popupLifeMs);
}

export function clearPopups(): void {
  [...live.keys()].forEach(drop);
  $('clock-pop').classList.remove('show');
  $('clock-pop').textContent = '';
}
