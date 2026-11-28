import * as THREE from 'three';
import { mat, mesh, pivot, curve } from './rabbitModel.js';
import { vehicleEllipsoid as ellipsoid } from './vehicleModelGeometry.js';

// Make a rounded airfoil from its planform, in the plane used by its mount.
function airfoil(plan, depth, bevel) {
  return new THREE.ExtrudeGeometry(plan, {
    depth, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 10, steps: 1
  });
}

export function createAirplaneModel() {
  const root = new THREE.Group();
  root.name = 'Cloud_Airplane_Rig';
  const blue = mat(0x449ed7, .39), sky = mat(0x8edaf4, .36), cream = mat(0xfff6e5, .49);
  const glass = mat(0x2b5271, .28), ink = mat(0x243b54, .66), gold = mat(0xffca63, .45);
  const rubber = mat(0x384755, .88), white = mat(0xffffff, .37);
  const body = pivot(root, 'Torso', [0, .43, 0]);
  const fuselage = ellipsoid(body, 'Blue_Fuselage', blue, [0, .012, -.084], [.258, .242, .693]);
  fuselage.geometry = fuselage.geometry.clone();
  const { position, normal } = fuselage.geometry.attributes;
  const n = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    // Taper the rear along the length, keeping the original smoothing at the UV seam.
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const rear = Math.min(0, z);
    const taper = 1 - .38 * rear ** 2;
    position.setXY(i, x * taper, y * taper);
    n.fromBufferAttribute(normal, i);
    n.set(n.x / taper, n.y / taper, n.z + .76 * rear * (x * n.x + y * n.y) / taper).normalize();
    normal.setXYZ(i, n.x, n.y, n.z);
  }
  ellipsoid(body, 'Cream_Belly', cream, [0, -.086, .015], [.237, .151, .573]);

  const head = pivot(root, 'Head', [0, .46, .37]);
  ellipsoid(head, 'Round_Nose', cream, [0, -.043, .122], [.242, .188, .332]);
  ellipsoid(head, 'Cockpit', glass, [0, .107, .113], [.226, .140, .250]);
  curve(head, 'Cockpit_Rim', [[-.173,.142,.239],[-.092,.238,.199],[0,.248,.177],[.092,.238,.199],[.173,.142,.239]], .008, sky);
  const eyes = pivot(head, 'Eyes', [0, .111, .334]);
  const intakeProfile = [[.067,-.17],[.088,-.14],[.100,-.085],[.103,.11],[.096,.173],[.083,.194],[.069,.186],[.065,.145]];
  const nacelle = new THREE.LatheGeometry(intakeProfile.map(point => new THREE.Vector2(...point)), 28);
  nacelle.rotateX(Math.PI / 2);
  const wingTip = new THREE.Shape();
  wingTip.moveTo(-.064, -.002);
  wingTip.quadraticCurveTo(-.022,.036,.024,.092);
  wingTip.quadraticCurveTo(.058,.117,.073,.106);
  wingTip.lineTo(.050,-.011);
  wingTip.closePath();
  const tipGeometry = airfoil(wingTip, .014, .012);
  tipGeometry.rotateY(-Math.PI / 2);
  const rearFin = new THREE.Shape();
  rearFin.moveTo(-.113, -.014);
  rearFin.lineTo(.168, -.012);
  rearFin.bezierCurveTo(.092,.043,.018,.175,-.012,.253);
  rearFin.quadraticCurveTo(-.036,.304,-.077,.295);
  rearFin.lineTo(-.137,.272);
  rearFin.lineTo(-.131,.017);
  rearFin.closePath();
  const finGeometry = airfoil(rearFin, .026, .018);
  finGeometry.rotateY(-Math.PI / 2);

  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * .102, 0, 0]);
    eye.rotation.y = s * .27;
    ellipsoid(eye, 'Eye_White', white, [0, 0, 0], [.075, .066, .024]);
    ellipsoid(eye, 'Pupil', ink, [0, 0, .022], [.035, .043, .012]);
    ellipsoid(eye, 'Catchlight', white, [-.011, .017, .032], [.010, .011, .004]);
    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', sky, [s*.101,.194,.291], [.068,.012,.014]);
    brow.rotation.z = s * .08;
    pivot(head, s < 0 ? 'Ear_L' : 'Ear_R', [s*.24,.07,.02]);

    const wing = pivot(root, s < 0 ? 'Arm_L' : 'Arm_R', [s*.19,.39,-.072]);
    const wingPlan = new THREE.Shape();
    wingPlan.moveTo(0,.19);
    wingPlan.bezierCurveTo(s*.24,.13,s*.53,-.018,s*.705,-.122);
    wingPlan.quadraticCurveTo(s*.750,-.153,s*.704,-.190);
    wingPlan.lineTo(s*.067,-.254);
    wingPlan.lineTo(0,-.217);
    wingPlan.closePath();
    const wingGeometry = airfoil(wingPlan, .025, .019);
    wingGeometry.rotateX(Math.PI / 2);
    mesh(wingGeometry, blue, wing, s < 0 ? 'Wing_L' : 'Wing_R');
    mesh(tipGeometry, gold, wing, 'Winglet', [s*.681,.001,-.139]);
    ellipsoid(wing, 'Tip_Light', cream, [s*.703,.030,-.111], [.021,.015,.018]);

    const engine = pivot(wing, 'Engine', [s*.292,-.087,.033]);
    mesh(nacelle, cream, engine, 'Engine_Nacelle');
    mesh(new THREE.TorusGeometry(.077,.013,10,28), sky, engine, 'Intake_Lip', [0,0,.182]);
    ellipsoid(engine, 'Recessed_Intake', glass, [0,0,.133], [.069,.069,.017]);
    for (let i = 0; i < 6; i++) {
      const vane = pivot(engine, 'Fan_Vane', [0,0,.154]);
      vane.rotation.z = i * Math.PI / 3;
      ellipsoid(vane, 'Fan_Blade', blue, [0,.038,0], [.008,.024,.004]).rotation.z = .35;
    }
    ellipsoid(engine, 'Fan_Hub', gold, [0,0,.157], [.023,.023,.012]);
    ellipsoid(engine, 'Rear_Exhaust', glass, [0,0,-.151], [.067,.067,.013]);

    const gear = pivot(root, s < 0 ? 'Leg_L' : 'Leg_R', [s*.19,.10,-.20]);
    mesh(new THREE.CylinderGeometry(.017,.017,.15,12), glass, gear, 'Gear_Strut', [0,.08,0]);
    mesh(new THREE.CylinderGeometry(.075,.075,.055,22), rubber, gear, 'Landing_Wheel').rotation.z = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(.033,.033,.061,18), gold, gear, 'Wheel_Hub').rotation.z = Math.PI / 2;

    for (let i = 0; i < 4; i++) {
      const z = -.095 - i * .116;
      const offset = (z + .084) / .693;
      const skin = .258 * (1 - .38 * offset ** 2) * Math.sqrt(1 - offset ** 2 - (.070 / .242) ** 2);
      const window = pivot(body, 'Passenger_Window_Mount', [s * skin, .082, z]);
      window.rotation.y = s * (.5 * Math.PI - .15 * i);
      ellipsoid(window, 'Passenger_Window_Frame', sky, [0,0,0], [.036,.043,.013]);
      ellipsoid(window, 'Passenger_Window', glass, [0,0,.010], [.026,.033,.010]);
    }
  }
  const front = pivot(root, 'Nose_Gear', [0,.075,.46]);
  mesh(new THREE.CylinderGeometry(.015,.015,.155,10), glass, front, 'Front_Strut', [0,.075,0]);
  mesh(new THREE.CylinderGeometry(.065,.065,.054,20), rubber, front, 'Front_Wheel').rotation.z = Math.PI / 2;
  const tail = pivot(root, 'Tail', [0,.488,-.613]);
  mesh(finGeometry, blue, tail, 'Tail_Fin', [.013,0,0]);
  ellipsoid(tail, 'Fin_Gold_Tip', gold, [0,.281,-.068], [.029,.024,.059]).rotation.x = -.19;
  ellipsoid(tail, 'Tailplane', sky, [0,.038,-.020], [.355,.032,.113]);
  curve(head, 'Smile', [[-.104,-.082,.416],[0,-.108,.446],[.104,-.082,.416]], .010, ink);
  const happy = pivot(head, 'Happy_Mouth', [0,0,0]);
  curve(happy, 'Happy_Curve', [[-.116,-.073,.411],[0,-.127,.432],[.116,-.073,.411]], .013, ink);
  happy.visible = false;
  const bow = pivot(root, 'Bow', [0,.421,.823]);
  ellipsoid(bow, 'Wing_Badge', gold, [0,0,0], [.051,.014,.009]);
  return root;
}
