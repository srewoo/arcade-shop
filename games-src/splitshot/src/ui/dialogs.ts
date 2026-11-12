// Modal dialog stack: focus trap, focus return, inert background, Esc routing.
interface Entry { el: HTMLElement; opener: HTMLElement | null; first: HTMLElement | null; onEscape?: () => void }
const stack: Entry[] = [];

const FOCUSABLE = 'button:not([disabled]):not([hidden]), input:not([disabled]), [tabindex="0"]';

export const topDialog = (): Entry | undefined => stack[stack.length - 1];
export const dialogOpen = (id?: string): boolean => (id ? stack.some((e) => e.el.id === id) : stack.length > 0);

function syncInert(): void {
  document.getElementById('app')?.toggleAttribute('inert', stack.length > 0);
  stack.forEach((e, i) => e.el.toggleAttribute('inert', i !== stack.length - 1));
}

export function openDialog(el: HTMLElement, o: { opener?: HTMLElement | null; first?: HTMLElement | null; onEscape?: () => void }): void {
  if (stack.some((e) => e.el === el)) return;
  const active = document.activeElement;
  const opener = o.opener ?? (active instanceof HTMLElement && active !== document.body ? active : null);
  stack.push({ el, opener, first: o.first ?? null, onEscape: o.onEscape });
  el.hidden = false;
  syncInert();
  (o.first ?? el.querySelector<HTMLElement>(FOCUSABLE))?.focus();
}

export function closeDialog(el: HTMLElement): void {
  const i = stack.findIndex((e) => e.el === el);
  if (i < 0) return;
  const [entry] = stack.splice(i, 1);
  el.hidden = true;
  syncInert();
  if (i !== stack.length) return;
  const back = entry?.opener;
  if (back && back.isConnected && !back.closest('[inert]') && !back.closest('[hidden]')) back.focus();
  else {
    const t = topDialog();
    (t?.first ?? t?.el.querySelector<HTMLElement>(FOCUSABLE))?.focus();
  }
}

export function installFocusTrap(): void {
  document.addEventListener('keydown', (e) => {
    const top = topDialog();
    if (!top || e.key !== 'Tab') return;
    const items = [...top.el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => !n.closest('[hidden]'));
    if (items.length === 0) return;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !top.el.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !top.el.contains(active))) { e.preventDefault(); first.focus(); }
  });
}
