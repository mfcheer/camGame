import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// Authoring source for the shipped GLB. Smooth implicit surfaces join the cheeks,
// forehead and muzzle; the named pivot rig is shared by all animation states.
const mat = (color, roughness = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
function mesh(geo, material, parent, name, position = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, material);
  m.name = name;
  m.position.set(...position); m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function pivot(parent, name, position) {
  const g = new THREE.Group(); g.name = name; g.position.set(...position); parent.add(g); return g;
}
function ellipsoid(parent, name, material, position, scale) {
  return mesh(new THREE.SphereGeometry(1, 32, 24), material, parent, name, position, scale);
}
function smoothMin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function sculpt(parts, blend, material, parent, name) {
  const res = 38;
  const field = new MarchingCubes(res, material, false, false, 20000);
  field.isolation = 0;
  const half = res / 2;
  for (let z = 0; z < res; z++) for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) {
    const px = (x - half) / half, py = (y - half) / half, pz = (z - half) / half;
    let d = 10;
    for (const p of parts) {
      const v = (Math.hypot((px - p[0]) / p[3], (py - p[1]) / p[4], (pz - p[2]) / p[5]) - 1) * Math.min(p[3], p[4], p[5]);
      d = smoothMin(d, v, blend);
    }
    field.field[x + y * res + z * res * res] = -d;
  }
  field.update();
  const n = field.geometry.drawRange.count;
  const geo = new THREE.BufferGeometry();
  for (const key of ['position', 'normal']) {
    geo.setAttribute(key, new THREE.BufferAttribute(field.geometry.attributes[key].array.slice(0, n * 3), 3));
  }
  geo.normalizeNormals();
  field.geometry.dispose();
  return mesh(geo, material, parent, name);
}
function curve(parent, name, points, radius, material) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 8, false), material, parent, name);
}

/**
 * Chibi Healing Forest Bunny:
 * - Rounded spoon-shaped bunny ears with smooth domed tips and natural soft droop.
 * - Squishy round cheeks with warm glowing blush.
 * - Glossy boba sparkle eyes with crisp catchlights.
 * - Plump marshmallow muzzle and cotton ball tail.
 */
function earGeometry(inner = false, bend = 0) {
  // Rounded, spoon-curved chibi rabbit ear with soft rounded tip and cute natural droop
  const geo = new THREE.SphereGeometry(1, 28, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), t = (y + 1) / 2;
    // Chibi rounded spoon silhouette: wider in the middle/upper third, softly rounded apex
    const width = (inner ? 0.076 : 0.116) * (0.64 + 0.46 * Math.sin(t * Math.PI * 0.88));
    pos.setXYZ(i, pos.getX(i) * width + bend * Math.pow(t, 1.4),
      t * (inner ? 0.44 : 0.56), pos.getZ(i) * (inner ? 0.024 : 0.056) - 0.062 * t * t);
  }
  geo.computeVertexNormals(); return geo;
}

