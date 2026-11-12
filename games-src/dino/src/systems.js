// Construction of the renderer, scene and all subsystem singletons (the module-level `new ...` chain in the bundle).
import * as THREE from 'three';
import { params } from './state.js';
import { World } from './world/world.js';
import { DinoRig } from './dino/rig.js';
import { ObstacleField } from './obstacles/field.js';
import { DustPuffs } from './fx/puffs.js';
import { CameraShake } from './fx/shake.js';
import { ShieldBubble } from './fx/bubble.js';
import { RagdollSim } from './physics/ragdoll.js';
import { AudioFx } from './audio.js';
import { Input } from './input.js';
import { Autopilot } from './autopilot.js';
import { Hud } from './ui.js';

export const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('game'),
  antialias: true,
  powerPreference: 'high-performance',
});

/** Current pixel ratio; the adaptive-quality governor lowers it when FPS is poor. */
export const display = { pixelRatio: Math.min(window.devicePixelRatio || 1, params.coarsePointer ? 1.5 : 2) };
renderer.setPixelRatio(display.pixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // bundle literal: 4
renderer.toneMappingExposure = 1;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 2600);
export const world = new World(scene, renderer, { mobile: params.coarsePointer });
export const dino = new DinoRig(scene);
export const obstacles = new ObstacleField(scene);
export const puffs = new DustPuffs(scene);
export const bubble = new ShieldBubble(dino.rig);
export const shake = new CameraShake();
export const sim = new RagdollSim();
export const audio = new AudioFx();
export const input = new Input();
export const autopilot = new Autopilot();
export const hud = new Hud();
