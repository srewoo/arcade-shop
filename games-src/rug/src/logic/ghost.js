// Ghost replay data: fixed-rate recording, compact (delta + varint + base64) encoding, validation and
// interpolated playback. Pure (no three, no DOM).
//
// In memory a ghost is { hz, ms, n, q } where q is an Int32Array of n*4 quantised values
// [x, z, yaw, y] per sample.  Encoded form: JSON {v,hz,ms,n,d} with d = base64 of zig-zag varint deltas.

export const GHOST_VERSION = 1;
export const GHOST_HZ = 20;
export const MAX_SAMPLES = 7200; // 6 minutes at 20 Hz
export const MAX_ENCODED_CHARS = 60000; // hard cap on one stored ghost string
const MAX_MS = 10 * 60 * 1000;
const POS_Q = 10; // 0.1 world-unit resolution
const YAW_STEPS = 1024; // yaw resolution (2*pi / 1024)
const Y_Q = 10;
const MAX_ABS_POS = 400 * POS_Q; // rugs are < 300 units across
const MIN_Y = -5 * Y_Q;
const MAX_Y = 100 * Y_Q;
const TAU = Math.PI * 2;

const quantYaw = (a) => Math.round((((a % TAU) + TAU) % TAU) / TAU * YAW_STEPS) % YAW_STEPS;
const wrapYawDelta = (d) => ((((d + YAW_STEPS / 2) % YAW_STEPS) + YAW_STEPS) % YAW_STEPS) - YAW_STEPS / 2;

/** Quantise a pose {x,z,a,y} into the 4 stored integers. */
export function quantizePose(pose) {
  return [Math.round(pose.x * POS_Q), Math.round(pose.z * POS_Q), quantYaw(pose.a), Math.round((pose.y || 0) * Y_Q)];
}

/** Records a pose every 1/hz seconds of race time (sample k is taken at the first call with t >= k/hz). */
export class GhostRecorder {
  constructor(hz = GHOST_HZ) {
    this.hz = hz;
    this.values = [];
    this.n = 0;
    this.overflow = false;
  }

  /** Call every physics step with the race clock `t` and the player pose. */
  update(t, pose) {
    while (!this.overflow && t >= this.n / this.hz) {
      if (this.n >= MAX_SAMPLES) {
        this.overflow = true;
        return;
      }
      this.values.push(...quantizePose(pose));
      this.n++;
    }
  }

  /** Add the exact finishing pose (if it adds anything) and return the ghost, or null if unusable. */
  finish(pose, seconds) {
    if (this.overflow) return null;
    if (this.n < MAX_SAMPLES && seconds * this.hz > this.n - 1) {
      this.values.push(...quantizePose(pose));
      this.n++;
    }
    const ms = Math.round(seconds * 1000);
    if (this.n < 2 || ms <= 0 || ms > MAX_MS) return null;
    return { hz: this.hz, ms, n: this.n, q: Int32Array.from(this.values) };
  }
}

const zigzag = (v) => (v < 0 ? -v * 2 - 1 : v * 2);
const unzigzag = (u) => (u % 2 ? -(u + 1) / 2 : u / 2);

function writeVarint(bytes, value) {
  let u = zigzag(value);
  while (u >= 128) {
    bytes.push((u % 128) | 128);
    u = Math.floor(u / 128);
  }
  bytes.push(u);
}

function toBase64(bytes) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}

/** Serialise a ghost; returns null when it exceeds the sample or size bounds. */
export function serializeGhost(ghost) {
  if (!ghost || ghost.n < 2 || ghost.n > MAX_SAMPLES) return null;
  const bytes = [];
  const prev = [0, 0, 0, 0];
  for (let i = 0; i < ghost.n; i++) {
    for (let c = 0; c < 4; c++) {
      const cur = ghost.q[i * 4 + c];
      writeVarint(bytes, c === 2 ? wrapYawDelta(cur - prev[c]) : cur - prev[c]);
      prev[c] = cur;
    }
  }
  const d = toBase64(Uint8Array.from(bytes));
  const text = JSON.stringify({ v: GHOST_VERSION, hz: ghost.hz, ms: ghost.ms, n: ghost.n, d });
  return text.length > MAX_ENCODED_CHARS ? null : text;
}

function readVarints(bytes, count) {
  const out = new Array(count);
  let pos = 0;
  for (let i = 0; i < count; i++) {
    let u = 0;
    let mul = 1;
    for (let b = 0; ; b++) {
      if (pos >= bytes.length || b > 5) return null;
      const byte = bytes[pos++];
      u += (byte & 127) * mul;
      if (byte < 128) break;
      mul *= 128;
    }
    out[i] = unzigzag(u);
  }
  return pos === bytes.length ? out : null;
}

/** Parse and validate a stored ghost string; null for anything malformed or out of range. */
export function parseGhost(text) {
  try {
    if (typeof text !== "string" || text.length > MAX_ENCODED_CHARS) return null;
    const o = JSON.parse(text);
    if (!o || o.v !== GHOST_VERSION || !Number.isInteger(o.hz) || o.hz < 5 || o.hz > 60) return null;
    if (!Number.isInteger(o.n) || o.n < 2 || o.n > MAX_SAMPLES) return null;
    if (!Number.isInteger(o.ms) || o.ms <= 0 || o.ms > MAX_MS) return null;
    if (typeof o.d !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(o.d)) return null;
    const raw = atob(o.d);
    const bytes = Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
    const deltas = readVarints(bytes, o.n * 4);
    if (!deltas) return null;
    const q = new Int32Array(o.n * 4);
    const prev = [0, 0, 0, 0];
    for (let i = 0; i < o.n; i++) {
      for (let c = 0; c < 4; c++) {
        const v = c === 2 ? (((prev[c] + deltas[i * 4 + c]) % YAW_STEPS) + YAW_STEPS) % YAW_STEPS : prev[c] + deltas[i * 4 + c];
        prev[c] = v;
        q[i * 4 + c] = v;
      }
      const x = q[i * 4];
      const z = q[i * 4 + 1];
      const y = q[i * 4 + 3];
      if (Math.abs(x) > MAX_ABS_POS || Math.abs(z) > MAX_ABS_POS || y < MIN_Y || y > MAX_Y) return null;
    }
    return { hz: o.hz, ms: o.ms, n: o.n, q };
  } catch {
    return null;
  }
}

/** Seconds covered by the recorded samples. */
export const ghostDuration = (ghost) => (ghost.n - 1) / ghost.hz;

/** Interpolated pose at race time t (clamped to the first/last sample); written into `out`. */
export function ghostPoseAt(ghost, t, out = {}) {
  const f = Math.max(0, Math.min(ghost.n - 1, t * ghost.hz));
  const i = Math.min(ghost.n - 2, Math.floor(f));
  const k = f - i;
  const q = ghost.q;
  const a = i * 4;
  const b = a + 4;
  out.x = (q[a] + (q[b] - q[a]) * k) / POS_Q;
  out.z = (q[a + 1] + (q[b + 1] - q[a + 1]) * k) / POS_Q;
  out.y = (q[a + 3] + (q[b + 3] - q[a + 3]) * k) / Y_Q;
  out.a = ((q[a + 2] + wrapYawDelta(q[b + 2] - q[a + 2]) * k) / YAW_STEPS) * TAU;
  return out;
}
