// Tiny DOM helpers shared by the UI modules.

export function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}

/** Fill a <select> with value/label pairs. */
export function fillSelect(sel: HTMLSelectElement, options: readonly (readonly [value: string, label: string])[]): void {
  sel.replaceChildren(...options.map(([value, label]) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  }));
}
