// Names of every sound the game can ask for. Gameplay emits names; only the Sfx module makes noise.
export const SFX_NAMES = ['rackClear', 'sweep', 'win', 'lose', 'star', 'tick', 'turn', 'ui', 'newBest'] as const;
export type SfxName = (typeof SFX_NAMES)[number];
export interface SfxCall { name: SfxName; n?: number }
