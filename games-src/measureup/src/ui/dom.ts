// Tiny DOM helpers shared by the UI modules.

export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing from index.html`);
  return node as T;
}

export function qs<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`${selector} missing from index.html`);
  return node;
}

/** Run `fn` after `ms`; the returned function cancels it. */
export function later(fn: () => void, ms: number): () => void {
  const id = window.setTimeout(fn, ms);
  return () => window.clearTimeout(id);
}

export function elSvg(id: string): SVGSVGElement {
  const node = document.getElementById(id);
  if (!(node instanceof SVGSVGElement)) throw new Error(`#${id} is not an <svg> in index.html`);
  return node;
}
