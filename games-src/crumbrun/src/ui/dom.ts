// Tiny DOM helpers for the dialogs. Text is always set via textContent (never innerHTML).
export interface Props {
  readonly cls?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Partial<Record<'click' | 'input' | 'keydown', (e: Event) => void>>>;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, props: Props = {}, ...kids: readonly (Node | string)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.cls) el.className = props.cls;
  if (props.text !== undefined) el.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) el.setAttribute(k, v);
  for (const [ev, fn] of Object.entries(props.on ?? {})) el.addEventListener(ev, fn as EventListener);
  for (const kid of kids) el.append(kid);
  return el;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((e) => !e.hidden);
}

/** Next focus target for a Tab press that must stay inside `root`. */
export function trapTarget(list: readonly HTMLElement[], active: Element | null, backwards: boolean): HTMLElement | null {
  if (list.length === 0) return null;
  const i = active ? list.indexOf(active as HTMLElement) : -1;
  if (i === -1) return list[backwards ? list.length - 1 : 0] ?? null;
  if (backwards && i === 0) return list[list.length - 1] ?? null;
  if (!backwards && i === list.length - 1) return list[0] ?? null;
  return null; // inside the list: let the browser move focus naturally
}

/** Wraps an action so it is skipped while `isDisabled()` is true. */
export function whenEnabled(isDisabled: () => boolean, fn: () => void): () => void {
  return () => {
    if (!isDisabled()) fn();
  };
}
