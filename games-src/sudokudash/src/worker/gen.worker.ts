// Web Worker: generates puzzles off the main thread so the UI never freezes.
import { z } from 'zod';
import { generatePuzzle } from '../core/generator';
import { formatGrid } from '../core/grid';

const RequestSchema = z.object({
  id: z.number().int(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  seed: z.number().int().min(0).max(0xffffffff),
});

self.onmessage = (event: MessageEvent<unknown>) => {
  const parsed = RequestSchema.safeParse(event.data);
  if (!parsed.success) return;
  const { id, difficulty, seed } = parsed.data;
  const t0 = performance.now();
  const g = generatePuzzle(difficulty, seed);
  self.postMessage({
    id,
    puzzle: formatGrid(g.puzzle),
    solution: formatGrid(g.solution),
    difficulty: g.difficulty,
    clues: g.clues,
    ms: Math.round(performance.now() - t0),
  });
};
