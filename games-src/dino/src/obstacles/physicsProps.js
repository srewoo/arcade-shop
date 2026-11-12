// Describe nearby obstacles as ragdoll-world props: static cactus colliders and the one obstacle we hit
// (`hitObstacle`) as a dynamic body that gets knocked around.
import * as THREE from 'three';
import { WEED_RADIUS } from '../config.js';
import { rand } from '../util.js';
import { PTERO_COLLIDER } from './ptero.js';

const PHYSICS_RANGE = 90; // only obstacles within this z distance become physics props on crash

/**
 * Describe nearby obstacles as ragdoll-world props: static cactus colliders and the one obstacle
 * we hit (`hitObstacle`) as a dynamic body that gets knocked around.
 */
export function buildPhysicsProps(list, hitObstacle, playerZ) {
  const props = [];
  const wp = new THREE.Vector3();
  for (const o of list) {
    if (Math.abs(o.z - playerZ) > PHYSICS_RANGE) continue;
    if (o.kind === 'cactus') {
      for (const item of o.items) {
        item.mesh.getWorldPosition(wp);
        const s = item.scale;
        props.push({
          dynamic: false,
          pos: wp.clone(),
          friction: 0.6,
          shapes: item.variant.shapes.map((sh) => ({ box: sh.box.map((v) => v * s), at: sh.at.map((v) => v * s) })),
        });
      }
    } else if (o.impl?.staticProps?.(o)) {
      props.push(...o.impl.staticProps(o));
    } else if (o === hitObstacle) {
      o.ragdolled = true;
      const r = () => rand(-3, 3);
      props.push(
        o.impl?.dynamicProp
          ? o.impl.dynamicProp(o)
          : o.kind === 'ptero'
          ? {
              dynamic: true, object3d: o.group, pos: o.group.position.clone(), quat: o.group.quaternion.clone(),
              linvel: { x: 0, y: 0, z: o.vz }, angvel: { x: r(), y: r(), z: r() },
              density: 0.9, restitution: 0.3, shapes: PTERO_COLLIDER,
            }
          : {
              dynamic: true, object3d: o.group, pos: o.group.position.clone(), quat: o.group.quaternion.clone(),
              linvel: { x: rand(-1, 1), y: 2, z: o.vz }, angvel: { x: o.vz / WEED_RADIUS, y: 0, z: 0 },
              density: 0.35, restitution: 0.65, shapes: [{ ball: WEED_RADIUS }],
            },
      );
    }
  }
  return props;
}
