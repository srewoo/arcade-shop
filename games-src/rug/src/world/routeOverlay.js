// Race-route overlay: a transparent canvas painted on top of the rug "print"
// (dashed lane line, chevrons, turn arrows, start/finish grid). The rug shader
// reveals it progressively along the track (see rugMaterial.js, uReveal).
import { RUG, STARTING_GRID } from "./layoutSelect.js";
import { COLORS } from "./mapPainter.js";
import { TRACK, turns, trackPointAt, wrapS } from "./trackSamples.js";
import { createCanvas, applyWorldTransform } from "./paint/canvasUtils.js";

/** Lateral offset (world units) of the painted route guide line from the centreline. */
export const ROUTE_DASH_LATERAL = 3.3;

const CREAM = "#f6f3ea";

/**
 * Paint the route overlay.
 * @param {number} width canvas width in px (4096 desktop / 2048 coarse pointer)
 * @returns {HTMLCanvasElement}
 */
export function paintRouteLayer(width = 2048) {
  const height = Math.round((width * RUG.H) / RUG.W);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  applyWorldTransform(ctx, width);
  const length = TRACK.length;
  const pose = {};
  const lat = ROUTE_DASH_LATERAL;
  const inTurn = (s) => turns.some((t) => s > t.s0 - 1 && s < t.s1 + 1);
  // RE: skip dashes in the approach zone before a turn (where the arrows go) and around start/finish
  const inArrowZone = (s) => turns.some((t) => s > t.s0 - 21 && s < t.s0 - 3) || s > length - 30 || s < 4;

  // 1. dashed guide line, two-pass stroke (edge colour then fill colour)
  ctx.lineCap = "round";
  for (let s = 0; s < length; s += 4.2) {
    if (inTurn(s + 1) || inArrowZone(s + 1)) continue;
    const a = trackPointAt(s, lat);
    const b = trackPointAt(s + 2.4, lat);
    ctx.strokeStyle = COLORS.routeEdge;
    ctx.lineWidth = 1.15;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = COLORS.route;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  // 2. chevron (">") at arclength s, lateral offset `offset`, size `size`
  const chevron = (s, offset, size, color) => {
    trackPointAt(s, offset, pose);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.a);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const stroke = () => {
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.62);
      ctx.lineTo(size * 0.35, 0);
      ctx.lineTo(-size * 0.35, size * 0.62);
      ctx.stroke();
    };
    ctx.strokeStyle = COLORS.routeEdge;
    ctx.lineWidth = size * 0.55;
    stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.32;
    stroke();
    ctx.restore();
  };
  for (const turn of turns) {
    for (let s = turn.s0 + 1.5; s < turn.s1 - 0.5; s += 3.4) chevron(s, lat, 1.6, COLORS.route);
  }

  // 3. turn-warning arrow (straight / curved left or right / roundabout loop)
  const turnArrow = (s, dir, roundabout) => {
    trackPointAt(s, lat, pose);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.a);
    const shaft = () => {
      ctx.beginPath();
      if (roundabout) {
        ctx.moveTo(-4.2, 0);
        ctx.lineTo(-0.6, 0);
        ctx.arc(1, dir > 0 ? -0.1 : 0.1, 1.6, Math.PI, dir === 0 ? 0 : dir > 0 ? Math.PI * 1.5 : Math.PI * 0.5, dir < 0);
      } else if (dir === 0) {
        ctx.moveTo(-4.2, 0);
        ctx.lineTo(2.2, 0);
      } else {
        ctx.moveTo(-4.2, 0);
        ctx.lineTo(-0.4, 0);
        ctx.quadraticCurveTo(1.6, 0, 1.6, dir > 0 ? -1.8 : 1.8);
      }
      ctx.stroke();
    };
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1.5;
    shaft();
    ctx.strokeStyle = COLORS.route;
    ctx.lineWidth = 0.9;
    shaft();
    // arrow head position + angle
    let hx, hy, ha;
    if (roundabout) {
      const p = dir === 0 ? 0 : dir > 0 ? Math.PI * 1.5 : Math.PI * 0.5;
      hx = 1 + Math.cos(p) * 1.6;
      hy = (dir > 0 ? -0.1 : 0.1) + Math.sin(p) * 1.6;
      ha = p + (dir < 0 ? -Math.PI / 2 : Math.PI / 2);
      if (dir === 0) ha = Math.PI / 2;
      if (dir === 0) { hx = 2.6; hy = 0; ha = 0; }
    } else if (dir === 0) {
      hx = 2.2; hy = 0; ha = 0;
    } else {
      hx = 1.6;
      hy = dir > 0 ? -1.9 : 1.9;
      ha = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ha);
    ctx.beginPath();
    ctx.moveTo(1.6, 0); ctx.lineTo(-0.6, -1.5); ctx.lineTo(-0.6, 1.5); ctx.closePath();
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1.05, 0); ctx.lineTo(-0.3, -0.95); ctx.lineTo(-0.3, 0.95); ctx.closePath();
    ctx.fillStyle = COLORS.route;
    ctx.fill();
    ctx.restore();
    ctx.restore();
  };
  turns.forEach((turn, i) => {
    const prev = turns[(i + turns.length - 1) % turns.length];
    const gap = wrapS(turn.s0 - prev.s1);
    if (gap > 22) turnArrow(turn.s0 - 16, turn.dir, turn.roundabout);
    if (gap > 10) turnArrow(turn.s0 - 7, turn.dir, turn.roundabout);
  });

  // 4. start/finish chequered strip (2 x 12 cells of 1 unit)
  {
    trackPointAt(0, 0, pose);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.a);
    const cell = 1;
    for (let col = 0; col < 2; col++) {
      for (let row = -6; row < 6; row++) {
        ctx.fillStyle = (col + row) % 2 === 0 ? "#2a2a2a" : CREAM;
        ctx.fillRect(-col * cell, row * cell + 0, cell, cell);
      }
    }
    ctx.restore();
    // 5. four numbered starting-grid boxes
    for (let i = 0; i < 4; i++) {
      const s = STARTING_GRID[i].s;
      const offset = STARTING_GRID[i].lat;
      trackPointAt(s, offset, pose);
      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.a);
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(3.4, -1.9); ctx.lineTo(-3.2, -1.9); ctx.lineTo(-3.2, 1.9); ctx.lineTo(3.4, 1.9);
      ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.font = '900 2px "Arial Rounded MT Bold", "Arial Black", Arial, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.rotate(Math.PI / 2);
      ctx.fillText(String(i + 1), 0, 1.6);
      ctx.restore();
      ctx.restore();
    }
  }
  return canvas;
}
