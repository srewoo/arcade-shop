// Roving tabindex + arrow-key navigation for a group of buttons.

export interface RovingOptions {
  /** Items per row; arrows Up/Down move by this much (1 = horizontal list only). */
  readonly columns: number;
  readonly items: () => HTMLElement[];
}

export function attachRoving(container: HTMLElement, opts: RovingOptions): void {
  const move = (items: HTMLElement[], from: number, key: string): number => {
    const { columns } = opts;
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
    const delta = step[key];
    if (delta === undefined || (columns === 1 && (key === 'ArrowUp' || key === 'ArrowDown'))) return from;
    const next = from + delta;
    return next >= 0 && next < items.length ? next : from;
  };
  container.addEventListener('keydown', (e) => {
    const items = opts.items();
    const from = items.indexOf(document.activeElement as HTMLElement);
    if (from < 0) return;
    const to = move(items, from, e.key);
    if (to === from) return;
    e.preventDefault();
    items.forEach((it, i) => (it.tabIndex = i === to ? 0 : -1));
    items[to]?.focus();
  });
  container.addEventListener('focusin', (e) => {
    const items = opts.items();
    const at = items.indexOf(e.target as HTMLElement);
    if (at >= 0) items.forEach((it, i) => (it.tabIndex = i === at ? 0 : -1));
  });
}
