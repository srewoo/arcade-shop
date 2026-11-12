// One fixed 60 Hz simulation tick. Deterministic given state + input.
import { framesPerRow, softDropRate, zenTuning } from '../config/tuning';
import { doStash, hardDrop, isGrounded, spawnPieceChecked, tryMove, tryRotate } from './actions';
import { addGarbageRow, collides, WIDTH } from './board';
import { stepDas } from './das';
import { finish } from './end';
import { lockPiece } from './lock';
import { softDropPoints } from './scoring';
import { createState, tuningOf, type GameConfig, type GameState, type TickInput } from './state';

export function createGame(cfg: GameConfig): GameState {
  const s = createState(cfg);
  if (!spawnPieceChecked(s)) finish(s, 'over');
  return s;
}

export function tick(s: GameState, input: TickInput): void {
  if (s.status !== 'playing') {
    ensureEnd(s);
    return;
  }
  const limit = s.rules.timeLimitTicks;
  if (limit !== null && s.ticks >= limit) return finish(s, 'time');
  s.ticks++;
  if (!s.piece) return;
  if (input.stash) doStash(s);
  if (s.status !== 'playing') return;
  if (input.rotCW) tryRotate(s, 1);
  else if (input.rotCCW) tryRotate(s, -1);
  applyHorizontal(s, input);
  if (input.hard) {
    hardDrop(s);
    return lockPiece(s);
  }
  applyGravity(s, input.down);
  if (s.piece && isGrounded(s) && ++s.lockTimer >= s.cfg.lockDelay) lockPiece(s);
  if (s.cfg.zenGarbage && s.rules.id === 'zen') risingGarbage(s);
}

/** Safety net: a run that stopped without an `end` event still reports one. */
function ensureEnd(s: GameState): void {
  if (s.endSent || s.status === 'playing') return;
  s.endSent = true;
  s.events.push({ type: 'end', status: s.status });
}

function applyHorizontal(s: GameState, input: TickInput): void {
  const fresh = (input.left && !s.das.prevLeft) || (input.right && !s.das.prevRight);
  const steps = stepDas(s.das, input.left, input.right, s.cfg.dasFrames, s.cfg.arrFrames);
  const dir = Math.sign(steps);
  for (let i = 0; i < Math.abs(steps); i++) {
    if (tryMove(s, dir, 0)) continue;
    if (fresh && i === 0) s.events.push({ type: 'deny', what: 'move' });
    break;
  }
}

function applyGravity(s: GameState, soft: boolean): void {
  const t = tuningOf(s.cfg);
  const base = 1 / framesPerRow(s.level, t);
  s.gravAcc += soft ? softDropRate(s.level, t) : base;
  while (s.gravAcc >= 1 && s.piece) {
    if (!tryMove(s, 0, 1)) {
      s.gravAcc = 0;
      break;
    }
    s.gravAcc -= 1;
    if (soft) {
      s.score += softDropPoints(1);
      s.events.push({ type: 'softDrop' });
    }
  }
}

function risingGarbage(s: GameState): void {
  if (++s.garbageTimer < zenTuning.garbageIntervalTicks) return;
  s.garbageTimer = 0;
  const overflow = addGarbageRow(s.board, s.rng.int(WIDTH));
  s.events.push({ type: 'garbage' });
  const p = s.piece;
  if (p && collides(s.board, p.id, p.rot, p.x, p.y)) p.y = Math.max(0, p.y - 1);
  if (overflow || (p && collides(s.board, p.id, p.rot, p.x, p.y))) {
    s.board.forEach((r) => r.fill(0));
    s.events.push({ type: 'wipe' });
  }
}
