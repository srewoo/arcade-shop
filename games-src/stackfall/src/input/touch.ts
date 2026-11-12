// Touch gestures on the play surface: swipe left/right to shift, swipe down
// to soft drop, swipe up to hard drop, tap to rotate.
import { touchTuning as T } from '../config/tuning';
import type { Controls } from './controls';

export function attachTouch(el: HTMLElement, controls: Controls, cellPx: () => number, active: () => boolean, minStep: () => number = () => T.minStepPx): void {
  let id = -1;
  let x0 = 0, y0 = 0, anchorX = 0, t0 = 0, moved = 0;
  let soft = false;

  const end = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = -1;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    const dt = performance.now() - t0;
    if (soft) controls.setVirtual('down', false);
    soft = false;
    if (e.type === 'pointercancel' || !active()) return;
    if (moved < T.tapMovePx && dt < T.tapMaxMs) controls.pulse('rotCW');
    else if (dy < -T.hardDropPx && Math.abs(dy) > Math.abs(dx) * 1.5 && dt < T.hardDropMaxMs) controls.pulse('hard');
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !active()) return;
    id = e.pointerId;
    x0 = anchorX = e.clientX;
    y0 = e.clientY;
    t0 = performance.now();
    moved = 0;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id || !active()) return;
    const step = Math.max(minStep(), cellPx() * T.stepCellFactor);
    moved = Math.max(moved, Math.hypot(e.clientX - x0, e.clientY - y0));
    while (e.clientX - anchorX > step) { controls.step(1); anchorX += step; }
    while (anchorX - e.clientX > step) { controls.step(-1); anchorX -= step; }
    const dy = e.clientY - y0;
    const shouldSoft = dy > step * T.softDropSteps && dy > Math.abs(e.clientX - x0);
    if (shouldSoft !== soft) {
      soft = shouldSoft;
      controls.setVirtual('down', soft);
    }
  });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
