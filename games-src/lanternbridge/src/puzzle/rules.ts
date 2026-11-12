// Constraint checks for the raft pack. Pure functions over bitmasks.
import type { Rule } from './types';

export const maskOf = (ids: readonly number[]): number => ids.reduce((m, i) => m | (1 << i), 0);

export function popcount(mask: number): number {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

/** The rule a group of actors breaks, or null when the group is safe. */
export function brokenRule(rules: readonly Rule[], group: number): Rule | null {
  for (const rule of rules) {
    if (rule.kind === 'pair') {
      const hit = group & maskOf(rule.a) && group & maskOf(rule.b) && !(group & maskOf(rule.unless));
      if (hit) return rule;
    } else {
      const guards = popcount(group & maskOf(rule.guard));
      if (guards > 0 && popcount(group & maskOf(rule.threat)) > guards) return rule;
    }
  }
  return null;
}
