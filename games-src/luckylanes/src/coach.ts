// First-run coach card: a short, dismissible hint over the lane. Shown once (flag in settings).
import { byId } from './dom';
import { S } from './strings';

export function initCoach(onDismiss: () => void): void {
  byId('coach-title').textContent = S.coachTitle;
  byId('coach-steps').replaceChildren(...S.coachSteps.map((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));
  const ok = byId('coach-ok');
  ok.textContent = S.coachDismiss;
  ok.addEventListener('click', () => { hideCoach(); onDismiss(); });
}

export const showCoach = (): void => { byId('coach').hidden = false; document.body.classList.add('coach-on'); };
export const hideCoach = (): void => { byId('coach').hidden = true; document.body.classList.remove('coach-on'); };
export const coachVisible = (): boolean => !byId('coach').hidden;
