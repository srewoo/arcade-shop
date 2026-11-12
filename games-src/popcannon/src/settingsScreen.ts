// Settings panel. Rows update in place so keyboard focus is never lost.
import { button, h } from './dom';
import { show } from './overlay';
import { Actions } from './screens';
import { Settings } from './settings';
import { S } from './strings';

const cycle = <T,>(list: readonly T[], cur: T): T => list[(list.indexOf(cur) + 1) % list.length] as T;

interface Row { el: HTMLElement; sync(s: Settings): void }

function toggle(label: string, key: string, text: (s: Settings) => string, press: (s: Settings) => Partial<Settings>,
  a: Actions, get: () => Settings, pressed?: (s: Settings) => boolean): Row {
  const b = button('', () => {
    a.settings(press(get()));
    sync(get());
  }, 'btn small', { 'data-key': key });
  const sync = (s: Settings): void => {
    b.textContent = text(s);
    if (pressed) b.setAttribute('aria-pressed', String(pressed(s)));
  };
  return { el: h('div', { class: 'row' }, [h('span', {}, [label]), b]), sync };
}

function volumeRow(a: Actions): Row {
  const out = h('output', { class: 'vol-out' });
  const input = h('input', { type: 'range', min: '0', max: '100', step: '10', 'aria-label': S.settingsRows.volume, 'data-key': 'volume', class: 'slider' });
  input.addEventListener('input', () => {
    a.settings({ volume: Number(input.value) });
    out.textContent = `${input.value}%`;
  });
  input.addEventListener('change', () => a.settings({ volume: Number(input.value) }));
  const sync = (s: Settings): void => {
    input.value = String(s.volume);
    out.textContent = `${s.volume}%`;
  };
  return { el: h('div', { class: 'row' }, [h('span', {}, [S.settingsRows.volume]), h('div', { class: 'slide' }, [input, out])]), sync };
}

export function showSettings(a: Actions, get: () => Settings, back: () => void): void {
  const R = S.settingsRows;
  const rows: Row[] = [
    volumeRow(a),
    toggle(R.sound, 'sound', (s) => S.onOff(s.sound), (s) => ({ sound: !s.sound }), a, get, (s) => s.sound),
    toggle(R.motion, 'motion', (s) => S.motionLabel[s.motion], (s) => ({ motion: cycle(['system', 'reduce', 'full'] as const, s.motion) }), a, get),
    toggle(R.assist, 'assist', (s) => S.onOff(s.symbols), (s) => ({ symbols: !s.symbols }), a, get, (s) => s.symbols),
    toggle(R.text, 'text', (s) => `${s.textScale}%`, (s) => ({ textScale: cycle([100, 125, 150] as const, s.textScale) }), a, get),
    toggle(R.contrast, 'contrast', (s) => S.onOff(s.highContrast), (s) => ({ highContrast: !s.highContrast }), a, get, (s) => s.highContrast),
    toggle(R.theme, 'theme', (s) => S.themeLabel[s.theme], (s) => ({ theme: cycle(['system', 'light', 'dark'] as const, s.theme) }), a, get),
  ];
  rows.forEach((r) => r.sync(get()));
  show(S.settings, [
    h('div', { class: 'rows' }, rows.map((r) => r.el)),
    button(S.back, back, 'btn primary', { 'data-key': 'back' }),
  ], S.settings, { onBack: back, focusKey: 'volume' });
}
