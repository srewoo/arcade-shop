import { describe, expect, it } from "vitest";
import { applyStatRows, statRowsVisible } from "../src/ui/statRows.js";

const hudMock = () => {
  const rows = new Map();
  const make = (name) => {
    const set = new Set(["empty"]);
    const row = { classList: { contains: (c) => set.has(c), toggle: (c, on) => (on ? set.add(c) : set.delete(c)) } };
    rows.set(`.stat-${name}`, row);
    return row;
  };
  ["delta", "best", "last", "drift"].forEach(make);
  return { querySelector: (sel) => rows.get(sel), rows };
};

describe("statRowsVisible", () => {
  it("hides everything on a fresh run", () => {
    expect(statRowsVisible({ delta: null, best: null, last: null, drift: 0 })).toEqual({ delta: false, best: false, last: false, drift: false });
  });
  it("shows a row once it has data (a 0.0 delta counts)", () => {
    expect(statRowsVisible({ delta: 0, best: 31.2, last: null, drift: 120 })).toEqual({ delta: true, best: true, last: false, drift: true });
  });
});

describe("applyStatRows", () => {
  it("toggles the empty class to match", () => {
    const hud = hudMock();
    applyStatRows(hud, { delta: true, best: false, last: false, drift: true });
    expect(hud.rows.get(".stat-delta").classList.contains("empty")).toBe(false);
    expect(hud.rows.get(".stat-best").classList.contains("empty")).toBe(true);
    applyStatRows(hud, { delta: false, best: false, last: false, drift: true });
    expect(hud.rows.get(".stat-delta").classList.contains("empty")).toBe(true);
  });
});
