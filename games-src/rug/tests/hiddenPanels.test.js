import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = (name) => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
const block = (source, selector) => source.match(new RegExp(`(?:^|\\n)${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`))?.[1] ?? "";

describe("hidden panels are not focusable", () => {
  it("the results card is visibility:hidden until shown", () => {
    const source = css("results.css");
    expect(block(source, ".results")).toMatch(/visibility:\s*hidden/);
    expect(block(source, ".results.show")).toMatch(/visibility:\s*visible/);
  });
  it("other dialogs already hide with visibility", () => {
    expect(block(css("panels.css"), ".maps")).toMatch(/visibility:\s*hidden/);
    expect(block(css("panels.css"), ".garage")).toMatch(/visibility:\s*hidden/);
    expect(block(css("overlays.css"), ".tips")).toMatch(/visibility:\s*hidden/);
  });
});

describe("title button sway", () => {
  it("pauses while hovered or focused so the click target holds still", () => {
    expect(css("title.css")).toMatch(/\.key-btn:hover,\s*\.key-btn:focus-visible\s*\{\s*animation-play-state:\s*paused/);
  });
});
