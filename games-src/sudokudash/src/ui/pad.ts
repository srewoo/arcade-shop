// On-screen number pad with a remaining-count badge per digit.
import { remainingCounts } from '../core/game';
import type { Session } from '../session';

export class PadView {
  private readonly buttons: HTMLButtonElement[] = [];
  private readonly badges: HTMLElement[] = [];

  constructor(root: HTMLElement, onDigit: (d: number) => void) {
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.append(document.createTextNode(String(d)));
      const badge = document.createElement('small');
      b.append(badge);
      b.addEventListener('click', () => onDigit(d));
      root.append(b);
      this.buttons.push(b);
      this.badges.push(badge);
    }
  }

  render(s: Session): void {
    const left = remainingCounts(s.game);
    this.buttons.forEach((b, i) => {
      const n = left[i + 1] ?? 0;
      this.badges[i]!.textContent = String(n);
      b.disabled = n === 0 || !s.playing;
      b.classList.toggle('notes-on', s.notesMode);
      b.setAttribute('aria-label', `${s.notesMode ? 'Note' : 'Digit'} ${i + 1}, ${n} left`);
    });
  }
}
