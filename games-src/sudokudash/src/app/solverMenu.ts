// The "Solver" popover: Solve step, and Solve all behind a two-step confirmation that reverts
// by itself. Keeps the destructive button away from Pause and Hint.
import { TIMING } from '../config/timing';
import type { Session } from '../session';
import { STR } from '../strings';
import { $ } from '../ui/dom';

export function bindSolverMenu(getSession: () => Session | null): void {
  const toggle = $<HTMLButtonElement>('tool-solver');
  const pop = $('solver-pop');
  const all = $<HTMLButtonElement>('tool-all');
  let timer = 0;

  const disarm = (): void => {
    window.clearTimeout(timer);
    all.classList.remove('armed');
    all.textContent = STR.solveAll;
  };
  const close = (): void => {
    pop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    disarm();
  };

  toggle.addEventListener('click', () => {
    const open = pop.hidden;
    pop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) disarm();
  });
  $('tool-step').addEventListener('click', () => {
    close();
    getSession()?.solveStep();
  });
  all.addEventListener('click', () => {
    if (!all.classList.contains('armed')) {
      all.classList.add('armed');
      all.textContent = STR.confirmSolveAll;
      window.clearTimeout(timer);
      timer = window.setTimeout(disarm, TIMING.confirmRevertMs);
      return;
    }
    close();
    getSession()?.solveAll();
  });
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !(e.target instanceof Node && (pop.contains(e.target) || toggle.contains(e.target)))) close();
  });
}
