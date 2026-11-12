// The hint / solver explanation panel.
import { TECHNIQUE_LABEL } from '../core/steps';
import type { Session } from '../session';
import { $ } from './dom';

export function renderHint(s: Session): void {
  const panel = $('hint-panel');
  const hint = s.hint;
  panel.hidden = hint === null || hint.kind === 'solved';
  // Small screens swap the digit pad for the hint sheet (CSS), so opening a hint never pushes the tools off-screen.
  document.body.classList.toggle('hint-open', !panel.hidden);
  if (!hint || hint.kind === 'solved') return;
  const apply = $<HTMLButtonElement>('btn-hint-apply');
  const prefix = s.hintApplied ? 'Solver applied: ' : '';
  if (hint.kind === 'step') {
    $('hint-tag').textContent = `${prefix}${TECHNIQUE_LABEL[hint.step.technique]}`;
    $('hint-text').textContent = hint.step.message;
    apply.textContent = hint.step.placement ? 'Place it' : 'Apply and show notes';
  } else if (hint.kind === 'mistake') {
    $('hint-tag').textContent = 'Mistake found';
    $('hint-text').textContent = hint.message;
    apply.textContent = 'Erase it';
  } else {
    $('hint-tag').textContent = `${prefix}Trial and error`;
    $('hint-text').textContent = hint.message;
    apply.textContent = 'Place it';
  }
  apply.hidden = s.hintApplied;
}
