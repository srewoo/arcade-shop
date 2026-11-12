// Raft pack: guard / thief / family style constraints on a small raft.
import type { Actor, ArtKey, Rule } from '../puzzle/types';
import { buildRaft, type RaftSpec } from './build';

const actor = (name: string, art: ArtKey, canRow: boolean): Actor => ({ name, art, time: 0, canRow });

const FARM: Actor[] = [actor('Farmer', 'farmer', true), actor('Fox', 'fox', false), actor('Hen', 'hen', false), actor('Grain', 'grain', false)];
const FARM_RULES: Rule[] = [
  { kind: 'pair', a: [1], b: [2], unless: [0], text: 'The fox eats the hen unless the farmer is there.' },
  { kind: 'pair', a: [2], b: [3], unless: [0], text: 'The hen eats the grain unless the farmer is there.' },
];

const keepers = (n: number): Actor[] => [
  ...Array.from({ length: n }, (_, i) => actor(`Keeper ${i + 1}`, 'keeper', true)),
  ...Array.from({ length: n }, (_, i) => actor(`Magpie ${i + 1}`, 'magpie', true)),
];
const keeperRule = (n: number): Rule => ({
  kind: 'outnumber',
  guard: Array.from({ length: n }, (_, i) => i),
  threat: Array.from({ length: n }, (_, i) => n + i),
  text: 'Where keepers are present, magpies may not outnumber them (bank or raft).',
});

/** Warden 0, Pickpocket 1, Pa 2, Ma 3, boys, girls. */
function family(boys: number, girls: number): { actors: Actor[]; rules: Rule[] } {
  const actors: Actor[] = [actor('Warden', 'warden', true), actor('Pickpocket', 'pickpocket', false), actor('Pa', 'pa', true), actor('Ma', 'ma', true)];
  const b = Array.from({ length: boys }, (_, i) => 4 + i);
  const g = Array.from({ length: girls }, (_, i) => 4 + boys + i);
  b.forEach((_, i) => actors.push(actor(['Ash', 'Oak'][i] ?? `Boy ${i}`, 'boy', false)));
  g.forEach((_, i) => actors.push(actor(['Fern', 'Rose'][i] ?? `Girl ${i}`, 'girl', false)));
  const rules: Rule[] = [
    { kind: 'pair', a: [1], b: [2, 3, ...b, ...g], unless: [0], text: 'The pickpocket may not be with any family member unless the warden is there.' },
    { kind: 'pair', a: [2], b: g, unless: [3], text: 'Pa may not be with the girls unless Ma is there.' },
    { kind: 'pair', a: [3], b, unless: [2], text: 'Ma may not be with the boys unless Pa is there.' },
  ].filter((r) => r.kind !== 'pair' || (r.a.length > 0 && r.b.length > 0)) as Rule[];
  return { actors, rules };
}

const small = family(1, 1);
const big = family(2, 2);

const SPECS: readonly RaftSpec[] = [
  { id: 'r1', title: 'Fox, Hen and Grain', blurb: 'The farmer can carry one passenger at a time.', actors: FARM, capacity: 2, rules: FARM_RULES },
  { id: 'r2', title: 'Keepers and Magpies', blurb: 'Three keepers, three magpies, a two-seat raft.', actors: keepers(3), capacity: 2, rules: [keeperRule(3)] },
  { id: 'r3', title: 'A Small Family', blurb: 'Only the warden, Pa and Ma can row.', actors: small.actors, capacity: 2, rules: small.rules },
  { id: 'r4', title: 'Bigger Raft', blurb: 'The whole family, with room for three.', actors: big.actors, capacity: 3, rules: big.rules },
  { id: 'r5', title: 'Four and Four', blurb: 'Four keepers, four magpies, a three-seat raft.', actors: keepers(4), capacity: 3, rules: [keeperRule(4)] },
  { id: 'r6', title: 'The Whole Household', blurb: 'The full family on a two-seat raft.', actors: big.actors, capacity: 2, rules: big.rules },
];

export const RAFT_LEVELS = SPECS.map(buildRaft);
