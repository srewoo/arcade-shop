// Shared puzzle model. Both packs use one state shape: a bitmask of who is still
// on the start bank, which side the carrier (lantern / raft) is on, and the cost.
export type Pack = 'bridge' | 'raft';

export type ArtKey =
  | 'courier' | 'tinker' | 'baker' | 'porter' | 'herbalist' | 'smith' | 'elder'
  | 'warden' | 'pickpocket' | 'pa' | 'ma' | 'boy' | 'girl'
  | 'fox' | 'hen' | 'grain' | 'keeper' | 'magpie' | 'farmer';

export interface Actor {
  readonly name: string;
  /** Bridge: minutes to cross. Raft: 0. */
  readonly time: number;
  readonly art: ArtKey;
  /** Raft: only rowers can steer the raft. Bridge: always true. */
  readonly canRow: boolean;
}

/** Group `a` and `b` may not share a bank or the raft unless someone from `unless` is there. */
export interface PairRule {
  readonly kind: 'pair';
  readonly a: readonly number[];
  readonly b: readonly number[];
  readonly unless: readonly number[];
  readonly text: string;
}

/** Wherever `guard` actors are present, `threat` actors may not outnumber them. */
export interface OutnumberRule {
  readonly kind: 'outnumber';
  readonly guard: readonly number[];
  readonly threat: readonly number[];
  readonly text: string;
}

export type Rule = PairRule | OutnumberRule;

export interface Level {
  readonly id: string;
  readonly pack: Pack;
  readonly title: string;
  readonly blurb: string;
  readonly actors: readonly Actor[];
  readonly capacity: number;
  readonly rules: readonly Rule[];
  /** Bridge: total minutes allowed. Raft: null. */
  readonly limit: number | null;
  /** Optimal total cost (bridge minutes, raft crossings), proven by the solver. */
  readonly par: number;
}

export interface State {
  /** Bit i set: actor i is on the start bank. */
  readonly start: number;
  readonly carrierAtStart: boolean;
  readonly cost: number;
  readonly moves: number;
}

export type MoveFailure = 'empty' | 'too-many' | 'wrong-side' | 'no-rower' | 'rule';

export type MoveCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: MoveFailure; readonly rule?: Rule };
