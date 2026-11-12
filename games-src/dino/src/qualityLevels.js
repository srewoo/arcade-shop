// Graphics quality presets (pure).  quality.js applies the plan to the renderer.
export const QUALITIES = ['auto', 'high', 'medium', 'low'];
export const isQuality = (v) => typeof v === 'string' && QUALITIES.includes(v);

/**
 * @param base the device's default pixel ratio
 * @returns {{pixelRatio:number, shadows:boolean, adaptive:boolean}} adaptive = let the FPS governor degrade it
 */
export function qualityPlan(level, base) {
  switch (level) {
    case 'high': return { pixelRatio: base, shadows: true, adaptive: false };
    case 'medium': return { pixelRatio: Math.min(base, 1.25), shadows: true, adaptive: false };
    case 'low': return { pixelRatio: 1, shadows: false, adaptive: false };
    default: return { pixelRatio: base, shadows: true, adaptive: true };
  }
}
