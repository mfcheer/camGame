import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, mesh, pivot, curve } from './rabbitModel.js';
import { vehicleEllipsoid as ellipsoid } from './vehicleModelGeometry.js';

function wheel(parent, end, rubber, cream, spokes, gold) {
  mesh(new THREE.TorusGeometry(.221, .024, 12, 40), rubber, parent, end + '_Wheel').rotation.y = Math.PI / 2;
  mesh(new THREE.TorusGeometry(.195, .011, 10, 40), cream, parent, end + '_Rim').rotation.y = Math.PI / 2;
  for (const side of [-1, 1]) {
    mesh(new THREE.TorusGeometry(.217, .008, 8, 40), cream, parent, end + '_Sidewall', [side*.017,0,0]).rotation.y = Math.PI / 2;
  }
  mesh(new THREE.CylinderGeometry(.029, .029, .062, 16), gold, parent, end + '_Hub').rotation.z = Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    mesh(new THREE.BoxGeometry(.006,.382,.006), spokes, parent, end + '_Spoke').rotation.x = i * Math.PI / 5;
  }
}

function basketOutline(path, w, d, r) {
  path.moveTo(-w + r, -d);
  path.lineTo(w - r, -d);
  path.quadraticCurveTo(w, -d, w, -d + r);
  path.lineTo(w, d - r);
  path.quadraticCurveTo(w, d, w - r, d);
  path.lineTo(-w + r, d);
  path.quadraticCurveTo(-w, d, -w, d - r);
  path.lineTo(-w, -d + r);
  path.quadraticCurveTo(-w, -d, -w + r, -d);
  path.closePath();
  return path;
}

