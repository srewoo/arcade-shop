import { describe, it, expect } from "vitest";
import { wrapIndex } from "../src/ui/focusTrap.js";

describe("focus trap index maths", () => {
  it("wraps forwards and backwards", () => {
    expect(wrapIndex(0, 1, 4)).toBe(1);
    expect(wrapIndex(3, 1, 4)).toBe(0);
    expect(wrapIndex(0, -1, 4)).toBe(3);
  });
  it("starts at the first / last item when nothing is focused", () => {
    expect(wrapIndex(-1, 1, 3)).toBe(0);
    expect(wrapIndex(-1, -1, 3)).toBe(2);
  });
  it("handles an empty dialog", () => {
    expect(wrapIndex(0, 1, 0)).toBe(-1);
  });
});

import { pickReturnTarget, setDialogOpen } from "../src/ui/focusTrap.js";

const el = (over = {}) => ({ isConnected: true, focus() {}, ...over });
const body = el();

describe("focus return target", () => {
  it("prefers a usable opener", () => {
    const opener = el();
    expect(pickReturnTarget(opener, el(), body)).toBe(opener);
  });
  it("falls back when the opener is body, null or detached", () => {
    const fb = el();
    expect(pickReturnTarget(body, fb, body)).toBe(fb);
    expect(pickReturnTarget(null, fb, body)).toBe(fb);
    expect(pickReturnTarget(el({ isConnected: false }), fb, body)).toBe(fb);
  });
  it("returns null when nothing is usable", () => {
    expect(pickReturnTarget(null, null, body)).toBeNull();
  });
});

describe("setDialogOpen", () => {
  const fakePanel = () => {
    const classes = new Set();
    const panel = {
      dataset: {},
      listeners: [],
      focused: 0,
      classList: { contains: (c) => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
      addEventListener(type, fn) { this.listeners.push([type, fn]); },
      focus() { this.focused++; globalThis.document.activeElement = this; },
      blur() { globalThis.document.activeElement = body; },
      contains(node) { return node === this; },
    };
    return panel;
  };
  const withDocument = (fn) => {
    const prev = globalThis.document;
    globalThis.document = { body, activeElement: body };
    try { fn(); } finally { globalThis.document = prev; }
  };

  it("focuses the panel on open, wires the trap once, and returns focus to the opener on close", () => {
    withDocument(() => {
      const opener = el({ focus() { globalThis.document.activeElement = this; } });
      globalThis.document.activeElement = opener;
      const panel = fakePanel();
      const owner = {};
      setDialogOpen(owner, "op", panel, true);
      setDialogOpen(owner, "op", panel, true);
      expect(panel.tabIndex).toBe(-1);
      expect(panel.listeners).toHaveLength(1);
      expect(panel.focused).toBe(1);
      expect(owner.op).toBe(opener);
      setDialogOpen(owner, "op", panel, false);
      expect(globalThis.document.activeElement).toBe(opener);
      expect(owner.op).toBeNull();
    });
  });
  it("uses the fallback when opened from the keyboard shortcut (body focused)", () => {
    withDocument(() => {
      const fb = el({ focus() { globalThis.document.activeElement = this; } });
      const panel = fakePanel();
      setDialogOpen({}, "op", panel, true, () => fb);
      const owner = { op: body };
      setDialogOpen(owner, "op", panel, false, () => fb);
      expect(globalThis.document.activeElement).toBe(fb);
    });
  });
});
