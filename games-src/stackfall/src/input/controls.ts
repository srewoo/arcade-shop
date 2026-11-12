// Keyboard, on-screen buttons, touch pulses and gamepad -> one TickInput per tick.
import { NO_INPUT, type TickInput } from '../core/state';
import type { Action, Keys } from '../settings';

type Edge = 'rotCW' | 'rotCCW' | 'hard' | 'stash';
type Held = 'left' | 'right' | 'down';
const HELD_MAP: Partial<Record<Action, Held>> = { left: 'left', right: 'right', softDrop: 'down' };
const EDGE_MAP: Partial<Record<Action, Edge>> = { rotCW: 'rotCW', rotCCW: 'rotCCW', hardDrop: 'hard', stash: 'stash' };

export interface ControlHooks {
  isPlaying(): boolean;
  /** A modal dialog (Settings) is open: let it handle Esc and ignore pause/mute keys. */
  isModalOpen(): boolean;
  onPause(): void;
  onMute(): void;
}

export class Controls {
  private codes = new Set<string>();
  private virtual = new Set<Held>();
  private latched = new Set<Edge>();
  /** Keys pressed and released within a single tick still count as a tap. */
  private tapped = new Set<Held>();
  private pulses: Partial<TickInput>[] = [];
  private padPrev: boolean[] = [];
  /** When set, the next key press is passed here (used by key remapping). */
  capture: ((code: string) => void) | null = null;

  constructor(private keys: Keys, private readonly hooks: ControlHooks) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.codes.delete(e.code));
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** True while any bound key, virtual button or latched input is held. */
  anyHeld(): boolean {
    return this.codes.size > 0 || this.virtual.size > 0 || this.latched.size > 0;
  }

  setKeys(keys: Keys): void {
    this.keys = keys;
  }

  releaseAll(): void {
    this.codes.clear();
    this.virtual.clear();
    this.latched.clear();
    this.tapped.clear();
    this.pulses = [];
  }

  private actionsFor(code: string): Action[] {
    return (Object.keys(this.keys) as Action[]).filter((a) => this.keys[a].includes(code));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.capture) {
      e.preventDefault();
      const fn = this.capture;
      this.capture = null;
      fn(e.code);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || this.hooks.isModalOpen()) return;
    const actions = this.actionsFor(e.code);
    if (actions.length === 0) return;
    const playing = this.hooks.isPlaying();
    if (actions.includes('pause')) {
      if (!e.repeat) this.hooks.onPause();
      if (playing || e.code === 'Escape') e.preventDefault();
      return;
    }
    if (actions.includes('mute')) {
      if (!e.repeat) this.hooks.onMute();
      return;
    }
    if (!playing) return;
    e.preventDefault();
    this.codes.add(e.code);
    if (e.repeat) return;
    for (const a of actions) {
      const edge = EDGE_MAP[a];
      if (edge) this.latched.add(edge);
      const held = HELD_MAP[a];
      if (held) this.tapped.add(held);
    }
  }

  setVirtual(h: Held, on: boolean): void {
    if (on) {
      this.virtual.add(h);
      this.tapped.add(h); // a touch shorter than one tick still counts as a tap
    } else this.virtual.delete(h);
  }

  pulse(edge: Edge): void {
    this.latched.add(edge);
  }

  /** One discrete horizontal step (touch swipe). A blank pulse follows so repeats register. */
  step(dir: -1 | 1): void {
    this.pulses.push(dir < 0 ? { left: true } : { right: true }, {});
    if (this.pulses.length > 24) this.pulses.length = 24;
  }

  private heldBy(h: Held): boolean {
    if (this.virtual.has(h)) return true;
    for (const code of this.codes) {
      for (const a of this.actionsFor(code)) if (HELD_MAP[a] === h) return true;
    }
    return false;
  }

  private readPad(): Partial<TickInput> {
    const pad = typeof navigator.getGamepads === 'function' ? navigator.getGamepads().find((p) => p?.connected) : undefined;
    if (!pad) return {};
    const b = (i: number): boolean => pad.buttons[i]?.pressed ?? false;
    const now = [b(0), b(1), b(12), b(4) || b(5), b(9)];
    const edge = (i: number): boolean => (now[i] ?? false) && !this.padPrev[i];
    const out: Partial<TickInput> = {
      left: b(14) || (pad.axes[0] ?? 0) < -0.5,
      right: b(15) || (pad.axes[0] ?? 0) > 0.5,
      down: b(13) || (pad.axes[1] ?? 0) > 0.6,
      rotCW: edge(0), rotCCW: edge(1), hard: edge(2), stash: edge(3),
    };
    if (edge(4)) this.hooks.onPause();
    this.padPrev = now;
    return out;
  }

  /** Called once per simulation tick. */
  poll(): TickInput {
    const pad = this.readPad();
    const pulse = this.pulses.shift() ?? {};
    const out: TickInput = {
      ...NO_INPUT,
      left: this.heldBy('left') || this.tapped.has('left') || !!pad.left || !!pulse.left,
      right: this.heldBy('right') || this.tapped.has('right') || !!pad.right || !!pulse.right,
      down: this.heldBy('down') || this.tapped.has('down') || !!pad.down,
      rotCW: this.latched.has('rotCW') || !!pad.rotCW,
      rotCCW: this.latched.has('rotCCW') || !!pad.rotCCW,
      hard: this.latched.has('hard') || !!pad.hard,
      stash: this.latched.has('stash') || !!pad.stash,
    };
    this.latched.clear();
    this.tapped.clear();
    return out;
  }
}
