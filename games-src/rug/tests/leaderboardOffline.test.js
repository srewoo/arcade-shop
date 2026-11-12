import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchScores, hasScoreServer, resetScoreServerState, submitScore } from "../src/api/leaderboard.js";

afterEach(() => {
  vi.unstubAllGlobals();
  resetScoreServerState();
});

describe("leaderboard inside the arcadeShop extension", () => {
  it("reports offline without making a request", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(hasScoreServer()).toBe(false);
    expect(await fetchScores("rug:sol")).toEqual({ error: "offline" });
    expect(await submitScore("rug:sol", "Ann", 30000)).toEqual({ error: "offline" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still calls the server on the web", async () => {
    vi.stubGlobal("location", { protocol: "http:" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ top: [] }) })));
    expect(hasScoreServer()).toBe(true);
    expect(await fetchScores("rug:sol")).toEqual({ top: [] });
  });
});

describe("offline cooldown", () => {
  it("stops asking the server for a while after a failure", async () => {
    const { scoreServerDown, resetScoreServerState, RETRY_AFTER_MS } = await import("../src/api/leaderboard.js");
    resetScoreServerState();
    vi.stubGlobal("location", { protocol: "http:" });
    const fetchSpy = vi.fn(async () => {
      throw new Error("404");
    });
    vi.stubGlobal("fetch", fetchSpy);
    expect(scoreServerDown()).toBe(false);
    expect(await fetchScores("rug:sol")).toEqual({ error: "offline" });
    expect(scoreServerDown()).toBe(true);
    expect(await fetchScores("rug:sol")).toEqual({ error: "offline" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(scoreServerDown(Date.now() + RETRY_AFTER_MS + 1)).toBe(false);
    resetScoreServerState();
  });
});
