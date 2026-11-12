import { markInk } from '../render/ball';
import { MARKER_GLYPH, colorHex, markerFor, type ColorId } from '../game/players';

/** Fill a ball badge: colour background plus the player's marker glyph (the non-colour cue). */
export function paintMark(el: HTMLElement, color: ColorId, seat: number): void {
  el.style.background = `radial-gradient(circle at 32% 28%, #fff 0, ${colorHex(color)} 42%, ${colorHex(color)} 100%)`;
  el.style.color = markInk(color);
  el.textContent = MARKER_GLYPH[markerFor(seat)];
}
