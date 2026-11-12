// Disc colours and symbols. Colours are tuned for >= 3:1 against the board plate
// (checked in tests/contrast.test.ts); symbols give a non-colour cue.
export const PLATE = '#1c2138';
export const PLATE_TOP = '#2a3158';
export const PLATE_EDGE = '#3a4263';
export const SYMBOL_INK = '#10131f';
export const DISC_COLOURS: readonly string[] = ['#ff6b57', '#ffc43d', '#3fd98f', '#47b8ff', '#b58cff'];
export const DISC_NAMES: readonly string[] = ['coral', 'amber', 'mint', 'sky', 'violet'];
export type SymbolId = 'ring' | 'square' | 'triangle' | 'diamond' | 'plus';
export const DISC_SYMBOLS: readonly SymbolId[] = ['ring', 'square', 'triangle', 'diamond', 'plus'];
