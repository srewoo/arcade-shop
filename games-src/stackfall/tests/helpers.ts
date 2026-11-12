import { createBoard, HEIGHT, WIDTH, type Board, type Piece } from '../src/core/board';
import { createGame } from '../src/core/step';
import { defaultConfig, NO_INPUT, type GameConfig, type GameState, type TickInput } from '../src/core/state';

export const input = (o: Partial<TickInput> = {}): TickInput => ({ ...NO_INPUT, ...o });

export function game(over: Partial<GameConfig> = {}): GameState {
  return createGame(defaultConfig(over));
}

/** Fill row `y` except the listed hole columns. */
export function fillRow(board: Board, y: number, holes: number[] = []): void {
  for (let x = 0; x < WIDTH; x++) (board[y] as number[])[x] = holes.includes(x) ? 0 : 8;
}

export const floorRow = HEIGHT - 1;
export const emptyBoard = createBoard;
export const setPiece = (s: GameState, p: Piece): void => {
  s.piece = p;
  s.lowestY = p.y;
  s.lockTimer = 0;
  s.moveResets = 0;
  s.gravAcc = 0;
};
