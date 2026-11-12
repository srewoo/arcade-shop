// Reusable settings controls: segmented radio group, toggle, slider, plain buttons.
import { h } from './dom';

export function button(label: string, key: string, onClick: () => void, variant: 'primary' | 'ghost' | 'danger' = 'ghost'): HTMLButtonElement {
  const b = h('button', { type: 'button', class: `btn ${variant}`, 'data-key': key }, [label]);
  b.addEventListener('click', onClick);
  return b;
}

export function segmented<T extends string | number>(
  label: string,
  key: string,
  options: readonly { value: T; text: string }[],
  current: T,
  onPick: (v: T) => void,
): HTMLElement {
  const group = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
  for (const o of options) {
    const on = o.value === current;
    const b = h('button', { type: 'button', class: 'seg-btn', role: 'radio', 'aria-checked': String(on), 'data-key': `${key}-${o.value}` }, [o.text]);
    b.addEventListener('click', () => onPick(o.value));
    group.append(b);
  }
  return h('div', { class: 'field' }, [h('span', { class: 'field-label' }, [label]), group]);
}

export function toggle(label: string, key: string, on: boolean, onChange: (v: boolean) => void, hint?: string): HTMLElement {
  const b = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(on), 'data-key': key }, [on ? 'On' : 'Off']);
  b.addEventListener('click', () => onChange(!on));
  const text = h('span', { class: 'field-label' }, [label]);
  if (hint) text.append(h('small', { class: 'hint' }, [hint]));
  return h('div', { class: 'field row' }, [text, b]);
}

export function slider(label: string, key: string, value: number, onInput: (v: number) => void): HTMLElement {
  const out = h('output', { class: 'slider-out' }, [`${value}`]);
  const input = h('input', { type: 'range', min: '0', max: '100', step: '5', value: String(value), 'data-key': key, 'aria-label': label });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    out.textContent = String(v);
    onInput(v);
  });
  return h('div', { class: 'field row' }, [h('span', { class: 'field-label' }, [label]), h('div', { class: 'slider' }, [input, out])]);
}
