/**
 * Static collider list for the scenery (original: function am).
 * Colliders are consumed by Car (./carCollision.js) and by the AI obstacle model (./aiDriver.js).
 */
import { houses, trees, fenceSegments } from "../world/houseLayout.js";
import { mainField } from "../world/layoutSelect.js";
import { towersFiltered } from "../world/roadDistance.js";

/** Sentinel collider height meaning "taller than any jump" (original const fo = 99). */
export const PROP_HEIGHT_INFINITE = 99;

export function buildStaticColliders() {
  const list = [];
  for (const house of houses) {
    if (house.kind === "carousel") {
      list.push({ type: "circle", x: house.x, z: house.y, r: house.w * 0.32, h: PROP_HEIGHT_INFINITE, prop: true });
      continue;
    }
    if (house.kind === "silo" || house.kind === "fountain") {
      list.push({ type: "circle", x: house.x, z: house.y, r: house.r + 0.2, h: PROP_HEIGHT_INFINITE, prop: true });
      continue;
    }
    // bigger safety margin for buildings than for the remaining prop kinds
    const margin = ["house", "mill", "post", "school", "barn"].includes(house.kind) ? 0.55 : 0.2;
    list.push({
      type: "obb",
      x: house.x,
      z: house.y, // layout y == world z
      a: -(house.rot || 0),
      hx: house.w / 2 + margin,
      hz: house.d / 2 + margin,
      h: PROP_HEIGHT_INFINITE,
      prop: true,
    });
  }
  // tree trunks
  for (const tree of trees) list.push({ type: "circle", x: tree.x, z: tree.y, r: tree.r * 0.28, h: PROP_HEIGHT_INFINITE, prop: true });
  // fence runs: low (2.4) thin boxes, jumpable
  for (const fence of fenceSegments) {
    const dx = fence.b[0] - fence.a[0];
    const dy = fence.b[1] - fence.a[1];
    const length = Math.hypot(dx, dy);
    list.push({
      type: "obb",
      x: (fence.a[0] + fence.b[0]) / 2,
      z: (fence.a[1] + fence.b[1]) / 2,
      a: Math.atan2(dy, dx),
      hx: length / 2 + 0.15,
      hz: 0.3,
      h: 2.4,
      prop: true,
    });
  }
  // the two gate posts at either side of the main field
  for (const side of [-1, 1]) {
    list.push({ type: "obb", x: mainField.x + side * (mainField.w / 2 + 1), z: mainField.y, a: 0, hx: 1.1, hz: 4.4, h: 3.6, prop: true });
  }
  for (const tower of towersFiltered) list.push({ type: "obb", x: tower.x, z: tower.z, a: 0, hx: 6.4, hz: 3.4, h: PROP_HEIGHT_INFINITE, prop: true });
  for (const c of list) c.reach = c.type === "circle" ? c.r : Math.hypot(c.hx, c.hz);
  return list;
}
