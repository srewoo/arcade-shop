// On-screen touch pad: held directions and edge actions feed the shared Controls.
import type { Controls } from './controls';

type Held = 'left' | 'right' | 'down';
type Edge = 'rotCW' | 'rotCCW' | 'hard' | 'stash';
const HELD: Record<string, Held> = { left: 'left', right: 'right', down: 'down' };
const EDGE = new Set<string>(['rotCW', 'rotCCW', 'hard', 'stash']);

export function wirePad(pad: HTMLElement, controls: Controls, isPlaying: () => boolean, onTouch: () => void): void {
  pad.querySelectorAll<HTMLButtonElement>('button[data-act]').forEach((b) => {
    const act = b.dataset.act as string;
    const held = HELD[act];
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onTouch();
      if (!isPlaying()) return;
      if (held) controls.setVirtual(held, true);
      else if (EDGE.has(act)) controls.pulse(act as Edge);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => held && controls.setVirtual(held, false));
  });
}
