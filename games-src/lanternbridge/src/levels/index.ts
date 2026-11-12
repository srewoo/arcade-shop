import type { Level, Pack } from '../puzzle/types';
import { BRIDGE_LEVELS } from './bridge';
import { RAFT_LEVELS } from './raft';

export { BRIDGE_LEVELS, RAFT_LEVELS };

export const ALL_LEVELS: readonly Level[] = [...BRIDGE_LEVELS, ...RAFT_LEVELS];

export const levelsOf = (pack: Pack): readonly Level[] => (pack === 'bridge' ? BRIDGE_LEVELS : RAFT_LEVELS);

export const findLevel = (id: string): Level | undefined => ALL_LEVELS.find((l) => l.id === id);
