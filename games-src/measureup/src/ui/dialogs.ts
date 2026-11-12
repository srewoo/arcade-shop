// Small helpers over the overlay stack: open with the right opener and focus,
// plus a confirmation dialog (never window.confirm).
import { el } from './dom';
import { closeOverlay, openOverlay } from './overlay';
import { S } from '../strings';

export function openDialog(id: string, onClose: () => void = () => undefined, focusId?: string): void {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  openOverlay(el(id), opener, onClose, focusId ? el(focusId) : undefined);
}

export const closeDialog = (id: string): void => closeOverlay(el(id));

/** Ask before a destructive action. Focus starts on the safe answer. */
export function confirmAction(yesLabel: string, text: string, onYes: () => void): void {
  el('confirm-text').textContent = text;
  const yes = el<HTMLButtonElement>('confirm-yes');
  yes.textContent = yesLabel;
  yes.onclick = () => {
    closeDialog('confirm-overlay');
    onYes();
  };
  el<HTMLButtonElement>('confirm-no').onclick = () => closeDialog('confirm-overlay');
  openDialog('confirm-overlay', () => undefined, 'confirm-no');
}

export function showHelp(): void {
  const body = el('help-body');
  body.replaceChildren(
    ...S.helpLines.map((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      return p;
    }),
  );
  openDialog('help-overlay', () => undefined, 'help-close');
}
