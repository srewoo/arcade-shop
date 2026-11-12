// Scenery "kinds" that can be assigned to a layout zone (see generateRandomLayout).

/**
 * @param c helper context from generateRandomLayout:
 *  layout (output lists), addBuilding(kind,x,z,props,margin), fillWithHouses(zone,margin), addPond(x,z,rx,rz,island),
 *  addPath(x,z,fn), addEllipsePath(x,z,rx,rz,t0,t1), randomPalette(), palettes (HOUSE_PALETTES)
 * @returns map kind -> (zone) => void ; zone = {x0,z0,x1,z1,w,d,cx,cz}
 */
export function createZoneKinds(c) {
  const { layout, addBuilding, fillWithHouses, addPond, addPath, addEllipsePath, randomPalette, palettes } = c;
  return {
    town(z) {
      fillWithHouses(z, 3.5);
      layout.fences.push({ x1: z.x0 + 3, z1: z.z1 - 1.5, x2: z.x1 - 3, z2: z.z1 - 1.5 });
    },
    football(z) {
      const w = Math.min(62, z.w - 8);
      const d = Math.min(37, z.d - 15);
      const cz = z.cz + 5;
      layout.fields.push({ x: z.cx, z: cz, w, d });
      addBuilding("stand", z.cx, cz - d / 2 - 4.5, { w: Math.min(44, w - 6), d: 5, h: 4 });
      layout.fences.push({ x1: z.cx - w / 2 - 3, z1: cz + d / 2 + 3, x2: z.cx + w / 2 + 3, z2: cz + d / 2 + 3 });
    },
    lake(z) {
      const rx = Math.min(25, z.w * 0.36);
      const rz = Math.min(17, z.d * 0.33);
      addPond(z.cx, z.cz, rx, rz);
      layout.ducks.push({ x: z.cx - rx * 0.4, z: z.cz - rz * 0.2 }, { x: z.cx + rx * 0.1, z: z.cz - rz * 0.5 });
      addEllipsePath(z.cx, z.cz, rx + 5, rz + 5);
    },
    lakeCastle(z) {
      addPond(z.cx, z.cz, Math.min(25, z.w * 0.42), Math.min(19, z.d * 0.42), true);
      const pond = layout.ponds[layout.ponds.length - 1];
      pond.rx = Math.max(pond.rx, 19);
      pond.rz = Math.max(pond.rz, 15);
      addBuilding("castle", z.cx, z.cz, { w: 15, d: 13, h: 23, wall: "#d6a888", roof: "#d8402f" });
    },
    shops(z) {
      const pal = randomPalette();
      addBuilding("shop", z.cx, z.z0 + 9, {
        w: Math.min(36, z.w - 8),
        d: 12,
        h: 9,
        wall: pal.wall,
        roof: pal.roof,
        accent: "#d8402f",
      });
      layout.parking.push({ x: z.cx, z: z.z1 - 13, w: Math.min(50, z.w - 8), d: Math.min(22, z.d - 30) });
      layout.fences.push({ x1: z.x0 + 2, z1: z.z1 - 1, x2: z.x1 - 2, z2: z.z1 - 1 });
    },
    farm(z) {
      layout.farm.push({ x: z.x0 + z.w * 0.28, y: z.z0 + z.d * 0.3, w: z.w * 0.42, h: z.d * 0.42, type: "wheat" });
      layout.farm.push({ x: z.x0 + z.w * 0.72, y: z.z0 + z.d * 0.3, w: z.w * 0.4, h: z.d * 0.42, type: "cabbage" });
      const pal = palettes[0];
      addBuilding("mill", z.x0 + z.w * 0.25, z.z1 - 10, {
        w: 15, d: 12, h: 8.4, roofH: 5.6, chimney: true, wall: pal.wall, roof: pal.roof,
      });
      addBuilding("barn", z.x0 + z.w * 0.62, z.z1 - 10, {
        w: 15, d: 10, h: 7.5, roofH: 6, art: 1.25, wall: "#c23b2b", roof: "#6b4a3a",
      });
      addBuilding("silo", z.x1 - 9, z.z1 - 11, { r: 3.5, h: 13.5, wall: "#c9ccd1", roof: "#7b8590" });
    },
    fair(z) {
      addBuilding("carousel", z.cx, z.cz, { w: 19, d: 19, r: 9.5, h: 15 });
      addEllipsePath(z.cx, z.cz, 14, 14, 0, 1);
      addPath(z.cx, z.cz, (t) => [0, 14 + t * (z.z1 - z.cz - 16)]);
    },
    civic(z) {
      addBuilding("hospital", z.x0 + 17, z.z0 + 10, {
        w: 28, d: 15, h: 9.5, art: 1, wall: "#f7f5ef", roof: "#dfe2e6",
      });
      addBuilding("school", z.x1 - 15, z.z0 + 9, {
        w: 24, d: 11, h: 9.5, roofH: 4.5, art: 1.2, wall: "#f2c84b", roof: "#c23b2b",
      });
      addBuilding("gas", z.x0 + 12, z.z1 - 9, { w: 17, d: 9, h: 7, art: 1, roof: "#f3f3f0", accent: "#e8452f" });
      addBuilding("fire", z.cx + 2, z.z1 - 9, { w: 13, d: 11, h: 9, art: 1.2, wall: "#d8452f", roof: "#a9aeb6" });
      addBuilding("police", z.x1 - 10, z.z1 - 9, {
        w: 13, d: 11, h: 9, art: 1.2, wall: "#f7f5ef", roof: "#e9eef3",
      });
    },
    park(z) {
      addPond(z.cx + z.w * 0.18, z.cz - z.d * 0.12, Math.min(13, z.w * 0.2), Math.min(9, z.d * 0.2));
      addPath(z.cx, z.cz, (t) => [(t - 0.5) * (z.w - 8), z.d * 0.22 * Math.sin(t * Math.PI * 2)]);
    },
  };
}
