// Mouse/touch on the lane canvas: slide the ball, tap to lock, drag up to throw, tap to skip waits.
import { foulLineScreenY, laneXFromScreen } from './draw';
import type { Game } from './game';
import { MIN_DRAG_PX, shotFromDrag, type Point } from './drag';
import { TUNING } from './tuning';

const { tapPx: TAP_PX, decidePx: DECIDE_PX } = TUNING.input;

/** One pointer gesture on the lane: where it started and what it turned out to be. */
class Gesture {
  path: Point[] = [];
  sliding = false;
  /** Pressed on the ball: wait for the first few px to tell a slide from a throw. */
  undecided = false;
  id = -1;

  begin(id: number, p: Point, onBall: boolean): void {
    this.id = id;
    this.path = [p];
    this.undecided = onBall;
    this.sliding = false;
  }

  /** Classify a slide versus a throw once the pointer has moved a few px. */
  move(p: Point): void {
    const start = this.path[0];
    if (this.undecided && start && Math.hypot(p.x - start.x, p.y - start.y) >= DECIDE_PX) {
      this.undecided = false;
      this.sliding = Math.abs(p.x - start.x) >= Math.abs(p.y - start.y);
    }
  }

  reset(): void {
    this.id = -1;
    this.path = [];
    this.sliding = false;
    this.undecided = false;
  }
}

export function bindPointer(canvas: HTMLCanvasElement, game: Game, unlockAudio: () => void): void {
  const g = new Gesture();
  const local = (e: PointerEvent): Point => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', (e) => {
    unlockAudio();
    if (!game.humanTurn) { game.skip(); return; }
    if (g.id !== -1 || game.paused) return;
    canvas.setPointerCapture(e.pointerId);
    const p = local(e);
    g.begin(e.pointerId, p, game.input.phase === 'position' && p.y > foulLineScreenY(game) - 60);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== g.id) return;
    const p = local(e);
    g.move(p);
    if (g.sliding) game.placeAt(laneXFromScreen(game, p.x));
    else {
      g.path.push(p);
      if (!g.undecided) game.pres.dragTrail = g.path;
    }
  });

  const finish = (e: PointerEvent, cancelled: boolean): void => {
    if (e.pointerId !== g.id) return;
    const pts = g.path;
    const wasSliding = g.sliding;
    g.reset();
    game.pres.dragTrail = [];
    if (cancelled || wasSliding || !game.humanTurn) return;
    releaseOnLane(game, pts);
  };
  canvas.addEventListener('pointerup', (e) => finish(e, false));
  canvas.addEventListener('pointercancel', (e) => finish(e, true));
}

/** A short press taps (locks the current meter); a longer drag throws. */
function releaseOnLane(game: Game, pts: readonly Point[]): void {
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return;
  if (Math.hypot(last.x - first.x, last.y - first.y) < Math.max(TAP_PX, MIN_DRAG_PX * 0.3)) {
    if (game.input.phase !== 'position') game.confirm();
    return;
  }
  const shot = shotFromDrag(pts, game.pres.size.h * 0.55, game.input.startX);
  if (shot) game.throwShot(shot);
}
