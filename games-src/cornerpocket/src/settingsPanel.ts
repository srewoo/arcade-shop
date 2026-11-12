// Settings dialog: volume, reduce motion, colour-blind assist, text size, theme, difficulty.
import { showModal } from './modal';
import type { Settings } from './settings';
import { STR } from './strings';
import { esc } from './ui';

type Patch = Partial<Settings>;

function seg(label: string, key: string, opts: readonly [string, string][], current: string): string {
  const btns = opts.map(([v, t]) => `<button type="button" data-k="${key}" data-v="${v}" aria-pressed="${v === current}">${esc(t)}</button>`).join('');
  return `<div class="field"><span class="flabel" id="lbl-${key}">${esc(label)}</span><div class="seg" role="group" aria-labelledby="lbl-${key}">${btns}</div></div>`;
}

export function showSettings(s: Settings, apply: (p: Patch) => void, close: () => void): void {
  const mo = Object.entries(STR.motionOptions) as [string, string][];
  const th = Object.entries(STR.themeOptions) as [string, string][];
  const html = `<div class="card wide" role="dialog" aria-modal="true" aria-labelledby="st-title">
    <h2 id="st-title">${esc(STR.settingsTitle)}</h2>
    <div class="field"><label class="flabel" for="st-volume">${esc(STR.volume)} <output id="st-volout">${s.volume}</output></label>
      <input id="st-volume" class="range" type="range" min="0" max="100" step="5" value="${s.volume}" /></div>
    ${seg(STR.sound, 'sound', [['true', STR.on], ['false', STR.off]], String(s.sound))}
    ${seg(STR.reduceMotion, 'reduceMotion', mo, s.reduceMotion)}
    ${seg(STR.colorAssist, 'colorAssist', [['true', STR.on], ['false', STR.off]], String(s.colorAssist))}
    ${seg(STR.textSize, 'textSize', [['100', '100%'], ['125', '125%'], ['150', '150%']], String(s.textSize))}
    ${seg(STR.theme, 'theme', th, s.theme)}
    ${seg(STR.difficulty, 'level', [['easy', 'Easy'], ['pro', 'Pro']], s.level)}
    <div class="row"><button class="btn primary" id="st-close" type="button">${esc(STR.close)} <kbd>Esc</kbd></button></div></div>`;
  const m = showModal(html, '#st-close');
  m.querySelector('#st-close')?.addEventListener('click', close);
  const vol = m.querySelector<HTMLInputElement>('#st-volume')!;
  vol.addEventListener('input', () => {
    m.querySelector<HTMLElement>('#st-volout')!.textContent = vol.value;
    apply({ volume: Number(vol.value) });
  });
  m.querySelectorAll<HTMLButtonElement>('button[data-k]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset['k']!; const v = b.dataset['v']!;
    const value = k === 'sound' || k === 'colorAssist' ? v === 'true' : k === 'textSize' ? Number(v) : v;
    apply({ [k]: value } as Patch);
    b.parentElement?.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));
}
