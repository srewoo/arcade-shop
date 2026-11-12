// "?" dialog: the key and gesture legend lives here instead of a permanent paragraph under the table.
import { showModal } from './modal';
import { STR } from './strings';
import { esc } from './ui';

export function showHelp(close: () => void): void {
  const m = showModal(`<div class="card wide" role="dialog" aria-modal="true" aria-labelledby="hp-title">
    <h2 id="hp-title">${esc(STR.helpTitle)}</h2>
    <ul class="keys">${STR.helpLines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <div class="row"><button class="btn primary" id="hp-close" type="button">${esc(STR.close)} <kbd>Esc</kbd></button></div></div>`, '#hp-close');
  m.querySelector('#hp-close')?.addEventListener('click', close);
}
