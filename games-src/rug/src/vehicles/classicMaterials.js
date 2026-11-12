import * as THREE from "three";

/** Shared material set for the "classic" (die-cast) cars; lazily created once. */
const carMaterials = {};

export function getClassicMaterials() {
  if (!carMaterials.chrome) {
    carMaterials.chrome = new THREE.MeshStandardMaterial({ color: 14672872, metalness: 1, roughness: 0.16 });
    carMaterials.darkChrome = new THREE.MeshStandardMaterial({ color: 9080984, metalness: 1, roughness: 0.3 });
    carMaterials.plastic = new THREE.MeshStandardMaterial({ color: 1908514, metalness: 0, roughness: 0.5 });
    carMaterials.tire = new THREE.MeshStandardMaterial({ color: 1447446, metalness: 0, roughness: 0.85 });
    carMaterials.glass = new THREE.MeshPhysicalMaterial({
      color: 1318956,
      metalness: 0,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.8,
    });
    carMaterials.head = new THREE.MeshStandardMaterial({
      color: 16775390,
      emissive: 16773572,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    carMaterials.tail = new THREE.MeshStandardMaterial({
      color: 11537414,
      emissive: 14682112,
      emissiveIntensity: 1.3,
      roughness: 0.2,
    });
    carMaterials.helmet = new THREE.MeshPhysicalMaterial({ color: 16777215, roughness: 0.2, clearcoat: 1 });
    carMaterials.white = new THREE.MeshStandardMaterial({ color: 16184298, roughness: 0.4 });
  }
  return carMaterials;
}
