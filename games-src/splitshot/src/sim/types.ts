export const POWER_KINDS = ['double', 'sticky', 'slow', 'shield'] as const;
export type PowerKind = (typeof POWER_KINDS)[number];

export interface Rect { x: number; y: number; w: number; h: number }
export interface Bubble { id: number; x: number; y: number; vx: number; vy: number; px: number; py: number; size: number }
export interface Block extends Rect { hp: number; maxHp: number; alive: boolean }
export interface Line { x: number; tipY: number; pTipY: number; /** seconds left while stuck, or -1 while growing */ stuck: number }
export interface Pickup { kind: PowerKind; x: number; y: number; vy: number; px: number; py: number; life: number }
export interface Player {
  x: number; px: number; facing: -1 | 1; moving: boolean; invuln: number; fireCd: number; shield: boolean; /** seconds since the last shot, drives the fire pose */ shotAge: number;
}
export interface Input { left: boolean; right: boolean; fire: boolean }
export interface BubbleSpawn { x: number; y: number; size: number; dir: 1 | -1 }
export type Theme = 'harbour' | 'coral' | 'kelp' | 'lantern' | 'storm' | 'aurora';
export interface StageDef {
  name: string;
  theme: Theme;
  time: number;
  bubbles: readonly BubbleSpawn[];
  platforms: readonly Rect[];
  blocks: readonly (Rect & { hp: number })[];
}

export type SimEvent =
  | { type: 'fire'; x: number }
  | { type: 'hitLine'; x: number; y: number; size: number; points: number }
  | { type: 'split'; x: number; y: number; size: number }
  | { type: 'pop'; x: number; y: number; size: number }
  | { type: 'bounce'; id: number; size: number; x: number; y: number }
  | { type: 'block'; x: number; y: number; broke: boolean }
  | { type: 'drop'; x: number; y: number; kind: PowerKind }
  | { type: 'collect'; x: number; y: number; kind: PowerKind }
  | { type: 'shieldBreak'; x: number; y: number }
  | { type: 'hit'; x: number; y: number }
  | { type: 'timeout' }
  | { type: 'clear'; bonus: number }
  | { type: 'warn'; secs: number }
  | { type: 'step' };
