// Locking a piece: merge, clears, scoring, level, win checks, next spawn.
import { finish, handleTopOut } from './end';
import { spawnPiece } from './spawn';
import { clearRows, countGarbage, fullRows, isBoardEmpty, placePiece } from './board';
import { levelFor } from './modes';
import { scoreLock } from './scoring';
import { tuningOf, type GameState } from './state';
import { detectTwist } from './twist';

export function lockPiece(s: GameState): void {
  const p = s.piece;
  if (!p) return;
  const twist = detectTwist(s.board, p, s.lastRotate);
  placePiece(s.board, p);
  s.events.push({ type: 'lock', piece: { ...p } });
  s.piecesPlaced++;
  const rows = fullRows(s.board);
  const colors = rows.map((r) => [...(s.board[r] as number[])]);
  clearRows(s.board, rows);
  const allClear = rows.length > 0 && isBoardEmpty(s.board);
  const res = scoreLock({ lines: rows.length, twist, level: s.level, combo: s.combo, b2b: s.b2b, allClear, tables: tuningOf(s.cfg).scores });
  s.score += res.points;
  s.combo = res.combo;
  s.b2b = res.b2b;
  s.lines += rows.length;
  if (rows.length > 0 || twist !== 'none') {
    s.events.push({ type: 'clear', rows, colors, lines: rows.length, twist, label: res.label, points: res.points, combo: res.combo, b2b: res.b2bApplied, allClear });
  }
  applyProgress(s);
  s.canStash = true;
  s.piece = null;
  if (s.status !== 'playing') return;
  if (!spawnPiece(s, s.bag.next())) handleTopOut(s);
}

function applyProgress(s: GameState): void {
  const level = levelFor(s.rules, s.cfg.startLevel, s.lines, tuningOf(s.cfg));
  if (level > s.level) s.events.push({ type: 'levelUp', level });
  s.level = level;
  if (s.rules.digRows > 0) {
    s.garbageLeft = countGarbage(s.board);
    if (s.garbageLeft === 0) finish(s, 'won');
  }
  if (s.rules.goalLines !== null && s.lines >= s.rules.goalLines) finish(s, 'won');
}
