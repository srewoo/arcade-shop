// All artwork is drawn in code: lily pads, frogs, toads and the pond scene.
import type { Team } from '../board';
import { padSvg } from './padArt';
import { pieceSvg } from './pieceArt';
import { sceneSvg } from './sceneArt';

export { padSvg, pieceSvg, sceneSvg };

const SVG = 'http://www.w3.org/2000/svg';

/** Menu hero: a short crossing with two frogs, a gap and two toads, drawn from the same art as the game. */
export function heroHtml(): string {
  const cells: Array<Team | null> = ['A', 'A', null, 'B', 'B'];
  return cells.map((t, i) => `<span class="hero-cell">${padSvg(i * 5 + 1)}${t ? `<span class="hero-piece" data-team="${t}" style="--face:${t === 'A' ? 1 : -1}">${pieceSvg(t)}</span>` : ''}</span>`).join('');
}

/** Parse a standalone <svg> string into an SVG element. */
export function svgNode(markup: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup.replace('<svg ', `<svg xmlns="${SVG}" `), 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
}
