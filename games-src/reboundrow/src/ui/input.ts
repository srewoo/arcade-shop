// Mouse, touch and keyboard input. Produces an absolute target (pointer) or an axis (keys).

export interface InputSnapshot { targetX: number | null; axis: number }
export interface InputHandle {
  snapshot(): InputSnapshot;
  takeLaunch(): boolean;
  hasLaunch(): boolean;
  clearLaunch(): void;
  clearHeld(): void;
  requestLaunch(): void;
}
export interface KeyActions { onPause(): void; onMute(): void }

const isFormTarget = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'SUMMARY');

export interface FieldMap { scale: number; offX: number }

export function createInput(canvas: HTMLCanvasElement, actions: KeyActions, allowKeys: () => boolean, map: FieldMap): InputHandle {
  let targetX: number | null = null;
  let left = false;
  let right = false;
  let launch = false;
  const toField = (clientX: number): number => {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left - map.offX) / Math.max(0.01, map.scale);
  };
  canvas.addEventListener('pointermove', (e) => {
    targetX = toField(e.clientX);
  });
  canvas.addEventListener('pointerdown', (e) => {
    targetX = toField(e.clientX);
    launch = true;
    canvas.focus({ preventScroll: true });
  });
  const keyDown = (e: KeyboardEvent): void => {
    if (e.key === 'm' || e.key === 'M') return actions.onMute();
    if (!allowKeys()) return;
    if (e.key === 'p' || e.key === 'P') return actions.onPause();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      left = true;
      targetX = null;
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      right = true;
      targetX = null;
      e.preventDefault();
    } else if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') && !isFormTarget(e.target)) {
      if (!e.repeat) launch = true;
      e.preventDefault();
    }
  };
  const keyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') right = false;
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  return {
    snapshot: () => ({ targetX, axis: (right ? 1 : 0) - (left ? 1 : 0) }),
    takeLaunch: () => launch,
    hasLaunch: () => launch,
    clearLaunch: () => void (launch = false),
    clearHeld: () => {
      left = right = launch = false;
    },
    requestLaunch: () => void (launch = true),
  };
}
