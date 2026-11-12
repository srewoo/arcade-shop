// Win sparkles. Skipped under reduced motion (the gate still opens).
import { CONFIG } from '../config';

const COLOURS = ['#ffd36b', '#5aa9ee', '#3cc4b0', '#ff9a8f', '#b58cf0'];

export function sparkle(stage: HTMLElement, reduced: boolean): void {
  if (reduced) return;
  const burst = document.createElement('i');
  burst.className = 'spark burst';
  burst.style.left = '50%';
  burst.style.top = '55%';
  stage.append(burst);
  window.setTimeout(() => burst.remove(), 1000);
  const count = Math.round(CONFIG.fx.sparkCount);
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    s.style.left = `${20 + Math.random() * 60}%`;
    s.style.top = `${30 + Math.random() * 20}%`;
    s.style.background = COLOURS[i % COLOURS.length] ?? '#ffd36b';
    s.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 120)}px`);
    stage.append(s);
    window.setTimeout(() => s.remove(), 1500);
  }
}
