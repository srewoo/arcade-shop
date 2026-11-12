// Modal overlay: one panel at a time, focus trap, inert background, Esc handling, focus return.
import { byId, h } from './dom';

const BACKGROUND = ['.hud', '.stage'];


export interface ShowOptions {
  /** Called when the player presses Esc on this screen; omit for screens with no back. */
  onBack?: () => void;
  /** `data-key` of the control that should get focus first. */
  focusKey?: string;
  /** Extra class on the panel (e.g. `title`, `result`). */
  variant?: string;
  /** Replaces the plain <h2> heading (it receives id `panel-title`). */
  heading?: HTMLElement;
}

let back: (() => void) | undefined;
let opener: HTMLElement | null = null;

const overlay = (): HTMLElement => byId('overlay');
export const overlayOpen = (): boolean => !overlay().hidden;

function setInert(on: boolean): void {
  for (const sel of BACKGROUND) document.querySelectorAll(sel).forEach((el) => el.toggleAttribute('inert', on));
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const focusables = (panel: Element): HTMLElement[] => [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];

export function show(title: string, body: HTMLElement[], opts: ShowOptions = {}): void {
  const o = overlay();
  if (o.hidden) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const heading = opts.heading ?? h('h2', {}, [title]);
  heading.id = 'panel-title';
  const panel = h('section', { class: `panel ${opts.variant ?? ''}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title' }, [heading, ...body]);
  back = opts.onBack;
  o.replaceChildren(panel);
  o.hidden = false;
  setInert(true);
  const target = opts.focusKey ? panel.querySelector<HTMLElement>(`[data-key="${opts.focusKey}"]`) : null;
  (target ?? focusables(panel)[0])?.focus();
}

export function hideOverlay(restoreFocus = true): void {
  back = undefined;
  overlay().hidden = true;
  overlay().replaceChildren();
  setInert(false);
  if (restoreFocus && opener?.isConnected) opener.focus();
  opener = null;
}

/** Esc: run the open screen's back action. Returns true when one handled the key. */
export function goBack(): boolean {
  if (!overlayOpen() || !back) return false;
  back();
  return true;
}

/** Keep Tab inside the open panel. */
export function trapTab(e: KeyboardEvent): void {
  if (e.key !== 'Tab' || !overlayOpen()) return;
  const panel = overlay().firstElementChild;
  if (!panel) return;
  const items = focusables(panel);
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  const active = document.activeElement;
  if (!panel.contains(active) || (e.shiftKey && active === first)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}
