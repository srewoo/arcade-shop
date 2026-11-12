// Sizes the canvas to the stage and returns the device scale used by the renderer.
import { H, W } from './hex';

export const MAX_DPR = 2;

/** CSS size that fits the logical playfield into a stage, keeping the aspect ratio. */
export function fitSize(stageW: number, stageH: number): { w: number; h: number } {
  const scale = Math.min(stageW / W, stageH / H);
  return { w: Math.max(120, Math.floor(W * scale)), h: Math.max(180, Math.floor(H * scale)) };
}

export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, stage: HTMLElement): number {
  const { w, h } = fitSize(stage.clientWidth, stage.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = canvas.width / W;
  ctx.setTransform(scale, 0, 0, canvas.height / H, 0, 0);
  return scale;
}
