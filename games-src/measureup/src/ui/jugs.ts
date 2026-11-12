// Draws the row of jugs (DOM + CSS) and keeps their liquid, labels and
// highlights in step with the game state.
import type { Amounts, Goal, LevelDef } from '../jugs';
import { S } from '../strings';

const VESSEL_MIN = 0.16;

function ticksFor(cap: number): string {
  let out = '';
  for (let i = 1; i < cap; i++) out += `<span class="tick${i % 5 === 0 ? ' five' : ''}" style="bottom:${(i / cap) * 100}%"></span>`;
  return out;
}

export function buildJugs(host: HTMLElement, level: LevelDef, onPick: (i: number) => void): void {
  const biggest = Math.max(...level.jugs);
  host.replaceChildren();
  level.jugs.forEach((cap, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jug';
    btn.dataset.i = String(i);
    const goalMark = level.goal.amount <= cap ? `<span class="goalmark" style="bottom:${(level.goal.amount / cap) * 100}%"></span>` : '';
    btn.innerHTML = `<span class="badge">${S.jugName(i)}</span><span class="tag" aria-hidden="true"></span><span class="vessel" style="--r:${Math.max(VESSEL_MIN, cap / biggest)}">` +
      `<span class="jhandle"></span><span class="liquid" style="--fill:0"></span><span class="shine"></span>${ticksFor(cap)}${goalMark}</span><span class="cnt"><b>0</b>/${cap}</span>`;
    btn.addEventListener('click', () => onPick(i));
    host.append(btn);
  });
}

export function updateJugs(host: HTMLElement, caps: readonly number[], amounts: Amounts, goal: Goal, picked: number | null): void {
  host.classList.toggle('picking', picked !== null);
  host.querySelectorAll<HTMLElement>('.jug').forEach((btn, i) => {
    const role = picked === null ? '' : picked === i ? 'from' : 'to';
    btn.dataset.role = role;
    const tag = btn.querySelector<HTMLElement>('.tag');
    if (tag) tag.textContent = role === 'from' ? S.tagFrom : role === 'to' ? S.tagTo : '';
    const cap = caps[i] ?? 1;
    const amt = amounts[i] ?? 0;
    const match = amt === goal.amount;
    btn.classList.toggle('picked', picked === i);
    btn.classList.toggle('match', match);
    btn.classList.toggle('has', amt > 0);
    btn.setAttribute('aria-pressed', String(picked === i));
    btn.setAttribute('aria-label', S.jugAria(S.jugName(i), amt, cap, picked === i, match));
    btn.querySelector<HTMLElement>('.liquid')?.style.setProperty('--fill', String(amt / cap));
    const b = btn.querySelector('b');
    if (b) b.textContent = String(amt);
  });
}

/** Restart a one-shot CSS animation class on a jug. */
export function flashJug(host: HTMLElement, i: number, cls: 'pouring' | 'receiving' | 'shake' | 'flash', ms: number): void {
  const btn = host.querySelectorAll<HTMLElement>('.jug')[i];
  if (!btn) return;
  btn.classList.remove(cls);
  void btn.offsetWidth;
  btn.classList.add(cls);
  window.setTimeout(() => btn.classList.remove(cls), ms);
}
