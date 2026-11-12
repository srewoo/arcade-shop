// Creates the CanvasView and hands the table view to the input handler whenever it changes.
import { CanvasView } from './canvasView';
import type { Input } from './input';

export function canvasSetup(canvas: HTMLCanvasElement, stage: HTMLElement, input: Input): CanvasView {
  return new CanvasView(canvas, stage, (v) => { input.view = v; });
}
