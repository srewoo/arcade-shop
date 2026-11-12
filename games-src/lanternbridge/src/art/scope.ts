// Inline SVG gradients break when the first definition lives inside a hidden (display:none) view,
// so every markup string gets its own id suffix.
let counter = 0;

/** Rename every `id="lbXxx"` (and its url(#…) / href="#…" references) to a unique one. */
export function scopeIds(markup: string): string {
  const suffix = `_${++counter}`;
  const ids = [...markup.matchAll(/id="(lb\w+)"/g)].map((m) => m[1] as string);
  let out = markup;
  for (const id of new Set(ids)) out = out.replaceAll(`"${id}"`, `"${id}${suffix}"`).replaceAll(`#${id})`, `#${id}${suffix})`).replaceAll(`"#${id}"`, `"#${id}${suffix}"`);
  return out;
}
