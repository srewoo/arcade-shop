// Tiny DOM helpers shared by the UI modules.
export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing from index.html`);
  return node as T;
}

export function later(fn: () => void, ms: number): () => void {
  const id = window.setTimeout(fn, ms);
  return () => window.clearTimeout(id);
}
