// Grid City road network: every road is {pts, dashed}. Dashed = centre line markings.
import { Turtle } from "./Turtle.js";
import { CR, FILLET_DIST, FILLET_R, ALPHA, RING_R, ROUNDABOUTS } from "./claudeConfig.js";
import { TRACK } from "./claudeTrack.js";

/** Straight line sampled every `step` units (endpoints inclusive). */
export function segmentSamples(a, b, step = 1) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  return out;
}

/** Outer rectangular road loop. */
function outerLoopPoints() {
  const t = new Turtle(-90 + CR, 52, 0, 1);
  t.to(80 - CR, 52)
    .turn(CR, 90)
    .to(80, -50 + CR)
    .turn(CR, 90)
    .to(-90 + CR, -50)
    .turn(CR, 90)
    .to(-90, 52 - CR)
    .turn(CR, 90);
  t.pts.push([-90 + CR, 52]);
  return t.pts;
}

/** Two curved arms leaving a roundabout at `degrees` (one bending each way). */
function roundaboutArms(roundabout, degrees) {
  const angle = (degrees * Math.PI) / 180;
  const x = roundabout.x + Math.cos(angle) * FILLET_DIST;
  const y = roundabout.y + Math.sin(angle) * FILLET_DIST;
  const heading = angle + Math.PI;
  const armA = new Turtle(x, y, heading, 1).turn(FILLET_R, -ALPHA).turn(RING_R, 20).pts;
  const armB = new Turtle(x, y, heading, 1).turn(FILLET_R, ALPHA).turn(RING_R, -20).pts;
  return [armA, armB];
}

/** Fillet arc between two perpendicular junction legs (16 segments). */
function cornerArc(x, y, legA, legB, radius = CR) {
  const cx = x + (legA[0] + legB[0]) * radius;
  const cy = y + (legA[1] + legB[1]) * radius;
  const startAngle = Math.atan2(y + legA[1] * radius - cy, x + legA[0] * radius - cx);
  let sweep = Math.atan2(y + legB[1] * radius - cy, x + legB[0] * radius - cx) - startAngle;
  while (sweep > Math.PI) sweep -= Math.PI * 2;
  while (sweep < -Math.PI) sweep += Math.PI * 2;
  const out = [];
  for (let i = 0; i <= 16; i++) {
    const a = startAngle + (sweep * i) / 16;
    out.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return out;
}

const DIR_E = [1, 0];
const DIR_W = [-1, 0];
const DIR_N = [0, -1];
const DIR_S = [0, 1];

/** T-junctions: position and leg directions (legs that are perpendicular get a corner arc). */
export const JUNCTIONS = [
  { x: -10, y: -50, legs: [DIR_W, DIR_E, DIR_S] },
  { x: -90, y: 0, legs: [DIR_N, DIR_S, DIR_E] },
  { x: -40, y: 52, legs: [DIR_W, DIR_E, DIR_S] },
  { x: 40, y: -50, legs: [DIR_W, DIR_E, DIR_N] },
];

/** Road along a->b with a sinusoidal wiggle (amp, period) blended in between start/end distances s..r by smoothstep. */
function wigglyRoad(a, b, amplitude, period, start, end) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / length;
  const dy = (b[1] - a[1]) / length;
  const out = [];
  for (let u = 0; u <= length + 0.01; u += 1) {
    const f = Math.max(0, Math.min(1, (u - start) / (end - start)));
    const wiggle = Math.sin(((u - start) / period) * Math.PI * 2) * amplitude * f * f * (3 - 2 * f);
    out.push([a[0] + dx * u - dy * wiggle, a[1] + dy * u + dx * wiggle]);
  }
  return out;
}

function buildRoads() {
  const roads = [];
  roads.push({ pts: outerLoopPoints(), dashed: true });
  roads.push({ pts: segmentSamples([-90, 0], [80, 0]), dashed: true });
  roads.push({ pts: segmentSamples([-10, -50], [-10, 28]), dashed: true });
  roads.push({ pts: segmentSamples([80, 0], [128, 0]), dashed: true });
  roads.push({ pts: wigglyRoad([-40, 52], [-40, 90], 3.5, 28, 9, 20), dashed: true });
  roads.push({ pts: segmentSamples([40, -50], [40, -88]), dashed: true });
  roads.push({ pts: TRACK.pts.concat([TRACK.pts[0]]), dashed: false });
  for (const roundabout of ROUNDABOUTS)
    for (const degrees of [0, 90, 180, 270]) for (const arm of roundaboutArms(roundabout, degrees)) roads.push({ pts: arm, dashed: false });
  const perpendicular = (a, b) => Math.abs(a[0] * b[0] + a[1] * b[1]) < 0.01;
  for (const j of JUNCTIONS)
    for (let i = 0; i < j.legs.length; i++)
      for (let k = i + 1; k < j.legs.length; k++)
        if (perpendicular(j.legs[i], j.legs[k])) roads.push({ pts: cornerArc(j.x, j.y, j.legs[i], j.legs[k]), dashed: false });
  return roads;
}

export const ROADS = buildRoads();
// RE: original evaluates a no-op array of junction/roundabout circles here ({r:10} / {r:23}); it is discarded, so omitted.
