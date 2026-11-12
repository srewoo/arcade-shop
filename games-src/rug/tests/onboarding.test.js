import { describe, it, expect } from "vitest";
import { SEEN_KEY, tipsSeen, markTipsSeen, shouldShowTips } from "../src/logic/onboarding.js";

const memory = () => {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = String(v)) };
};
const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("full"); } };

describe("first-run tips", () => {
  it("shows once, then never again", () => {
    const store = memory();
    expect(shouldShowTips(store)).toBe(true);
    expect(markTipsSeen(store)).toBe(true);
    expect(store.getItem(SEEN_KEY)).toBe("1");
    expect(shouldShowTips(store)).toBe(false);
  });
  it("ignores other values of the flag", () => {
    const store = memory();
    store.setItem(SEEN_KEY, "yes");
    expect(tipsSeen(store)).toBe(false);
  });
  it("never throws when storage is blocked", () => {
    expect(tipsSeen(broken)).toBe(false);
    expect(markTipsSeen(broken)).toBe(false);
    expect(tipsSeen(null)).toBe(false);
    expect(shouldShowTips(undefined)).toBe(true);
  });
});
