// Landing resolution: matches, bombs, floating drops, scoring, ceiling drops, clears.
import { addFaller, addPop, addPopup, burst } from './effects';
import { DANGER_ROW, Pos, ROW_H, W, cellCenter, getCell, lowestRow, setCell } from './hex';
import { TUNING } from './config';
import { starsFor } from './levels';
import { bombCells, dropCeiling, findFloating, isCleared, matchGroup, removeCells } from './match';
import { colorHex } from './palette';
import { makeRowFiller } from './rules';
import { Game, emit, loadBoard, shotsLeft } from './state';

const S = TUNING.score;
const BURST_CAP = 150;

export function lose(g: Game): void {
  g.status = 'lost';
  const low = lowestRow(g.grid);
  g.loseRow = low >= DANGER_ROW ? low : -1;
  emit(g, 'lose');
}

/** Points for popping `n` bubbles at a given combo (1 = first pop). */
export function popPoints(n: number, combo: number): number {
  const base = n * S.perBubble + Math.max(0, n - S.groupBonusFrom) * S.groupBonus;
  return Math.round(base * (1 + S.comboStep * (combo - 1)));
}

/** True while the next miss will drop the ceiling. */
export const ceilingWarning = (g: Game): boolean =>
  g.mode !== 'puzzle' && g.status === 'playing' && g.diff.dropEvery - g.sinceDrop === 1;

const clampX = (x: number): number => Math.min(W - 40, Math.max(40, x));

function popEffects(g: Game, popped: readonly Pos[]): void {
  const cap = g.reduced ? Math.floor(BURST_CAP * 0.4) : BURST_CAP;
  const per = Math.max(2, Math.min(g.reduced ? TUNING.fx.burstReduced : TUNING.fx.burst, Math.floor(cap / popped.length)));
  for (const p of popped) {
    const cc = cellCenter(p.row, p.col, g.grid.phase);
    const cell = getCell(g.grid, p.row, p.col);
    if (!cell) continue;
    burst(g.fx, cc.x, cc.y, cell.kind === 'normal' ? colorHex(cell) : '#ffffff', per, g.rng);
    if (!g.reduced) addPop(g.fx, cell, cc.x, cc.y);
  }
}

function dropFloating(g: Game): void {
  const floating = findFloating(g.grid);
  if (!floating.length) return;
  floating.forEach((p, i) => {
    const cc = cellCenter(p.row, p.col, g.grid.phase);
    const cell = getCell(g.grid, p.row, p.col);
    if (cell) addFaller(g.fx, cell, cc.x, cc.y, g.rng);
    g.score += S.fallBase * (i + 1);
  });
  const total = floating.length * (floating.length + 1) * (S.fallBase / 2);
  const first = cellCenter(floating[0]?.row ?? 0, floating[0]?.col ?? 0, g.grid.phase);
  addPopup(g.fx, clampX(first.x), first.y + ROW_H, `DROP +${total}`, true);
  removeCells(g.grid, floating);
  emit(g, 'fall', floating.length);
}

/** Resolve the bubble that just landed at `pos`. Returns true when something popped. */
function resolve(g: Game, pos: Pos): boolean {
  const b = getCell(g.grid, pos.row, pos.col);
  const popped = b?.kind === 'bomb' ? bombCells(g.grid, pos) : matchGroup(g.grid, pos);
  if (!popped.length) {
    g.combo = 0;
    emit(g, 'stick');
    return false;
  }
  g.combo++;
  g.hits++;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const n = popped.length;
  const pts = popPoints(n, g.combo);
  g.score += pts;
  const c = cellCenter(pos.row, pos.col, g.grid.phase);
  addPopup(g.fx, clampX(c.x), c.y, g.combo > 1 ? `+${pts}  x${g.combo}` : `+${pts}`, g.combo > 1);
  popEffects(g, popped);
  removeCells(g.grid, popped);
  emit(g, b?.kind === 'bomb' ? 'bomb' : 'pop', n);
  if (!g.reduced) g.shake = Math.max(g.shake, b?.kind === 'bomb' ? 7 : Math.min(5, 1.5 + n * 0.3));
  dropFloating(g);
  return true;
}

function boardCleared(g: Game): void {
  const leftovers = findFloating(g.grid);
  for (const p of leftovers) {
    const cc = cellCenter(p.row, p.col, g.grid.phase);
    const cell = getCell(g.grid, p.row, p.col);
    if (cell) addFaller(g.fx, cell, cc.x, cc.y, g.rng);
  }
  removeCells(g.grid, leftovers);
  if (g.mode === 'puzzle') {
    g.score += (g.limit - g.shots) * S.puzzleShot + S.puzzleClear;
    g.stars = starsFor(g.shots, g.limit, g.par);
    g.status = 'won';
    emit(g, 'win', g.stars);
  } else if (g.mode === 'rush') {
    const bonus = TUNING.rush.clearBonusSeconds;
    g.score += S.rushClear;
    g.timeLeft += bonus;
    addPopup(g.fx, W / 2, 200, `BOARD CLEARED +${S.rushClear}  +${bonus} s`, true);
    loadBoard(g);
    emit(g, 'levelup');
  } else {
    g.score += S.arcadeClear + g.level * S.arcadeClearPerLevel;
    g.status = 'cleared';
    g.clearTimer = TUNING.timers.clearBanner;
    emit(g, 'levelup', g.level);
  }
}

function maybeDrop(g: Game, popped: boolean): void {
  if (g.mode === 'puzzle') return;
  if (popped) {
    g.sinceDrop = 0;
    return;
  }
  if (++g.sinceDrop < g.diff.dropEvery) {
    if (g.diff.dropEvery - g.sinceDrop === 1) emit(g, 'warn');
    return;
  }
  dropCeiling(g.grid, makeRowFiller(g.rng, g.diff));
  g.sinceDrop = 0;
  if (!g.reduced) {
    g.dropAnim = ROW_H;
    g.prevDropAnim = ROW_H;
    g.shake = Math.max(g.shake, 3);
  }
  emit(g, 'ceiling');
}

function afterShot(g: Game, popped: boolean): void {
  if (isCleared(g.grid)) return boardCleared(g);
  maybeDrop(g, popped);
  const low = lowestRow(g.grid);
  if (low >= DANGER_ROW) return lose(g);
  const near = low >= DANGER_ROW - 2;
  if (near && !g.dangerNear) emit(g, 'danger');
  g.dangerNear = near;
  if (g.mode === 'puzzle' && shotsLeft(g) <= 0) lose(g);
}

/** Put `bubble` in cell `pos`, then resolve matches, drops and win/lose checks. */
export function landAt(g: Game, pos: Pos, bubble: NonNullable<Game['cur']>): void {
  setCell(g.grid, pos.row, pos.col, bubble);
  g.version++;
  afterShot(g, resolve(g, pos));
  g.version++;
}
