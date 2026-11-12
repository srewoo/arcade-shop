export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

/** Fill static markup from the strings module: data-str (text) and data-str-label (aria-label). */
export function applyStrings(strings: Readonly<Record<string, unknown>>, root: ParentNode = document): void {
  const text = (k: string): string => {
    const v = strings[k];
    if (typeof v !== 'string') throw new Error(`Missing string "${k}"`);
    return v;
  };
  root.querySelectorAll<HTMLElement>('[data-str]').forEach((el) => (el.textContent = text(el.dataset.str ?? '')));
  root.querySelectorAll<HTMLElement>('[data-str-label]').forEach((el) => {
    const label = text(el.dataset.strLabel ?? '');
    el.setAttribute('aria-label', label);
    if (!el.title) el.title = label;
  });
}
