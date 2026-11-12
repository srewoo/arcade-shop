/** Indexed access that fails loudly (noUncheckedIndexedAccess friendly). */
export function at<T>(list: readonly T[], index: number): T {
  const value = list[index];
  if (value === undefined) throw new RangeError(`index ${index} out of range (${list.length})`);
  return value;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const sum = (list: readonly number[]): number => list.reduce((a, b) => a + b, 0);
