import * as THREE from 'three';
import { mat, mesh, pivot, ellipsoid, sculpt, curve } from './rabbitModel.js';

/**
 * Garfield-Style Marmalade Cat:
 * - Round, compact half-circle ears that hug the curved skull naturally (no sharp horns or bulging ears).
 * - Chubby cheeks, double-cushion whisker pads with signature Garfield freckle dots.
 * - Big almond/oval expressive eyes with warm green iris and gentle upper-lid hoods.
 * - Warm saturated Garfield orange fur with rich dark mahogany tabby stripes.
 * - Fully compatible node hierarchy for animations and regression tests.
 */
function earGeometry(inner = false) {
  const s = new THREE.Shape();
  // A soft, rounded half-circle scallop with gentle curve and rounded apex
  const w = inner ? 0.065 : 0.092;
  const h = inner ? 0.082 : 0.125;
  s.moveTo(-w, 0);
  s.quadraticCurveTo(-w * 0.95, h * 0.55, -w * 0.35, h * 0.92);
  s.quadraticCurveTo(0, h * 1.05, w * 0.35, h * 0.92);
  s.quadraticCurveTo(w * 0.95, h * 0.55, w, 0);
  s.quadraticCurveTo(0, -0.012, -w, 0);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: inner ? 0.010 : 0.032,
    bevelEnabled: true,
    bevelSize: inner ? 0.004 : 0.010,
    bevelThickness: 0.008,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 18
  });
  return g;
}

function almond() {
  const s = new THREE.Shape();
  // Large, expressive rounded almond-oval shape
  s.moveTo(-0.082, 0);
  s.quadraticCurveTo(-0.025, 0.088, 0.082, 0.018);
  s.quadraticCurveTo(0.028, -0.068, -0.082, 0);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.016,
    bevelEnabled: true,
    bevelSize: 0.006,
    bevelThickness: 0.006,
    bevelSegments: 3,
    curveSegments: 16
  });
}

