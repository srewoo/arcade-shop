// Tiny DOM helper used by the overlay screens.
import { playEvent } from './audio';

type Child = Node | string;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Child[] = [],
  onClick?: () => void,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) el.append(c);
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

/** A real <button>; clicks play the UI sound through the audio event system. */
export const button = (label: string, onClick: () => void, cls = 'btn', attrs: Record<string, string> = {}): HTMLButtonElement =>
  h('button', { type: 'button', class: cls, ...attrs }, [label], () => {
    playEvent({ type: 'ui', n: 0 });
    onClick();
  });

export function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from index.html`);
  return el as T;
}
