// "Enter my own puzzle" dialog: validates and reports clearly.
import { validatePuzzle, type ParseResult } from '../core/puzzleInput';
import { $ } from './dom';

type Ok = Extract<ParseResult, { ok: true }>;

export function bindCustomDialog(onPlay: (p: Ok, solveNow: boolean) => void): { open: () => void } {
  const dlg = $<HTMLDialogElement>('dlg-custom');
  const text = $<HTMLTextAreaElement>('custom-text');
  const msg = $('custom-msg');

  const check = (solveNow: boolean): void => {
    const res = validatePuzzle(text.value);
    msg.classList.toggle('ok', res.ok);
    if (!res.ok) {
      msg.textContent = res.message;
      return;
    }
    msg.textContent = `Valid: one solution, ${res.clues} clues, rated ${res.difficulty}.`;
    dlg.close();
    onPlay(res, solveNow);
  };

  $('custom-form').addEventListener('submit', (e) => {
    e.preventDefault();
    check(false);
  });
  $('custom-solve').addEventListener('click', () => check(true));
  $('custom-cancel').addEventListener('click', () => dlg.close());
  text.addEventListener('input', () => {
    msg.textContent = '';
  });
  return {
    open: () => {
      msg.textContent = '';
      dlg.showModal();
      text.focus();
    },
  };
}
