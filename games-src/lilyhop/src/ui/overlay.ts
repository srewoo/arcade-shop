// Modal overlays: the rest of the page goes `inert` (focus trap), Esc closes the
// top one, and focus returns to whatever opened it.

interface Entry {
  readonly node: HTMLElement;
  readonly opener: HTMLElement | null;
  readonly onClose: () => void;
}

const stack: Entry[] = [];
let background: HTMLElement[] = [];

/** Elements made inert while any overlay is open (the page itself). */
export function setBackground(nodes: HTMLElement[]): void {
  background = nodes;
}

function sync(): void {
  const top = stack.at(-1);
  background.forEach((n) => (n.inert = top !== undefined));
  stack.forEach((e) => (e.node.inert = e !== top));
}

const focusables = (node: HTMLElement): HTMLElement[] =>
  [...node.querySelectorAll<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])')].filter(
    (n) => !n.hidden && !n.closest('[hidden]') && !(n as HTMLButtonElement).disabled,
  );

export function openOverlay(node: HTMLElement, opener: HTMLElement | null, onClose: () => void, focus?: HTMLElement): void {
  if (stack.some((e) => e.node === node)) return;
  stack.push({ node, opener, onClose });
  node.hidden = false;
  sync();
  (focus ?? focusables(node)[0])?.focus();
}

export function closeOverlay(node: HTMLElement): void {
  const at = stack.findIndex((e) => e.node === node);
  const entry = stack[at];
  if (!entry) return;
  stack.splice(at, 1);
  node.hidden = true;
  sync();
  const target = entry.opener && !entry.opener.closest('[hidden]') ? entry.opener : null;
  target?.focus();
}

export const isOverlayOpen = (): boolean => stack.length > 0;
export const topOverlay = (): HTMLElement | null => stack.at(-1)?.node ?? null;

/** Close the top overlay (Esc). Returns false when none is open. */
export function closeTop(): boolean {
  const entry = stack.at(-1);
  if (!entry) return false;
  closeOverlay(entry.node);
  entry.onClose();
  return true;
}

/** Keep Tab inside the top overlay. */
export function installTrap(): void {
  document.addEventListener('keydown', (e) => {
    const top = stack.at(-1);
    if (!top || e.key !== 'Tab') return;
    const items = focusables(top.node);
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
