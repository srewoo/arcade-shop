// Title and result screens (DOM rendering only; rules live elsewhere).
import { CONFIG } from './config';
import { dailyBest, type Records } from './records';
import { score } from './sim';
import { MODES, type Mode, type Sim } from './simTypes';
import { countValue, tierFor, tipFor } from './result';
import { fmtTime, MODE_INFO, OUTCOME_SUB, OUTCOME_TITLE, STR, TIER_LABEL } from './strings';
import { $ } from './ui/dom';

function bestLabel(mode: Mode, r: Records, day: string): string {
  const best = mode === 'endless' ? r.endless : mode === 'trial' ? r.trial : dailyBest(r, day);
  if (best === 0) return STR.noBest;
  const extra = mode === 'trial' && r.trialTime > 0 ? ` (${fmtTime(r.trialTime)})` : '';
  return `${STR.best} ${best}${extra}`;
}

export function renderTitle(r: Records, day: string, onPick: (m: Mode) => void): void {
  const box = $('modes');
  box.replaceChildren();
  MODES.forEach((mode, i) => {
    const info = MODE_INFO[mode];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode';
    b.dataset.mode = mode;
    const name = document.createElement('b');
    name.textContent = `${i + 1}. ${info.name}`;
    const desc = document.createElement('span');
    desc.textContent = mode === 'daily' ? `${info.desc} (${day})` : info.desc;
    const best = document.createElement('em');
    best.textContent = bestLabel(mode, r, day);
    b.append(name, desc, best);
    b.addEventListener('click', () => onPick(mode));
    box.append(b);
  });
  const list = $('howto');
  if (!list.childElementCount) {
    for (const line of STR.howto) {
      const li = document.createElement('li');
      li.textContent = line;
      list.append(li);
    }
  }
}

function countUp(el: HTMLElement, to: number, reduce: boolean): void {
  if (reduce || to === 0) { el.textContent = String(to); return; }
  const start = performance.now();
  const tick = (now: number): void => {
    const t = (now - start) / 700;
    el.textContent = String(countValue(to, t));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function renderResult(s: Sim, newBest: boolean, best: string, reduce = false): void {
  const outcome = s.outcome ?? 'crash';
  $('result-title').textContent = OUTCOME_TITLE[outcome];
  $('result-sub').textContent = newBest ? `${OUTCOME_SUB[outcome]} ${STR.newBest}` : `${OUTCOME_SUB[outcome]} ${best}`;
  const total = score(s);
  const tier = tierFor(total);
  const tierEl = $('result-tier');
  tierEl.dataset.tier = tier;
  tierEl.textContent = TIER_LABEL[tier];
  countUp($('result-score'), total, reduce);
  $('result-tip').textContent = tipFor({ outcome, nearMisses: s.nearMisses, crashes: s.crashes, maxCombo: s.maxCombo });
  const L = STR.resultLabels;
  const rows: [string, string][] = [
    [L.distance, `${Math.floor(s.z)} m`],
    [L.near, String(s.nearMisses)],
    [L.combo, String(s.maxCombo)],
    [L.crashes, String(s.crashes)],
    [L.time, fmtTime(s.runT)],
  ];
  if (s.mode === 'trial') rows.push([L.checkpoints, `${s.checkpoint}/${CONFIG.trial.checkpoints}`]);
  const dl = $('result-stats');
  dl.replaceChildren();
  for (const [k, v] of rows) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    wrap.append(dt, dd);
    dl.append(wrap);
  }
}

export const bestFor = bestLabel;