export function createRabbitModel() {
  const root = new THREE.Group(); root.name = 'Bunny_Rig';
  const fur = mat(0xf5e9d4, 0.93);
  const cream = mat(0xfff7e8, 0.96);
  const pink = mat(0xf0aba4, 0.87);
  const dark = mat(0x322829, 0.18, { metalness: 0.04 });
  const coral = mat(0xdb7158, 0.78);
  const mouthMat = mat(0x8e655d, 1);
  const blushMat = mat(0xf39e94, 0.95);

  const body = pivot(root, 'Torso', [0, 0.44, 0]);
  sculpt([
    [0, 0, 0, 0.30, 0.37, 0.25],
    [0, 0.25, 0.015, 0.22, 0.23, 0.20],
    [-0.21, -0.12, -0.035, 0.17, 0.20, 0.19],
    [0.21, -0.12, -0.035, 0.17, 0.20, 0.19]
  ], 0.10, fur, body, 'Sculpted_Pear_Body');

  ellipsoid(body, 'Cream_Bib', cream, [0, -0.015, 0.215], [0.205, 0.260, 0.065]);

  // Round, squishy cheeks with cuddly chibi proportions
  const head = pivot(root, 'Head', [0, 0.94, 0.04]);
  sculpt([
    [0, 0.02, 0, 0.33, 0.30, 0.27],
    [-0.20, -0.08, 0.06, 0.19, 0.17, 0.21],
    [0.20, -0.08, 0.06, 0.19, 0.17, 0.21],
    [0, -0.13, 0.19, 0.21, 0.14, 0.16]
  ], 0.10, fur, head, 'Sculpted_Head_Cheeks');

  // Plump twin muzzle cushions
  const muzzle = pivot(head, 'Muzzle', [0, -0.11, 0.265]);
  ellipsoid(muzzle, 'Muzzle_L', cream, [-0.062, 0, 0], [0.086, 0.065, 0.038]);
  ellipsoid(muzzle, 'Muzzle_R', cream, [0.062, 0, 0], [0.086, 0.065, 0.038]);

  // Sweet pink heart nose
  const nose = ellipsoid(head, 'Nose', pink, [0, -0.075, 0.319], [0.034, 0.024, 0.022]);
  nose.rotation.z = Math.PI;

  // Cute Y-smile
  curve(head, 'Mouth_Stem', [[0, -0.09, 0.32], [0, -0.13, 0.32]], 0.005, mouthMat);
  curve(head, 'Smile_L', [[0, -0.13, 0.32], [-0.024, -0.153, 0.312], [-0.047, -0.14, 0.30]], 0.0045, mouthMat);
  curve(head, 'Smile_R', [[0, -0.13, 0.32], [0.024, -0.153, 0.312], [0.047, -0.14, 0.30]], 0.0045, mouthMat);

  // Soft glowing rosy blush cheeks
  ellipsoid(head, 'Cheek_L', blushMat, [-0.245, -0.085, 0.207], [0.060, 0.036, 0.015]);
  ellipsoid(head, 'Cheek_R', blushMat, [0.245, -0.085, 0.207], [0.060, 0.036, 0.015]);

  // Glossy boba eyes
  const eyes = pivot(head, 'Eyes', [0, 0, 0]);
  for (const side of [-1, 1]) {
    const eye = pivot(eyes, side < 0 ? 'Eye_L' : 'Eye_R', [side * 0.148, 0.035, 0.25]);
    eye.rotation.y = side * 0.27;
    ellipsoid(eye, 'Eye_Glass', dark, [0, 0, 0], [0.048, 0.058, 0.027]);
    ellipsoid(eye, 'Catchlight', mat(0xffffff, 0.15, { emissive: 0xffffff, emissiveIntensity: 0.40 }), [-0.013, 0.019, 0.024], [0.014, 0.016, 0.007]);
    ellipsoid(eye, 'Catchlight_Small', cream, [0.014, -0.014, 0.025], [0.007, 0.008, 0.004]);

    // Rounded, spoon-curved ears with domed tips and gentle tilt
    const ear = pivot(head, side < 0 ? 'Ear_L' : 'Ear_R', [side * 0.140, 0.240, -0.025]);
    ear.rotation.z = -side * 0.12;
    ear.rotation.x = -0.03;
    mesh(earGeometry(false, side * 0.045), fur, ear, 'Outer_Ear');
    mesh(earGeometry(true, side * 0.035), pink, ear, 'Inner_Ear', [0, 0.060, 0.040]);

    const arm = pivot(root, side < 0 ? 'Arm_L' : 'Arm_R', [side * 0.265, 0.61, 0.09]);
    arm.rotation.z = side * 0.17;
    ellipsoid(arm, 'Forepaw', fur, [0, -0.105, 0.065], [0.083, 0.17, 0.083]);

    const leg = pivot(root, side < 0 ? 'Leg_L' : 'Leg_R', [side * 0.20, 0.16, 0.01]);
    ellipsoid(leg, 'Hind_Foot', fur, [0, -0.055, 0.10], [0.13, 0.095, 0.23]);
    ellipsoid(leg, 'Paw_Pad', pink, [0, -0.01, 0.25], [0.073, 0.035, 0.05]);
    for (let k = 0; k < 2; k++) curve(leg, 'Toe_Seam', [[(k - 0.5) * 0.075, -0.015, 0.29], [(k - 0.5) * 0.075, 0.005, 0.25]], 0.003, mouthMat);
  }

  // Expression mouth & tongue
  const happy = ellipsoid(head, 'Happy_Mouth', mat(0x82574c, 1), [0, -0.15, 0.326], [0.043, 0.032, 0.013]);
  happy.visible = false;
  const tongue = ellipsoid(head, 'Happy_Tongue', pink, [0, -0.165, 0.338], [0.025, 0.011, 0.005]);
  tongue.visible = false;

  // Round fluffy cotton ball tail
  const tail = pivot(root, 'Tail', [0, 0.33, -0.26]);
  ellipsoid(tail, 'Cotton_Tail', cream, [0, 0, 0], [0.15, 0.15, 0.14]);

  // Neck bowtie
  const bow = pivot(root, 'Bow', [0, 0.70, 0.245]);
  for (const side of [-1, 1]) {
    const wing = ellipsoid(bow, 'Bow_Wing', coral, [side * 0.076, 0, 0], [0.077, 0.055, 0.035]);
    wing.rotation.z = side * 0.3;
  }
  ellipsoid(bow, 'Bow_Knot', mat(0xf4b26f, 0.72), [0, 0, 0.025], [0.035, 0.037, 0.026]);

  return root;
}

export function getRabbitRig(model) {
  const get = name => model.getObjectByName(name);
  return {
    headGroup: get('Head'),
    bodyMesh: get('Torso'),
    eyesGroup: get('Eyes'),
    leftEye: get('Eye_L'),
    rightEye: get('Eye_R'),
    leftEarGroup: get('Ear_L'),
    rightEarGroup: get('Ear_R'),
    leftArm: get('Arm_L'),
    rightArm: get('Arm_R'),
    leftLeg: get('Leg_L'),
    rightLeg: get('Leg_R'),
    bowtieGroup: get('Bow'),
    tailGroup: get('Tail')
  };
}

// Shared authoring primitives for compatible animal rigs.
export { mat, mesh, pivot, ellipsoid, sculpt, curve };
