import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, mesh, pivot, ellipsoid, curve } from './rabbitModel.js';

export function createBicycleModel() {
  const root = new THREE.Group();
  root.name = 'Bicycle_Rig';

  const mint = mat(0x66cdaaa, 0.45);
  const darkMint = mat(0x287f7c, 0.5);
  const rubber = mat(0x325f68, 0.85);
  const cream = mat(0xfffaf0, 0.6);
  const spokeMat = mat(0xb5d9cf, 0.4);
  const gold = mat(0xffcc76, 0.35);
  const coral = mat(0xf58d83, 0.5);
  const basketMat = mat(0xfff6d8, 0.7);
  const basketRim = mat(0xb88761, 0.6);
  const ink = mat(0x315962, 0.7);
  const white = mat(0xffffff, 0.3);
  const blushMat = mat(0xef9c8e, 0.8);
  const browMat = mat(0x775d51, 0.8);
  const bellGold = mat(0xffd35d, 0.25);

  const torso = pivot(root, 'Torso', [0, 0, 0]);

  // Frame tubes: Step-through classic frame matching design concept
  curve(torso, 'Seat_Tube', [[0, 0.24, -0.06], [0, 0.50, -0.15]], 0.016, mint);
  curve(torso, 'Down_Tube', [[0, 0.24, -0.06], [0, 0.32, 0.10], [0, 0.43, 0.28]], 0.017, mint);
  curve(torso, 'Top_Tube', [[0, 0.42, -0.13], [0, 0.35, 0.05], [0, 0.52, 0.26]], 0.016, mint);
  curve(torso, 'Chainstay_L', [[-0.035, 0.24, -0.06], [-0.045, 0.24, -0.23], [-0.035, 0.24, -0.40]], 0.011, mint);
  curve(torso, 'Chainstay_R', [[0.035, 0.24, -0.06], [0.045, 0.24, -0.23], [0.035, 0.24, -0.40]], 0.011, mint);
  curve(torso, 'Seatstay_L', [[-0.015, 0.48, -0.15], [-0.042, 0.36, -0.28], [-0.035, 0.24, -0.40]], 0.010, mint);
  curve(torso, 'Seatstay_R', [[0.015, 0.48, -0.15], [0.042, 0.36, -0.28], [0.035, 0.24, -0.40]], 0.010, mint);
  curve(torso, 'Head_Tube', [[0, 0.42, 0.28], [0, 0.56, 0.26]], 0.022, darkMint);
  curve(torso, 'Basket_Bracket', [[0, 0.44, 0.28], [0, 0.50, 0.36], [0, 0.56, 0.42]], 0.012, darkMint);

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

  // Rear Wheel (Leg_L) - Hollow torus tire and rim with center hub and radiating spokes
  const legL = pivot(root, 'Leg_L', [0, 0.24, -0.40]);
  const tireR = mesh(new THREE.TorusGeometry(0.22, 0.024, 16, 32), rubber, legL, 'Tire_Rear');
  tireR.rotation.y = Math.PI / 2;
  const rimR = mesh(new THREE.TorusGeometry(0.195, 0.012, 12, 28), cream, legL, 'Rim_Rear');
  rimR.rotation.y = Math.PI / 2;
  const hubR = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.055, 16), gold, legL, 'Hub_Rear');
  hubR.rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.045, 28), rubber, legL, 'Rear_Wheel').visible = false;
  for (let i = 0; i < 4; i++) {
    const sp = mesh(new THREE.BoxGeometry(0.007, 0.38, 0.007), spokeMat, legL, 'Spoke_Rear_' + i);
    sp.rotation.x = i * (Math.PI / 4);
  }
  pivot(root, 'Leg_R', [0, 0.24, -0.40]);

  // Front Fork & Steering assembly
  const frontFork = pivot(root, 'Front_Fork', [0, 0.46, 0.27]);
  curve(frontFork, 'Fork_L', [[-0.035, 0.08, -0.01], [-0.035, -0.22, 0.13]], 0.012, mint);
  curve(frontFork, 'Fork_R', [[0.035, 0.08, -0.01], [0.035, -0.22, 0.13]], 0.012, mint);
  curve(frontFork, 'Fork_Crown', [[-0.035, 0.08, -0.01], [0, 0.09, 0], [0.035, 0.08, -0.01]], 0.015, darkMint);
  curve(frontFork, 'Stem', [[0, 0.09, 0], [0, 0.20, 0.01]], 0.014, darkMint);
  curve(frontFork, 'Handlebar', [[-0.20, 0.19, -0.05], [-0.10, 0.21, -0.01], [0, 0.20, 0.01], [0.10, 0.21, -0.01], [0.20, 0.19, -0.05]], 0.011, ink);
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 12), coral, frontFork, 'Grip_L', [-0.19, 0.19, -0.05]);
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 12), coral, frontFork, 'Grip_R', [0.19, 0.19, -0.05]);
  pivot(frontFork, 'Ear_L', [-0.19, 0.19, -0.05]);
  pivot(frontFork, 'Ear_R', [0.19, 0.19, -0.05]);

  // Bell on handlebar
  const bell = pivot(frontFork, 'Bell', [0.09, 0.22, -0.01]);
  mesh(new THREE.SphereGeometry(0.032, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), bellGold, bell, 'Bell_Dome');
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 8), darkMint, bell, 'Bell_Stem', [0, -0.015, 0]);
  ellipsoid(bell, 'Bell_Thumb_Lever', gold, [-0.025, 0.01, 0], [0.008, 0.008, 0.016]);

  // Front Wheel (Arm_L) - Hollow torus tire and rim with center hub and radiating spokes
  const armL = pivot(root, 'Arm_L', [0, 0.24, 0.40]);
  const tireF = mesh(new THREE.TorusGeometry(0.22, 0.024, 16, 32), rubber, armL, 'Tire_Front');
  tireF.rotation.y = Math.PI / 2;
  const rimF = mesh(new THREE.TorusGeometry(0.195, 0.012, 12, 28), cream, armL, 'Rim_Front');
  rimF.rotation.y = Math.PI / 2;
  const hubF = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.055, 16), gold, armL, 'Hub_Front');
  hubF.rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.045, 28), rubber, armL, 'Front_Wheel').visible = false;
  for (let i = 0; i < 4; i++) {
    const sp = mesh(new THREE.BoxGeometry(0.007, 0.38, 0.007), spokeMat, armL, 'Spoke_Front_' + i);
    sp.rotation.x = i * (Math.PI / 4);
  }
  pivot(root, 'Arm_R', [0, 0.24, 0.40]);

  // Head (Front Basket & Face - elevated above front wheel and angled towards child)
  // Enlarged basket body (0.34 x 0.24 x 0.18) for readable expressive face on phone & iPad screens
  const head = pivot(root, 'Head', [0, 0.58, 0.42]);
  head.rotation.y = -0.65;
  mesh(new RoundedBoxGeometry(0.34, 0.24, 0.18, 4, 0.035), basketMat, head, 'Basket_Mesh', [0, 0, 0]);
  mesh(new RoundedBoxGeometry(0.355, 0.024, 0.195, 3, 0.012), basketRim, head, 'Basket_Rim', [0, 0.12, 0]);
  curve(head, 'Basket_Stripe_1', [[-0.15, -0.01, 0.092], [0, 0.0, 0.095], [0.15, -0.01, 0.092]], 0.005, basketRim);
  curve(head, 'Basket_Stripe_2', [[-0.14, -0.06, 0.091], [0, -0.05, 0.094], [0.14, -0.06, 0.091]], 0.005, basketRim);

  const eyes = pivot(head, 'Eyes', [0, 0.03, 0.092]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * 0.08, 0, 0]);
    ellipsoid(eye, 'Eye_White', white, [0, 0, 0], [0.050, 0.062, 0.016]);
    ellipsoid(eye, 'Pupil', ink, [0, 0, 0.010], [0.026, 0.036, 0.010]);
    ellipsoid(eye, 'Catchlight', white, [-0.008, 0.016, 0.018], [0.009, 0.011, 0.004]);

    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', browMat, [s * 0.08, 0.082, 0.093], [0.052, 0.010, 0.010]);
    brow.rotation.z = s * 0.08;
    ellipsoid(head, s < 0 ? 'Cheek_L' : 'Cheek_R', blushMat, [s * 0.12, -0.035, 0.090], [0.028, 0.016, 0.008]);
  }

  curve(head, 'Smile', [[-0.055, -0.050, 0.093], [0, -0.064, 0.096], [0.055, -0.050, 0.093]], 0.006, ink);
  const happy = pivot(head, 'Happy_Mouth', [0, 0, 0]);
  curve(happy, 'Happy_Curve', [[-0.065, -0.044, 0.094], [0, -0.072, 0.097], [0.065, -0.044, 0.094]], 0.008, ink);
  happy.visible = false;

  // Tail (Rear Reflector & Mudguard snugly hugging rear wheel - zero floating parts)
  const tail = pivot(root, 'Tail', [0, 0.24, -0.40]);
  ellipsoid(tail, 'Rear_Reflector', coral, [0, 0.12, -0.24], [0.02, 0.02, 0.01]);
  curve(tail, 'Rear_Mudguard', [[0, 0.26, 0.05], [0, 0.27, -0.10], [0, 0.18, -0.22], [0, 0.05, -0.25]], 0.014, cream);

  // Bow (Front badge)
  const bow = pivot(root, 'Bow', [0, 0.46, 0.28]);
  ellipsoid(bow, 'Head_Badge', gold, [0, 0, 0.02], [0.025, 0.025, 0.01]);

  return root;
}
