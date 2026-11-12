// First-run hint: a pill over the bottom rail of the table. Overlaid (never reflows the layout), fades by itself, shown once.
import { LAYOUT } from './config/layout';
import { STR } from './strings';
import { $, esc } from './ui';

let timer: number | undefined;

export function showCoach(onDismiss: () => void): void {
  const c = $('coach');
  c.innerHTML = `<div class="coachcard" role="group" aria-label="${esc(STR.coachTitle)}">
    <p>${STR.coachSteps.map((t) => esc(t)).join(', ')}</p>
    <button class="btn primary" id="coach-ok" type="button">${esc(STR.coachDismiss)}</button></div>`;
  c.hidden = false;
  $('coach-ok').addEventListener('click', onDismiss);
  window.clearTimeout(timer);
  timer = window.setTimeout(onDismiss, LAYOUT.coachSeconds * 1000);
}

export function hideCoach(): void { window.clearTimeout(timer); $('coach').hidden = true; $('coach').innerHTML = ''; }
export const coachVisible = (): boolean => !$('coach').hidden;