function basketBand(width, depth, height, thickness) {
  const outside = basketOutline(new THREE.Shape(), width, depth, .032);
  outside.holes.push(basketOutline(new THREE.Path(), width - thickness, depth - thickness, .032 - thickness));
  const geometry = new THREE.ExtrudeGeometry(outside, {
    depth: height, bevelEnabled: false, curveSegments: 5
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createBicycleModel() {
  const root = new THREE.Group();
  root.name = 'Bicycle_Rig';

  const mint = mat(0x67c9aa, 0.38);
  const darkMint = mat(0x287f7c, 0.5);
  const rubber = mat(0x335460, 0.85);
  const cream = mat(0xfffaf0, 0.6);
  const spokeMat = mat(0x9cadb1, 0.4);
  const gold = mat(0xffcc76, 0.35);
  const coral = mat(0xf58d83, 0.5);
  const basketMat = mat(0xf5dfad, 0.7);
  const basketRim = mat(0xc3935d, 0.68);
  const weave = mat(0xe0b981, 0.78);
  const ink = mat(0x315962, 0.7);
  const white = mat(0xffffff, 0.3);
  const blushMat = mat(0xef9c8e, 0.8);
  const browMat = mat(0x775d51, 0.8);
  const bellGold = mat(0xffd35d, 0.25);

  const torso = pivot(root, 'Torso', [0, 0, 0]);

  // Low step-through frame, with heavier main tubes so it reads at avatar scale.
  curve(torso, 'Seat_Tube', [[0, 0.24, -0.06], [0, 0.50, -0.15]], 0.021, mint);
  curve(torso, 'Down_Tube', [[0, 0.24, -0.06], [0, 0.32, 0.10], [0, 0.43, 0.28]], 0.021, mint);
  curve(torso, 'Top_Tube', [[0, 0.42, -0.13], [0, 0.35, 0.05], [0, 0.52, 0.26]], 0.021, mint);
  curve(torso, 'Chainstay_L', [[-0.035, 0.24, -0.06], [-0.045, 0.24, -0.23], [-0.035, 0.24, -0.40]], 0.011, mint);
  curve(torso, 'Chainstay_R', [[0.035, 0.24, -0.06], [0.045, 0.24, -0.23], [0.035, 0.24, -0.40]], 0.011, mint);
  curve(torso, 'Seatstay_L', [[-0.015, 0.48, -0.15], [-0.042, 0.36, -0.28], [-0.035, 0.24, -0.40]], 0.010, mint);
  curve(torso, 'Seatstay_R', [[0.015, 0.48, -0.15], [0.042, 0.36, -0.28], [0.035, 0.24, -0.40]], 0.010, mint);
  curve(torso, 'Head_Tube', [[0, 0.42, 0.28], [0, 0.56, 0.26]], 0.022, darkMint);
  curve(torso, 'Basket_Bracket', [[0, 0.43, 0.28], [0, 0.45, 0.35], [0, 0.49, 0.42]], 0.015, darkMint);

  // Bottom bracket, chain disc, crank arms & pedals
  mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.015, 20), gold, torso, 'Crank_Disc', [0.03, 0.24, -0.06]).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.10, 12), darkMint, torso, 'Crank_Axle', [0, 0.24, -0.06]).rotation.z = Math.PI / 2;
  curve(torso, 'Crank_Arm_L', [[-0.05, 0.24, -0.06], [-0.05, 0.16, -0.06]], 0.008, darkMint);
  curve(torso, 'Crank_Arm_R', [[0.05, 0.24, -0.06], [0.05, 0.32, -0.06]], 0.008, darkMint);
  mesh(new THREE.BoxGeometry(0.045, 0.016, 0.03), ink, torso, 'Pedal_L', [-0.07, 0.16, -0.06]);
  mesh(new THREE.BoxGeometry(0.045, 0.016, 0.03), ink, torso, 'Pedal_R', [0.07, 0.32, -0.06]);

  // Saddle & Seat Post
  curve(torso, 'Seat_Post', [[0, 0.48, -0.15], [0, 0.53, -0.16]], 0.012, darkMint);
  mesh(new RoundedBoxGeometry(0.14, 0.04, 0.20, 4, 0.02), coral, torso, 'Saddle', [0, 0.55, -0.17]);
  ellipsoid(torso, 'Saddle_Nose', coral, [0, 0.545, -0.10], [0.04, 0.018, 0.05]);
  ellipsoid(torso, 'Saddle_Rear', coral, [0, 0.55, -0.21], [0.07, 0.02, 0.06]);

  const legL = pivot(root, 'Leg_L', [0, 0.24, -0.40]);
  wheel(legL, 'Rear', rubber, cream, spokeMat, gold);
  pivot(root, 'Leg_R', [0, 0.24, -0.40]);

  // Front Fork & Steering assembly
  const frontFork = pivot(root, 'Front_Fork', [0, 0.46, 0.27]);
  curve(frontFork, 'Fork_L', [[-0.035, 0.08, -0.01], [-0.035, -0.22, 0.13]], 0.012, mint);
  curve(frontFork, 'Fork_R', [[0.035, 0.08, -0.01], [0.035, -0.22, 0.13]], 0.012, mint);
  curve(frontFork, 'Fork_Crown', [[-0.035, 0.08, -0.01], [0, 0.09, 0], [0.035, 0.08, -0.01]], 0.015, darkMint);
  curve(frontFork, 'Stem', [[0, 0.09, 0], [0, 0.20, 0.01]], 0.014, darkMint);
  curve(frontFork, 'Handlebar', [[-0.20, 0.19, -0.05], [-0.10, 0.21, -0.01], [0, 0.20, 0.01], [0.10, 0.21, -0.01], [0.20, 0.19, -0.05]], 0.011, ink);
  for (const side of [-1, 1]) {
    curve(frontFork, 'Grip', [[side*.157,.199,-.036],[side*.185,.194,-.045],[side*.210,.189,-.055]], .018, coral);
  }
  pivot(frontFork, 'Ear_L', [-0.19, 0.19, -0.05]);
  pivot(frontFork, 'Ear_R', [0.19, 0.19, -0.05]);

  // Bell on handlebar
  const bell = pivot(frontFork, 'Bell', [0.09, 0.22, -0.01]);
  mesh(new THREE.SphereGeometry(0.032, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), bellGold, bell, 'Bell_Dome');
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 8), darkMint, bell, 'Bell_Stem', [0, -0.015, 0]);
  ellipsoid(bell, 'Bell_Thumb_Lever', gold, [-0.025, 0.01, 0], [0.008, 0.008, 0.016]);

  // The steering fork carries the whole rotating front wheel at its dropout.
  const armL = pivot(frontFork, 'Arm_L', [0, -0.22, 0.13]);
  wheel(armL, 'Front', rubber, cream, spokeMat, gold);
  pivot(root, 'Arm_R', [0, 0.24, 0.40]);

  // A recessed open basket leaves a quiet front panel for the face.
  const head = pivot(root, 'Head', [0, 0.58, 0.42]);
  head.rotation.y = -0.65;
  const basket = mesh(basketBand(.168, .090, .208, .018), basketMat, head, 'Basket_Mesh');
  const points = basket.geometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const y = points.getY(i);
    const taper = Math.min(1, .82 + y * 1.5);
    points.setXYZ(i, points.getX(i) * taper, y - .103, points.getZ(i) * taper);
  }
  basket.geometry.computeVertexNormals();
  mesh(new RoundedBoxGeometry(.276,.033,.151,3,.016), weave, head, 'Basket_Floor', [0,-.098,0]);
  mesh(basketBand(.178,.100,.021,.021), basketRim, head, 'Basket_Rim', [0,.105,0]);
  for (const side of [-1, 1]) {
    for (const z of [-.058, -.029, 0, .029, .058]) {
      curve(head, 'Wicker_Upright', [[side*.144,-.079,z*.85],[side*.167,.022,z],[side*.171,.097,z]], .004, weave);
    }
  }
  for (const y of [-.065, -.026, .016, .058, .093]) {
    const taper = Math.min(1, .82 + (y + .103) * 1.5);
    mesh(basketBand(.169*taper, .091*taper, .008, .004), weave, head, 'Wicker_Band', [0,y,0]);
  }

  const eyes = pivot(head, 'Eyes', [0, 0.023, 0.092]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * 0.08, 0, 0]);
    ellipsoid(eye, 'Eye_White', white, [0, 0, 0], [0.048, 0.054, 0.018]);
    ellipsoid(eye, 'Pupil', ink, [0, 0, 0.010], [0.026, 0.036, 0.010]);
    ellipsoid(eye, 'Catchlight', white, [-0.008, 0.016, 0.018], [0.009, 0.011, 0.004]);

    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', browMat, [s * 0.08, 0.079, 0.094], [0.052, 0.010, 0.010]);
    brow.rotation.z = s * 0.08;
    ellipsoid(head, s < 0 ? 'Cheek_L' : 'Cheek_R', blushMat, [s * 0.12, -0.035, 0.090], [0.028, 0.016, 0.008]);
  }

  curve(head, 'Smile', [[-0.055, -0.050, 0.093], [0, -0.064, 0.096], [0.055, -0.050, 0.093]], 0.006, ink);
  const happy = pivot(head, 'Happy_Mouth', [0, 0, 0]);
  curve(happy, 'Happy_Curve', [[-0.065, -0.044, 0.094], [0, -0.072, 0.097], [0.065, -0.044, 0.094]], 0.008, ink);
  happy.visible = false;

  // The rear fender traces the tire arc and carries a small red reflector.
  const tail = pivot(root, 'Tail', [0, 0.24, -0.40]);
  for (const [holder, name, start, end] of [
    [tail, 'Rear_Mudguard', -.53, 1.27], [frontFork, 'Front_Mudguard', -1.10, .23]
  ]) {
    const cy = holder === tail ? 0 : -.22;
    const cz = holder === tail ? 0 : .13;
    const arch = Array.from({ length: 9 }, (_, i) => {
      const angle = start + (end - start) * i / 8;
      return [0, cy + Math.cos(angle) * .253, cz - Math.sin(angle) * .253];
    });
    curve(holder, name, arch, .015, mint);
  }
  ellipsoid(tail, 'Rear_Reflector', coral, [0,.091,-.242], [.024,.020,.014]);

  // Bow (Front badge)
  const bow = pivot(root, 'Bow', [0, 0.46, 0.28]);
  ellipsoid(bow, 'Head_Badge', gold, [0, 0, 0.02], [0.025, 0.025, 0.01]);

  return root;
}
