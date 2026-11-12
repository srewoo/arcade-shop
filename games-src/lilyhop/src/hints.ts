// Two-tier hints: first press points at the piece, a second press (same position) shows its pad.
export type HintStage = 'none' | 'piece' | 'full';

/** Next stage when Hint is pressed. Only the first press of a sequence counts as a used hint. */
export function escalate(stage: HintStage): { stage: 'piece' | 'full'; counts: boolean } {
  return stage === 'piece' ? { stage: 'full', counts: false } : stage === 'full' ? { stage: 'full', counts: false } : { stage: 'piece', counts: true };
}
