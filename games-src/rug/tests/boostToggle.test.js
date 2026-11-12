import { describe, it, expect } from "vitest";
import { boostActive } from "../src/logic/boostToggle.js";

describe("nitro input modes", () => {
  it("hold follows the key", () => {
    const s = { latched: true };
    expect(boostActive("hold", s, true, true)).toBe(true);
    expect(boostActive("hold", s, false, false)).toBe(false);
    expect(s.latched).toBe(false);
  });
  it("toggle latches on a fresh press and ignores holding", () => {
    const s = { latched: false };
    expect(boostActive("toggle", s, true, true)).toBe(true);
    expect(boostActive("toggle", s, true, false)).toBe(true); // still held, not a new press
    expect(boostActive("toggle", s, false, false)).toBe(true); // release does nothing
    expect(boostActive("toggle", s, true, true)).toBe(false); // second press turns it off
  });
  it("an empty meter releases the latch", () => {
    const s = { latched: true };
    expect(boostActive("toggle", s, false, false, false)).toBe(false);
    expect(s.latched).toBe(false);
  });
  it("an unknown mode behaves like hold", () => {
    expect(boostActive("weird", { latched: false }, true, true)).toBe(true);
  });
});
