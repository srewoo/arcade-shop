// Keyboard shortcuts. Digits use e.code so Shift/Alt layouts do not interfere.
export type KeyContext = 'play' | 'paused' | 'none';

export interface KeyActions {
  /** 'play' while a game is live, 'paused' while its pause overlay is up, else 'none'. */
  readonly context: () => KeyContext;
  readonly digit: (d: number) => void;
  readonly erase: () => void;
  readonly move: (dRow: number, dCol: number) => void;
  readonly notes: () => void;
  readonly hint: () => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly pause: () => void;
  /** Esc while paused: cancels a pending confirmation, else resumes. */
  readonly resumeFromEsc: () => void;
  readonly mute: () => void;
}

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
};

function typingTarget(t: EventTarget | null): boolean {
  return t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && t.type !== 'radio' && t.type !== 'checkbox' && t.type !== 'range');
}

export function bindKeys(a: KeyActions): void {
  document.addEventListener('keydown', (e) => {
    if (typingTarget(e.target) || document.querySelector('dialog[open]')) return;
    const key = e.key.toLowerCase();
    const mod = e.metaKey || e.ctrlKey;
    if (key === 'm' && !mod) return handled(e, a.mute);
    const ctx = a.context();
    if (ctx === 'none') return;
    if (ctx === 'paused') {
      if (!mod && !e.altKey && (key === 'p' || key === 'escape')) handled(e, a.resumeFromEsc);
      return;
    }
    if (mod && key === 'z') return handled(e, e.shiftKey ? a.redo : a.undo);
    if (mod && key === 'y') return handled(e, a.redo);
    if (mod || e.altKey) return;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (digit) return handled(e, () => a.digit(Number(digit[1])));
    const arrow = ARROWS[e.key];
    if (arrow) return handled(e, () => a.move(arrow[0], arrow[1]));
    if (key === 'backspace' || key === 'delete' || e.code === 'Digit0') return handled(e, a.erase);
    if (key === 'z' && e.shiftKey) return handled(e, a.redo);
    const simple: Record<string, () => void> = { n: a.notes, h: a.hint, p: a.pause, escape: a.pause };
    const fn = simple[key];
    if (fn) handled(e, fn);
  });
}

function handled(e: KeyboardEvent, fn: () => void): void {
  e.preventDefault();
  fn();
}
