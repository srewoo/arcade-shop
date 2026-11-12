import { describe, it, expect } from "vitest";
import {
  GhostRecorder, serializeGhost, parseGhost, ghostPoseAt, ghostDuration, GHOST_HZ, MAX_SAMPLES, MAX_ENCODED_CHARS,
} from "../src/logic/ghost.js";

/** A plausible lap: circle of radius 60, 37 u/s. */
function record(seconds, hz = GHOST_HZ, step = 1 / 240) {
  const rec = new GhostRecorder(hz);
  let pose;
  for (let t = 0; t <= seconds + 1e-9; t += step) {
    const a = (t * 37) / 60;
    pose = { x: Math.cos(a) * 60, z: Math.sin(a) * 60, a: a + Math.PI / 2 - 7, y: t % 3 < 0.2 ? 2 : 0 };
    rec.update(t, pose);
  }
  return rec.finish(pose, seconds);
}

describe("GhostRecorder", () => {
  it("samples at a fixed rate", () => {
    const g = record(10);
    expect(g.hz).toBe(20);
    expect(g.n).toBeGreaterThanOrEqual(200);
    expect(g.n).toBeLessThanOrEqual(202);
    expect(g.ms).toBe(10000);
    expect(ghostDuration(g)).toBeCloseTo((g.n - 1) / 20);
  });
  it("returns null when the run is too short or overflows the sample bound", () => {
    const rec = new GhostRecorder();
    expect(rec.finish({ x: 0, z: 0, a: 0, y: 0 }, 0)).toBeNull();
    const big = new GhostRecorder(20);
    for (let i = 0; i < MAX_SAMPLES + 50; i++) big.update(i / 20, { x: 0, z: 0, a: 0, y: 0 });
    expect(big.overflow).toBe(true);
    expect(big.finish({ x: 0, z: 0, a: 0, y: 0 }, 400)).toBeNull();
  });
});

describe("serialize / parse", () => {
  it("round-trips exactly", () => {
    const g = record(30);
    const text = serializeGhost(g);
    const back = parseGhost(text);
    expect(back).not.toBeNull();
    expect(back.n).toBe(g.n);
    expect(back.ms).toBe(g.ms);
    expect(Array.from(back.q)).toEqual(Array.from(g.q));
  });
  it("is compact: a 5-lap (about 3 minute) run stays well under the cap", () => {
    const text = serializeGhost(record(180));
    expect(text.length).toBeLessThan(MAX_ENCODED_CHARS * 0.6);
    expect(text.length / (180 * 20)).toBeLessThan(10); // chars per sample
  });
  it("refuses to serialise over-long ghosts", () => {
    const n = MAX_SAMPLES + 1;
    expect(serializeGhost({ hz: 20, ms: 1000, n, q: new Int32Array(n * 4) })).toBeNull();
    // noisy data that cannot fit the character cap
    const m = MAX_SAMPLES;
    const q = new Int32Array(m * 4);
    let seed = 1;
    for (let i = 0; i < q.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      q[i] = (seed % 3000) - 1500;
      if (i % 4 === 2) q[i] = Math.abs(q[i]) % 1024;
      if (i % 4 === 3) q[i] = Math.abs(q[i]) % 500;
    }
    expect(serializeGhost({ hz: 20, ms: 360000, n: m, q })).toBeNull();
  });
  it("handles yaw wrap-around", () => {
    const rec = new GhostRecorder(20);
    for (let i = 0; i < 40; i++) rec.update(i / 20, { x: i, z: 0, a: (i % 2 ? -3.1 : 3.1), y: 0 });
    const g = rec.finish({ x: 40, z: 0, a: 3.1, y: 0 }, 2);
    expect(Array.from(parseGhost(serializeGhost(g)).q)).toEqual(Array.from(g.q));
  });
});

describe("parseGhost validation", () => {
  const good = () => JSON.parse(serializeGhost(record(5)));
  const enc = (o) => JSON.stringify(o);
  it("rejects garbage", () => {
    for (const bad of [null, undefined, 5, "", "{", "null", "[]", enc({}), "x".repeat(MAX_ENCODED_CHARS + 1)]) {
      expect(parseGhost(bad)).toBeNull();
    }
  });
  it("rejects bad headers", () => {
    expect(parseGhost(enc({ ...good(), v: 2 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), hz: 1000 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), hz: 20.5 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), n: 1 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), n: MAX_SAMPLES + 1 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), ms: -5 }))).toBeNull();
    expect(parseGhost(enc({ ...good(), ms: "100" }))).toBeNull();
  });
  it("rejects a sample count that does not match the payload", () => {
    const g = good();
    expect(parseGhost(enc({ ...g, n: g.n + 1 }))).toBeNull();
    expect(parseGhost(enc({ ...g, n: g.n - 1 }))).toBeNull();
  });
  it("rejects non-base64 payloads and out-of-range positions", () => {
    expect(parseGhost(enc({ ...good(), d: "!!!not base64!!!" }))).toBeNull();
    // one sample jumping 5000 world units
    const far = { hz: 20, ms: 1000, n: 2, q: Int32Array.from([0, 0, 0, 0, 50000, 0, 0, 0]) };
    expect(parseGhost(serializeGhost(far))).toBeNull();
  });
});

describe("ghostPoseAt", () => {
  const g = parseGhost(serializeGhost(record(10)));
  it("clamps to the first and last sample", () => {
    const first = ghostPoseAt(g, -1);
    const start = ghostPoseAt(g, 0);
    expect(first).toEqual(start);
    const last = ghostPoseAt(g, 999);
    const end = ghostPoseAt(g, ghostDuration(g));
    expect(last.x).toBeCloseTo(end.x);
  });
  it("interpolates between samples and follows the recorded path", () => {
    const t = 3.37;
    const pose = ghostPoseAt(g, t);
    const a = (t * 37) / 60;
    expect(pose.x).toBeCloseTo(Math.cos(a) * 60, 0);
    expect(pose.z).toBeCloseTo(Math.sin(a) * 60, 0);
  });
  it("interpolates yaw the short way around", () => {
    const rec = new GhostRecorder(20);
    rec.update(0, { x: 0, z: 0, a: 3.0, y: 0 });
    rec.update(0.05, { x: 1, z: 0, a: -3.0, y: 0 });
    const ghost = rec.finish({ x: 1, z: 0, a: -3.0, y: 0 }, 0.05);
    const mid = ghostPoseAt(ghost, 0.025);
    const wrapped = ((mid.a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    expect(Math.abs(wrapped - Math.PI)).toBeLessThan(0.2); // passes through pi, not through 0
  });
});
