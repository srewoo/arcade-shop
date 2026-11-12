// Small form-control builders for the Settings dialog. Every row's whole line is the hit area (44 px min).
import { h } from '../dom';

export function slider(label: string, id: string, value: number, min: number, max: number, fmt: (v: number) => string, set: (v: number) => void): HTMLElement {
  const out = h('output', { for: id }, fmt(value));
  const input = h('input', { type: 'range', id, min, max, step: 1, value }) as HTMLInputElement;
  input.addEventListener('input', () => {
    out.textContent = fmt(Number(input.value));
    set(Number(input.value));
  });
  return h('div', { class: 'field slider' }, h('label', { for: id }, label), out, input);
}

/** Segmented pill group: one button per option, the active one has aria-pressed="true". */
export function segmented(label: string, id: string, value: string, options: readonly (readonly [string, string])[], set: (v: string) => void): HTMLElement {
  const group = h('div', { class: 'seg', role: 'group', id, 'aria-labelledby': `${id}-l` });
  const btns = options.map(([v, t]) => {
    const b = h('button', { type: 'button', 'data-v': v, 'aria-pressed': String(v === value) }, t) as HTMLButtonElement;
    b.addEventListener('click', () => {
      btns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      set(v);
    });
    return b;
  });
  group.append(...btns);
  return h('div', { class: 'field segfield' }, h('span', { id: `${id}-l`, class: 'seglabel' }, label), group);
}

export function toggle(label: string, id: string, value: boolean, set: (v: boolean) => void): HTMLElement {
  return segmented(label, id, value ? 'on' : 'off', [['on', 'On'], ['off', 'Off']], (v) => set(v === 'on'));
}

export function select(label: string, id: string, value: string, options: readonly (readonly [string, string])[], set: (v: string) => void): HTMLElement {
  if (options.length <= 3) return segmented(label, id, value, options, set);
  const sel = h('select', { id }) as HTMLSelectElement;
  for (const [v, t] of options) sel.append(h('option', { value: v }, t));
  sel.value = value;
  sel.addEventListener('change', () => set(sel.value));
  return h('div', { class: 'field' }, h('label', { for: id }, label), sel);
}

/** Collapsible section with its own Reset button. */
export function section(id: string, title: string, open: boolean, body: HTMLElement[], resetLabel: string, onReset: () => void): HTMLElement {
  const reset = h('button', { type: 'button', class: 'btn ghost small', 'data-reset': id }, resetLabel);
  reset.addEventListener('click', onReset);
  const d = h('details', { class: 'sec', 'data-sec': id, open }, h('summary', {}, title), ...body, h('div', { class: 'row end' }, reset));
  return d;
}
