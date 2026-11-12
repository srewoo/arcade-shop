export interface Vec { x: number; y: number }

/** Closed polygons are arrays of points; ellipses and rects are used for hazards. */
export type Shape =
  | { readonly t: 'r'; readonly x: number; readonly y: number; readonly w: number; readonly h: number }
  | { readonly t: 'e'; readonly x: number; readonly y: number; readonly rx: number; readonly ry: number };

export interface Hazard { readonly kind: 'water' | 'void'; readonly shape: Shape }
export interface SandPatch { readonly shape: Shape }
/** Constant acceleration (u/s^2) applied to a rolling ball inside `shape`. */
export interface Slope { readonly shape: Shape; readonly ax: number; readonly ay: number }
export interface Post { readonly x: number; readonly y: number; readonly r: number }

export type MoverDef =
  | { readonly kind: 'slide'; readonly cx: number; readonly cy: number; readonly w: number; readonly h: number; readonly axis: 'x' | 'y'; readonly amp: number; readonly period: number; readonly phase: number }
  | { readonly kind: 'spin'; readonly cx: number; readonly cy: number; readonly len: number; readonly thick: number; readonly omega: number; readonly phase: number };

export interface HoleDef {
  readonly id: number;
  readonly name: string;
  readonly par: number;
  readonly tee: Vec;
  readonly cup: Vec;
  /** Closed polygons, even-odd: the outer course boundary plus any solid islands. Edges are walls. */
  readonly walls: readonly (readonly Vec[])[];
  readonly sand?: readonly SandPatch[];
  readonly hazards?: readonly Hazard[];
  readonly slopes?: readonly Slope[];
  readonly posts?: readonly Post[];
  readonly movers?: readonly MoverDef[];
}

export type SimState = 'idle' | 'rolling' | 'sunk' | 'water';
export type SimEvent =
  | { readonly type: 'strike'; readonly speed: number }
  | { readonly type: 'wall'; readonly speed: number; readonly x: number; readonly y: number }
  | { readonly type: 'post'; readonly speed: number; readonly x: number; readonly y: number }
  | { readonly type: 'mover'; readonly speed: number; readonly x: number; readonly y: number }
  | { readonly type: 'sand'; readonly x: number; readonly y: number }
  | { readonly type: 'splash'; readonly x: number; readonly y: number; readonly kind: 'water' | 'void' }
  | { readonly type: 'sink'; readonly x: number; readonly y: number }
  | { readonly type: 'rest' };
