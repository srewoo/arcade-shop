// Keyboard and pointer input. Touch/mouse is a relative drag: the plane keeps its offset from
// the finger, so your thumb never covers it. Held inputs are cleared whenever play stops.
import { toWorld as toWorldPoint, type Layout } from './layout';
import type { Input } from './types';
import { NO_INPUT } from './types';

export interface Point {
  x: number;
  y: number;
}

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const UP = ['ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const FIRE = ['Space', 'KeyZ'];
const GAME_KEYS = [...LEFT, ...RIGHT, ...UP, ...DOWN, ...FIRE, 'KeyB'];

/** Net axis from the held key set (-1, 0 or 1). */
export const axis = (held: ReadonlySet<string>, neg: readonly string[], pos: readonly string[]): number =>
  (pos.some((k) => held.has(k)) ? 1 : 0) - (neg.some((k) => held.has(k)) ? 1 : 0);

/** Where the plane should head while dragging: its start position plus the pointer's movement. */
export const dragTarget = (startPointer: Point, startPlane: Point, pointer: Point): Point => ({
  x: startPlane.x + (pointer.x - startPointer.x),
  y: startPlane.y + (pointer.y - startPointer.y),
});

export interface InputDevice {
  read(): Input;
  clear(): void;
  queueBomb(): void;
  /** True when any key/pointer fire was used since the last clear (for the onboarding hint). */
  readonly moved: boolean;
}

interface Core {
  held: Set<string>;
  bomb: boolean;
  moved: boolean;
  drag: { start: Point; plane: Point; now: Point } | null;
}

function attachKeyboard(core: Core, isPlaying: () => boolean): void {
  window.addEventListener('keydown', (e) => {
    if (!GAME_KEYS.includes(e.code) || e.ctrlKey || e.metaKey || e.altKey || !isPlaying()) return;
    e.preventDefault();
    if (e.code === 'KeyB' && !e.repeat) core.bomb = true;
    else core.held.add(e.code);
    core.moved = true;
  });
  window.addEventListener('keyup', (e) => core.held.delete(e.code));
}

export type LaneRect = Pick<Layout, 'x' | 'y' | 'scale'>;

function attachPointer(canvas: HTMLCanvasElement, core: Core, planePos: () => Point, isPlaying: () => boolean, lane: () => LaneRect): void {
  const toWorld = (e: PointerEvent): Point => {
    const r = canvas.getBoundingClientRect();
    return toWorldPoint(e.clientX, e.clientY, r.left, r.top, lane());
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (!isPlaying() || !e.isPrimary) return;
    canvas.setPointerCapture(e.pointerId);
    const p = toWorld(e);
    core.drag = { start: p, plane: planePos(), now: p };
    core.moved = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (core.drag && e.isPrimary) core.drag.now = toWorld(e);
  });
  const end = (): void => void (core.drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

export function createInput(canvas: HTMLCanvasElement, planePos: () => Point, isPlaying: () => boolean, lane: () => LaneRect): InputDevice {
  const core: Core = { held: new Set(), bomb: false, moved: false, drag: null };
  attachKeyboard(core, isPlaying);
  attachPointer(canvas, core, planePos, isPlaying, lane);
  return {
    read() {
      if (!isPlaying()) return NO_INPUT;
      const d = core.drag;
      const out: Input = {
        moveX: axis(core.held, LEFT, RIGHT),
        moveY: axis(core.held, UP, DOWN),
        target: d ? dragTarget(d.start, d.plane, d.now) : null,
        fire: FIRE.some((k) => core.held.has(k)) || d !== null,
        bomb: core.bomb,
      };
      core.bomb = false;
      return out;
    },
    clear() {
      core.held.clear();
      core.drag = null;
      core.bomb = false;
      core.moved = false;
    },
    queueBomb() {
      if (isPlaying()) core.bomb = true;
    },
    get moved() {
      return core.moved;
    },
  };
}
