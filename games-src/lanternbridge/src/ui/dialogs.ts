// Native <dialog> wrappers: modal focus trap, Esc to close and focus return come
// from the platform. Confirmations are in-page (never window.confirm).
import { S } from '../strings';
import { h } from './dom';

export interface Modal {
  readonly el: HTMLDialogElement;
  readonly body: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export function createModal(id: string, title: string, wide = false): Modal {
  const body = h('div', { class: 'dlg-body' });
  const el = h('dialog', { id, class: `dlg${wide ? ' wide' : ''}`, 'aria-labelledby': `${id}-title` }, h('h2', { id: `${id}-title`, text: title }), body);
  document.body.append(el);
  return {
    el,
    body,
    open: () => (el.open ? undefined : el.showModal()),
    close: () => el.close(),
    isOpen: () => el.open,
  };
}

export const anyModalOpen = (): boolean => document.querySelector('dialog[open]') !== null;

const confirmDlg = createLazy(() => {
  const m = createModal('dlg-confirm', S.confirm.yes);
  m.el.setAttribute('role', 'alertdialog');
  return m;
});

function createLazy<T>(make: () => T): () => T {
  let v: T | null = null;
  return () => (v ??= make());
}

/** Ask a yes/no question; resolves true only on the confirm button. Esc/No resolve false. */
export function confirmAction(question: string, yesLabel: string): Promise<boolean> {
  const m = confirmDlg();
  const title = m.el.querySelector('h2') as HTMLElement;
  title.textContent = question;
  const yes = h('button', { class: 'btn danger', type: 'button', text: yesLabel });
  const no = h('button', { class: 'btn', type: 'button', text: S.confirm.no, autofocus: true });
  m.body.replaceChildren(h('div', { class: 'row' }, no, yes));
  return new Promise((resolve) => {
    let result = false;
    yes.addEventListener('click', () => { result = true; m.close(); });
    no.addEventListener('click', () => m.close());
    m.el.addEventListener('close', () => resolve(result), { once: true });
    m.open();
    no.focus();
  });
}
