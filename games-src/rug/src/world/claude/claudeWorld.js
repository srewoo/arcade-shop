// Grid City world scale and warp parameters.
import { MAP } from "../../config/maps.js";
import { RUG, ROAD_W, RING_R, ROUNDABOUTS } from "./claudeConfig.js";

/** World scale: design units -> world units. */
export const CLAUDE_SCALE = 1.2;
export const CLAUDE_X2 = 1.25; // RE: purpose unknown (no use inside this range)
export const CLAUDE_GD = 1.5; // RE: purpose unknown (no use inside this range)
/** Warp parameters {a (amplitude), f (frequency), p (phase), ...} for Claude-base maps; identity otherwise. */
export const claudeWarp = MAP.base === "claude" ? MAP.warp : { a: 0, f: 1, p: 0 };
/** Roundabout centres in world units. */
export const scaledRoundabouts = ROUNDABOUTS.map((r) => ({ x: r.x * CLAUDE_SCALE, y: r.y * CLAUDE_SCALE }));
export const CLAUDE_HALF_W = (RUG.W * CLAUDE_SCALE) / 2;
export const CLAUDE_HALF_H = (RUG.H * CLAUDE_SCALE) / 2;
export const CLAUDE_ROAD_W = ROAD_W;
export const CLAUDE_RING_R = RING_R * CLAUDE_SCALE;
