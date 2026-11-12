import { describe, it, expect } from "vitest";
import { createAudioEvents, AUDIO_EVENTS } from "../src/audio/audioEvents.js";

const stub = () => {
  const calls = [];
  const sfx = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) });
  return { sfx, calls };
};

describe("audio event table", () => {
  it("every event plays exactly one cue", () => {
    for (const name of Object.keys(AUDIO_EVENTS)) {
      const { sfx, calls } = stub();
      expect(createAudioEvents(sfx)(name, { good: true, tier: 2 })).toBe(true);
      expect(calls, name).toHaveLength(1);
    }
  });
  it("covers the events the report listed", () => {
    for (const name of ["lap", "split", "driftTier", "driftBank", "driftLost", "wrongWay", "nitroReady", "overtake", "newBest", "pad", "turbo"]) {
      expect(AUDIO_EVENTS).toHaveProperty(name);
    }
  });
  it("passes the payload through", () => {
    const { sfx, calls } = stub();
    const emit = createAudioEvents(sfx);
    emit("split", { good: false });
    emit("driftTier", { tier: 2 });
    emit("turbo", { tier: 1 });
    expect(calls).toEqual([["split", false], ["driftTier", 2], ["turbo", 1]]);
  });
  it("unknown events are ignored without a sound", () => {
    const { sfx, calls } = stub();
    expect(createAudioEvents(sfx)("explode")).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
