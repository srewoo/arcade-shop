// Tiny DOM helper: build elements without innerHTML.
type Attrs = Record<string, string | boolean | number | undefined>;

export function h(tag: string, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : String(v));
  }
  el.append(...kids);
  return el;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const t = Math.floor((total % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
}

/** Build a `<button type="button">` with a click handler. */
export function button(label: string, cls: string, onClick: () => void, id?: string): HTMLButtonElement {
  const b = h('button', { type: 'button', class: cls, id }, label) as HTMLButtonElement;
  b.addEventListener('click', onClick);
  return b;
}
