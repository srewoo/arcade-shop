// Keyboard wiring: digits place marks, N/P/M/Esc are shortcuts, arrows roam the board.
import type { Host } from './host';
import { isOverlayOpen } from './overlay';
import type { Panels } from './panels';
import { attachRoving } from './roving';
import { closeTop } from './overlay';
import { el } from './dom';

export function initInput(host: Host, panels: Panels, cells: HTMLButtonElement[]): void {
  attachRoving(el('board'), { columns: 3, items: () => cells });
  document.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((group) => {
    attachRoving(group, { columns: 1, items: () => [...group.querySelectorAll<HTMLElement>('button')] });
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const typing = e.target instanceof HTMLInputElement;
    if (e.key === 'Escape') return escape(host, panels);
    if (typing && e.key !== 'm' && e.key !== 'M') return;
    const key = e.key.toLowerCase();
    if (key === 'p') return panels.togglePause();
    if (isOverlayOpen()) return;
    if (/^[1-9]$/.test(e.key)) host.attempt(Number(e.key) - 1);
    else if (key === 'n') host.requestNewRound();
    else if (key === 'm') host.changeSetting('sound', !host.settings().sound);
  });
}

function escape(host: Host, panels: Panels): void {
  if (closeTop()) return;
  const bar = el('confirm-bar');
  if (!bar.hidden) host.confirmPending(false);
  else panels.openPause(false);
}
