import { CONFIG } from './config';

/** Points for clearing a group of n discs: (n - 2)^2, so a pair scores nothing. */
export const groupPoints = (n: number): number => (n < 2 ? 0 : (n - 2) ** 2);
export const clearBonus = (): number => CONFIG.scoring.clearBonus;
