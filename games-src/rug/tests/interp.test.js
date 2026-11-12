import { describe, it, expect } from "vitest";
import { blendPose, renderAlpha, MAX_BLEND_DISTANCE } from "../src/logic/interp.js";

describe("render interpolation", () => {
  const prev = { x: 0, y: 0, z: 0, a: 0 };
  const cur = { x: 2, y: 1, z: -4, a: 1 };
  it("alpha is accumulator / step clamped to 0..1", () => {
    expect(renderAlpha(0.002, 0.004)).toBe(0.5);
    expect(renderAlpha(-1, 0.004)).toBe(0);
    expect(renderAlpha(1, 0.004)).toBe(1);
    expect(renderAlpha(1, 0)).toBe(1);
  });
  it("blends position linearly", () => {
    expect(blendPose(prev, cur, 0.5)).toEqual({ x: 1, y: 0.5, z: -2, a: 0.5 });
    expect(blendPose(prev, cur, 0)).toEqual(prev);
    expect(blendPose(prev, cur, 1)).toEqual(cur);
  });
  it("turns the short way round the circle", () => {
    const out = blendPose({ x: 0, y: 0, z: 0, a: Math.PI - 0.1 }, { x: 0, y: 0, z: 0, a: -Math.PI + 0.1 }, 0.5);
    expect(Math.abs(Math.abs(out.a) - Math.PI)).toBeLessThan(1e-9);
  });
  it("does not blend across a teleport or without a previous pose", () => {
    const far = { x: MAX_BLEND_DISTANCE + 1, y: 0, z: 0, a: 0 };
    expect(blendPose(prev, far, 0.5)).toEqual(far);
    expect(blendPose(undefined, cur, 0.5)).toEqual(cur);
  });
  it("returns a copy, never the live car", () => {
    expect(blendPose(prev, cur, 1)).not.toBe(cur);
  });
});