export function createCatModel() {
  const root = new THREE.Group();
  root.name = 'Marmalade_Rig';
  root.userData.designVersion = 4;

  // Garfield color palette: rich warm orange, creamy muzzle/bib, deep brown stripes, coral-pink nose/ears
  const orange = mat(0xf29124, 0.92);
  const cream = mat(0xffeed2, 0.95);
  const stripe = mat(0x8e4219, 0.96);
  const pink = mat(0xe87f7b, 0.90);
  const ink = mat(0x382821, 0.22);
  const green = mat(0x8ebf4b, 0.32);

  // Plump, seated Garfield body
  const body = pivot(root, 'Torso', [0, 0.42, 0]);
  sculpt([
    [0, -0.015, 0, 0.275, 0.33, 0.26],
    [0, 0.20, 0.005, 0.215, 0.20, 0.20],
    [-0.21, -0.15, -0.015, 0.15, 0.16, 0.18],
    [0.21, -0.15, -0.015, 0.15, 0.16, 0.18]
  ], 0.080, orange, body, 'Cat_Seated_Body');

  // Cream belly bib
  ellipsoid(body, 'Cream_Bib', cream, [0, 0.035, 0.222], [0.150, 0.210, 0.045]);

  // Broad, round Garfield head with chubby cheeks
  const head = pivot(root, 'Head', [0, 0.91, 0.045]);
  sculpt([
    [0, 0.02, 0, 0.34, 0.27, 0.24],              // wide rounded skull
    [-0.205, -0.07, 0.035, 0.165, 0.145, 0.185], // left chubby jowl
    [0.205, -0.07, 0.035, 0.165, 0.145, 0.185],  // right chubby jowl
    [0, -0.125, 0.07, 0.23, 0.115, 0.165]        // lower jowl / chin
  ], 0.065, orange, head, 'Feline_Head');

  for (const side of [-1, 1]) {
    // Garfield-style small, rounded ears that hug the curved top skull naturally
    const ear = pivot(head, side < 0 ? 'Ear_L' : 'Ear_R', [side * 0.185, 0.21, 0.02]);
    ear.rotation.z = -side * 0.22;
    ear.rotation.x = -0.04;
    ear.rotation.y = side * 0.10;

    // Node name 'Pointed_Ear' preserved for test backward-compatibility
    mesh(earGeometry(), orange, ear, 'Pointed_Ear');
    mesh(earGeometry(true), pink, ear, 'Inner_Ear', [0, 0.015, 0.018]);

    // Twin puffy cream whisker pads (Garfield signature!)
    ellipsoid(head, 'Whisker_Pad', cream, [side * 0.075, -0.088, 0.232], [0.092, 0.066, 0.045]);

    // Whisker freckle dots on pads
    ellipsoid(head, 'Whisker_Dot', stripe, [side * 0.065, -0.075, 0.270], [0.0055, 0.0055, 0.003]);
    ellipsoid(head, 'Whisker_Dot', stripe, [side * 0.102, -0.086, 0.266], [0.0055, 0.0055, 0.003]);
    ellipsoid(head, 'Whisker_Dot', stripe, [side * 0.075, -0.100, 0.268], [0.0055, 0.0055, 0.003]);

    // Fine whiskers
    for (let i = 0; i < 3; i++) {
      curve(head, 'Fine_Whisker', [
        [side * 0.125, -0.088 + i * 0.016, 0.255],
        [side * 0.24, -0.082 + i * 0.022, 0.252],
        [side * 0.33, -0.088 + i * 0.030, 0.225]
      ], 0.0025, mat(0x754a32, 1));
    }

    // Cheek tiger stripes (Garfield style 2 dark tabs on each cheek)
    for (let i = 0; i < 2; i++) {
      curve(head, 'Cheek_Tab', [
        [side * 0.285, -0.01 - i * 0.052, 0.12],
        [side * 0.265, -0.025 - i * 0.052, 0.155],
        [side * 0.235, -0.038 - i * 0.052, 0.180]
      ], 0.011, stripe);
    }

    // Foreleg & grounded forepaw
    const arm = pivot(root, side < 0 ? 'Arm_L' : 'Arm_R', [side * 0.14, 0.52, 0.13]);
    ellipsoid(arm, 'Slim_Foreleg', orange, [0, -0.21, 0.05], [0.065, 0.22, 0.070]);
    ellipsoid(arm, 'Grounded_Forepaw', cream, [0, -0.414, 0.095], [0.082, 0.054, 0.108]);
    for (let i = 0; i < 2; i++) {
      curve(arm, 'Toe_Seam', [
        [((i - 0.5) * 0.035), -0.398, 0.19],
        [((i - 0.5) * 0.035), -0.424, 0.194]
      ], 0.0025, stripe);
    }

    // Hind haunch & cream toes
    const leg = pivot(root, side < 0 ? 'Leg_L' : 'Leg_R', [side * 0.245, 0.15, -0.02]);
    ellipsoid(leg, 'Haunch', orange, [side * 0.01, 0.02, -0.01], [0.125, 0.165, 0.160]);
    ellipsoid(leg, 'Cream_Hind_Toes', cream, [0, -0.067, 0.13], [0.105, 0.062, 0.155]);
    curve(arm, 'Leg_Tab', [
      [side * 0.045, -0.14, 0.095],
      [0, -0.15, 0.118],
      [-side * 0.045, -0.14, 0.097]
    ], 0.009, stripe);
  }

  // Chin
  ellipsoid(head, 'Chin', cream, [0, -0.155, 0.20], [0.082, 0.030, 0.032]);

  // Big expressive almond-oval eyes
  const eyes = pivot(head, 'Eyes', [0, 0, 0]);
  for (const side of [-1, 1]) {
    const eye = pivot(eyes, side < 0 ? 'Eye_L' : 'Eye_R', [side * 0.122, 0.034, 0.222]);
    eye.rotation.y = side * 0.16;

    const rim = mesh(almond(), mat(0xa86e36, 0.9), eye, 'Almond_Eyelid');
    rim.scale.set(1.09, 1.12, 1);
    rim.position.z = -0.004;

    mesh(almond(), green, eye, 'Almond_Iris');
    ellipsoid(eye, 'Pupil', ink, [0, 0.003, 0.026], [0.014, 0.043, 0.012]);
    ellipsoid(eye, 'Catchlight', mat(0xffffff, 0.1, { emissive: 0xffffff, emissiveIntensity: 0.35 }), [-0.018, 0.022, 0.034], [0.012, 0.013, 0.004]);
    ellipsoid(eye, 'Catchlight_Small', cream, [0.013, -0.015, 0.035], [0.005, 0.006, 0.003]);
  }

  // Garfield forehead stripes (3 classic dark tiger marks)
  for (const [x, y, z] of [[0, 0.208, 0.145], [-0.082, 0.192, 0.155], [0.082, 0.192, 0.155]]) {
    curve(head, 'Forehead_Tab', [
      [x * 0.85, y + 0.025, z - 0.025],
      [x, y, z],
      [x * 0.82, y - 0.065, z + 0.039]
    ], 0.011, stripe);
  }

  // Cute pink heart/button nose placed right between whisker pads
  const nose = new THREE.Shape();
  nose.moveTo(-0.025, 0.010);
  nose.quadraticCurveTo(0, 0.020, 0.025, 0.010);
  nose.quadraticCurveTo(0.019, -0.008, 0, -0.020);
  nose.quadraticCurveTo(-0.019, -0.008, -0.025, 0.010);
  mesh(new THREE.ExtrudeGeometry(nose, {
    depth: 0.010,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    bevelSegments: 2
  }), pink, head, 'Cat_Heart_Nose', [0, -0.060, 0.266]);

  // Cute cat smile
  curve(head, 'Mouth_Stem', [[0, -0.078, 0.272], [0, -0.116, 0.268]], 0.0035, ink);
  curve(head, 'Smile_L', [[0, -0.116, 0.268], [-0.028, -0.134, 0.261], [-0.050, -0.120, 0.248]], 0.0035, ink);
  curve(head, 'Smile_R', [[0, -0.116, 0.268], [0.028, -0.134, 0.261], [0.050, -0.120, 0.248]], 0.0035, ink);

  // Expression mouth & tongue
  const happy = ellipsoid(head, 'Happy_Mouth', mat(0x82534a, 0.95), [0, -0.134, 0.266], [0.038, 0.028, 0.011]);
  happy.visible = false;
  const tongue = ellipsoid(head, 'Happy_Tongue', pink, [0, -0.144, 0.276], [0.022, 0.010, 0.005]);
  tongue.visible = false;

  // Upright ringed tabby tail
  const tail = pivot(root, 'Tail', [0.25, 0.23, -0.15]);
  curve(tail, 'Upright_Cat_Tail', [
    [0, 0, 0],
    [0.17, 0.02, -0.09],
    [0.29, 0.16, -0.10],
    [0.30, 0.36, -0.10],
    [0.22, 0.46, -0.07]
  ], 0.052, orange);
  ellipsoid(tail, 'Tail_Tip', cream, [0.22, 0.46, -0.07], [0.052, 0.058, 0.050]);
  for (let i = 0; i < 3; i++) {
    const ring = mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 18), stripe, tail, 'Tabby_Tail_Ring', [0.30 - i * 0.007, 0.17 + i * 0.08, -0.10]);
    ring.rotation.x = Math.PI / 2;
  }

  // Neck scarf bow & bell
  const bow = pivot(root, 'Bow', [0, 0.69, 0.23]);
  const teal = mat(0x5a9a8f, 0.88);
  for (const side of [-1, 1]) {
    const wing = ellipsoid(bow, 'Scarf_Wing', teal, [side * 0.055, 0, 0], [0.062, 0.035, 0.023]);
    wing.rotation.z = side * 0.3;
  }
  ellipsoid(bow, 'Bell', mat(0xe5bc68, 0.32, { metalness: 0.3 }), [0, -0.033, 0.03], [0.028, 0.033, 0.025]);

  return root;
}
