import { describe, it, expect } from "vitest";
import { fillGapRow } from "../src/ui/gapRow.js";

const makeRow = () => {
  const els = { b: { textContent: "--" }, span: { textContent: "" } };
  const classes = new Set();
  const vars = {};
  return {
    els, classes, vars,
    classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
    style: { setProperty: (k, v) => (vars[k] = v) },
    querySelector: (sel) => els[sel],
  };
};
const look = (car) => ({ name: car.name, color: car.color });

describe("gap rows", () => {
  it("fills text, name and colour for a neighbour", () => {
    const row = makeRow();
    fillGapRow(row, { name: "Black Pickup", color: "#222" }, "+4.3s", look);
    expect(row.els.b.textContent).toBe("+4.3s");
    expect(row.els.span.textContent).toBe("Black Pickup");
    expect(row.vars["--c"]).toBe("#222");
    expect(row.classes.has("off")).toBe(false);
  });
  it("clears the previous rival when the neighbour disappears (leader / last place)", () => {
    const row = makeRow();
    fillGapRow(row, { name: "Black Pickup", color: "#222" }, "-0.0s", look);
    fillGapRow(row, null, "", look);
    expect(row.els.span.textContent).toBe("");
    expect(row.els.b.textContent).toBe("--");
    expect(row.classes.has("off")).toBe(true);
  });
  it("shows the row again when a neighbour returns", () => {
    const row = makeRow();
    fillGapRow(row, null, "", look);
    fillGapRow(row, { name: "Van", color: "#eee" }, "+1.0s", look);
    expect(row.classes.has("off")).toBe(false);
    expect(row.els.span.textContent).toBe("Van");
  });
  it("falls back to white when a car has no colour", () => {
    const row = makeRow();
    fillGapRow(row, { name: "X" }, "+1.0s", look);
    expect(row.vars["--c"]).toBe("#fff");
  });
});
