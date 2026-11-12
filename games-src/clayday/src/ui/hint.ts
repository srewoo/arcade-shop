// First-run hint: sits at the top of the field, never blocks input, and fades on the
// first shot, on the close button, or after a few seconds.
import { byId } from './dom';

const FLAG = 'clayday-hint-seen';
export const HINT_MS = 8000;
const FADE_MS = 400;

/** True once per browser (flag in localStorage); shows every run when storage is unavailable. */
export function shouldShowHint(storage: Pick<Storage, 'getItem' | 'setItem'> | null): boolean {
  try {
    if (!storage) return true;
    if (storage.getItem(FLAG) === '1') return false;
    storage.setItem(FLAG, '1');
  } catch {
    /* storage unavailable: the hint just shows every run */
  }
  return true;
}

export class Hint {
  private timer = 0;
  private readonly box = byId('onboard');

  show(text: string): void {
    window.clearTimeout(this.timer);
    byId('onboard-text').textContent = text;
    this.box.classList.remove('fade');
    this.box.hidden = false;
    this.timer = window.setTimeout(() => this.dismiss(), HINT_MS);
  }

  dismiss(): void {
    window.clearTimeout(this.timer);
    if (this.box.hidden) return;
    this.box.classList.add('fade');
    this.timer = window.setTimeout(() => this.hide(), FADE_MS);
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.box.hidden = true;
  }
}
