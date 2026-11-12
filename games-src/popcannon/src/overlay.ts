// Modal overlay: one panel at a time, focus trap, inert background, Esc/back handling.
import { h, byId } from './dom';

const BACKGROUND = ['.top', '.hud', '.controls'];

export interface ShowOptions {
  /** Called when the player presses Esc on this screen; omit for screens with no back. */
  onBack?: () => void;
  /** `data-key` of the control that should get focus first. */
  focusKey?: string;
  /** `coach` hides the blurred wash so the playfield stays visible. */
  mode?: 'panel' | 'coach';
}

let back: (() => void) | undefined;

const overlay = (): HTMLElement => byId('overlay');
export const overlayOpen = (): boolean => !overlay().hidden;

function setInert(on: boolean): void {
  for (const sel of BACKGROUND) document.querySelectorAll(sel).forEach((el) => el.toggleAttribute('inert', on));
}

function focusables(panel: Element): HTMLElement[] {
  const sel = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
  return [...panel.querySelectorAll<HTMLElement>(sel)];
}

export function show(title: string, body: HTMLElement[], label: string, opts: ShowOptions = {}): void {
  const o = overlay();
  const heading = h('h2', { id: 'panel-title' }, [title]);
  const panel = h('section', { class: 'panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'panel-title', 'aria-label': label }, [
    heading,
    ...body,
  ]);
  back = opts.onBack;
  o.dataset.mode = opts.mode ?? 'panel';
  o.replaceChildren(panel);
  o.hidden = false;
  setInert(true);
  const target = opts.focusKey ? panel.querySelector<HTMLElement>(`[data-key="${opts.focusKey}"]`) : null;
  (target ?? focusables(panel)[0])?.focus();
}

export function hideOverlay(): void {
  back = undefined;
  overlay().hidden = true;
  overlay().replaceChildren();
  setInert(false);
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
  if (!panel.contains(active)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

export function bindOverlayKeys(): void {
  window.addEventListener('keydown', trapTab);
}
