// Falling meteor with a ground warning marker.  Timing is derived from time-to-arrival (see meteorMath.js): the
// marker shows ~3 s ahead, the rock streaks down and lands >= 1.3 s before the player arrives, then it is a
// smouldering rock to jump over.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { rand } from '../util.js';
import { bake, mergeAndShade, jitter } from '../gfx/geometry.js';
import { timeToArrival, meteorPhase } from './meteorMath.js';

const ROCK_R = 0.85;
const LAVA = 0xff7a28;
const CHAR = 0x3a2e2a;

// Shared (not per-meteor) materials so the warning pulse is animated once per frame.
const MARKER_MAT = new THREE.MeshBasicMaterial({ color: 0xff3b2e, transparent: true, opacity: 0.5, depthWrite: false, fog: false });
const FLAME_MAT = new THREE.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.85, depthWrite: false });

function buildRock() {
  const parts = [bake(new THREE.IcosahedronGeometry(ROCK_R, 1), CHAR, { scale: [1, 0.85, 1], warp: jitter(0.16) })];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Vector3(rand(-1, 1), rand(-0.4, 1), rand(-1, 1)).normalize().multiplyScalar(ROCK_R * 0.8);
    parts.push(bake(new THREE.IcosahedronGeometry(rand(0.16, 0.26), 0), i % 2 ? LAVA : C.flower, { pos: d.toArray(), warp: jitter(0.2) }));
  }
  return mergeAndShade(parts);
}

export function createMeteorKind() {
  const rockGeo = buildRock();
  const markerGeo = new THREE.RingGeometry(1.15, 1.75, 28).rotateX(-Math.PI / 2);
  const discGeo = new THREE.CircleGeometry(1.15, 24).rotateX(-Math.PI / 2);
  const flameGeo = new THREE.ConeGeometry(0.75, 5.5, 8).translate(0, 2.75, 0);
  const scorchGeo = new THREE.CircleGeometry(1.7, 20).rotateX(-Math.PI / 2);
  const scorchMat = new THREE.MeshBasicMaterial({ color: 0x1c1512, transparent: true, opacity: 0.55, depthWrite: false });
  return {
    pulse(time) {
      MARKER_MAT.opacity = 0.35 + 0.3 * Math.abs(Math.sin(time * 9));
    },
    make(mesh) {
      const group = new THREE.Group();
      const rock = mesh(rockGeo, group);
      const marker = new THREE.Mesh(markerGeo, MARKER_MAT);
      const disc = new THREE.Mesh(discGeo, MARKER_MAT);
      const flame = new THREE.Mesh(flameGeo, FLAME_MAT);
      const scorch = new THREE.Mesh(scorchGeo, scorchMat);
      for (const m of [marker, disc, scorch]) m.position.y = 0.05;
      rock.add(flame);
      flame.position.y = 0.4;
      group.add(marker, disc, scorch);
      group.visible = false;
      return {
        kind: 'meteor', action: 'jump', group, rock, marker, disc, flame, scorch, vz: 0, hz: 0.85, y0: 999, y1: 1000, landed: false, spin: rand(-2, 2),
      };
    },
    update(o, dt, ctx) {
      const phase = meteorPhase(timeToArrival(ctx.playerZ, o.z, ctx.speed));
      if (o.landed) return;
      o.group.visible = phase.marker;
      o.marker.visible = o.disc.visible = phase.marker && !phase.landed;
      o.disc.scale.setScalar(0.35 + 0.65 * phase.urgency);
      o.scorch.visible = phase.landed;
      o.flame.visible = phase.falling;
      o.rock.position.y = phase.altitude + ROCK_R * 0.7;
      o.rock.rotation.y += o.spin * dt;
      if (phase.landed) {
        o.landed = true;
        o.y0 = 0;
        o.y1 = 1.3;
        ctx.field.onMeteorLand?.(o);
      }
    },
    staticProps: (o) =>
      o.landed ? [{ dynamic: false, pos: o.group.position.clone(), friction: 0.6, shapes: [{ ball: ROCK_R * 0.9, at: [0, ROCK_R * 0.6, 0] }] }] : null,
  };
}
