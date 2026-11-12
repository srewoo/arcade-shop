// Modal stack: focus trap, Esc handling, inert background, focus returns to the opener.
interface Entry { el: HTMLElement; opener: HTMLElement | null; onEsc: () => void; fallback: HTMLElement | null }

const stack: Entry[] = [];
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusables = (el: HTMLElement): HTMLElement[] =>
  [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !n.closest('[hidden]'));

export const anyOverlay = (): boolean => stack.length > 0;
export const topOverlay = (): HTMLElement | null => stack[stack.length - 1]?.el ?? null;
export const isOpen = (el: HTMLElement): boolean => stack.some((e) => e.el === el);

export interface OpenOptions { onEsc?: () => void; focus?: HTMLElement; fallback?: HTMLElement }

export function openOverlay(el: HTMLElement, opts: OpenOptions = {}): void {
  if (isOpen(el)) return;
  const prev = stack[stack.length - 1];
  if (prev) prev.el.inert = true;
  const active = document.activeElement;
  stack.push({
    el,
    opener: active instanceof HTMLElement ? active : null,
    onEsc: opts.onEsc ?? (() => closeOverlay(el)),
    fallback: opts.fallback ?? null,
  });
  el.hidden = false;
  el.inert = false;
  (opts.focus ?? focusables(el)[0])?.focus();
}

export function closeOverlay(el: HTMLElement): void {
  const i = stack.findIndex((e) => e.el === el);
  if (i < 0) return;
  const [entry] = stack.splice(i, 1);
  el.hidden = true;
  const top = stack[stack.length - 1];
  if (top) top.el.inert = false;
  const target = entry?.opener && entry.opener.isConnected && !entry.opener.closest('[hidden]') ? entry.opener : entry?.fallback;
  target?.focus();
}

/** Returns true when the key was consumed by the open dialog. */
export function handleOverlayKey(e: KeyboardEvent): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  if (e.key === 'Escape') {
    e.preventDefault();
    top.onEsc();
    return true;
  }
  if (e.key !== 'Tab') return false;
  const items = focusables(top.el);
  if (items.length === 0) return true;
  const first = items[0] as HTMLElement;
  const last = items[items.length - 1] as HTMLElement;
  const active = document.activeElement;
  if (!top.el.contains(active)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
  return true;
}
