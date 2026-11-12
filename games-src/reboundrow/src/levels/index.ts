import { parseLevel, type ParsedLevel } from './format';
import { LEVELS_A } from './dataA';
import { LEVELS_B } from './dataB';

export const LEVELS: readonly ParsedLevel[] = [...LEVELS_A, ...LEVELS_B].map(parseLevel);
export const LEVEL_COUNT = LEVELS.length;
export * from './format';
export { validateLevel } from './validate';
export { generateLevel } from './generate';
