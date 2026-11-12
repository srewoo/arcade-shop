// Unique id prefixes for SVG gradients. Every sprite carries its own <defs> because a
// gradient defined inside a hidden (display:none) view does not resolve for other SVGs.
let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}${counter}`;
}
