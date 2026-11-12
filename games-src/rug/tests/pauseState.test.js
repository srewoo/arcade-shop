import { describe, it, expect } from "vitest";
import {
  createPauseState, openPause, askConfirm, cancelConfirm, back, resume, shouldAutoPause, isSimFrozen, canPause,
} from "../src/logic/pauseState.js";

describe("pause state", () => {
  it("only intro and race can be paused", () => {
    for (const mode of ["intro", "race"]) expect(canPause(mode)).toBe(true);
    for (const mode of ["title", "garage", "maps", "results", "grab", "outro", "demo"]) {
      expect(openPause(createPauseState(), mode)).toEqual(createPauseState());
    }
  });
  it("opens on the menu view and does not reopen", () => {
    const open = openPause(createPauseState(), "race", "key");
    expect(open).toMatchObject({ open: true, view: "menu", confirm: null, reason: "key" });
    expect(openPause(open, "race", "auto")).toBe(open);
  });
  it("restart and quit need a confirmation; cancel returns to the menu", () => {
    let s = openPause(createPauseState(), "race");
    s = askConfirm(s, "quit");
    expect(s).toMatchObject({ view: "confirm", confirm: "quit" });
    s = cancelConfirm(s);
    expect(s).toMatchObject({ open: true, view: "menu", confirm: null });
    expect(askConfirm(s, "format-disk")).toBe(s);
  });
  it("a closed overlay ignores confirm requests", () => {
    const closed = createPauseState();
    expect(askConfirm(closed, "restart")).toBe(closed);
    expect(cancelConfirm(closed)).toBe(closed);
    expect(back(closed)).toBe(closed);
  });
  it("Esc steps back from a confirmation, then resumes", () => {
    let s = askConfirm(openPause(createPauseState(), "race"), "restart");
    s = back(s);
    expect(s).toMatchObject({ open: true, view: "menu" });
    expect(back(s).open).toBe(false);
  });
  it("resume always closes", () => {
    expect(resume().open).toBe(false);
  });
  it("auto-pause needs a hidden window during active play and an overlay that is not already open", () => {
    const closed = createPauseState();
    expect(shouldAutoPause("race", closed, true)).toBe(true);
    expect(shouldAutoPause("intro", closed, true)).toBe(true);
    expect(shouldAutoPause("title", closed, true)).toBe(false);
    expect(shouldAutoPause("results", closed, true)).toBe(false);
    expect(shouldAutoPause("race", closed, false)).toBe(false);
    expect(shouldAutoPause("race", openPause(closed, "race"), true)).toBe(false);
  });
  it("the sim is frozen by pause, settings or the tips card", () => {
    const closed = createPauseState();
    expect(isSimFrozen(closed, false, false)).toBe(false);
    expect(isSimFrozen(openPause(closed, "race"), false, false)).toBe(true);
    expect(isSimFrozen(closed, true, false)).toBe(true);
    expect(isSimFrozen(closed, false, true)).toBe(true);
  });
});
