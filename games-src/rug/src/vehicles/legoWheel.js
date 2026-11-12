import * as THREE from "three";

/** Lego wheel: black tire cylinder, grey hub discs both sides, three dark spoke bars. Returns {group, spin}. */
export function buildLegoWheel(radius, width, mats) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  const add = (geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    spin.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(radius, radius, width, 22).rotateX(Math.PI / 2), mats.black);
  for (const side of [-1, 1]) {
    add(
      new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.04, 18)
        .rotateX(Math.PI / 2)
        .translate(0, 0, side * (width / 2 + 0.01)),
      mats.grey,
    );
  }
  for (let i = 0; i < 3; i++) {
    add(new THREE.BoxGeometry(radius * 1.05, 0.09, width + 0.08).rotateZ((i * Math.PI) / 3), mats.dark);
  }
  return { group, spin };
}
