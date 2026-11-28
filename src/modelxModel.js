import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, mesh, pivot, curve } from './rabbitModel.js';
import { vehicleEllipsoid as ellipsoid } from './vehicleModelGeometry.js';

// Draw in the vehicle's side plane (forward, up), then bevel across its width.
function sideShell(profile, width, bevel) {
  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: width - 2 * bevel, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 4, curveSegments: 12, steps: 1
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(width / 2 - bevel, 0, 0);
  return geometry;
}

export function createModelXModel() {
  const root = new THREE.Group();
  root.name = 'ModelX_Rig';
  const pearl = mat(0xf0f4f7, .28), glass = mat(0x274358, .27);
  const ink = mat(0x202d3d, .68), alloy = mat(0xa2b9cb, .4), rubber = mat(0x29333f, .88);
  const lamp = mat(0xbceeff, .32), white = mat(0xffffff, .3), red = mat(0xe36169, .42);
  const body = pivot(root, 'Torso', [0, .38, 0]);
  const shell = new THREE.Shape();
  shell.moveTo(-.68, -.19);
  shell.lineTo(-.645, -.19);
  shell.absarc(-.46, -.22, .185, Math.PI - .16, .16, true);
  shell.lineTo(-.275, -.19);
  shell.lineTo(.265, -.19);
  shell.absarc(.45, -.22, .185, Math.PI - .16, .16, true);
  shell.lineTo(.685, -.19);
  shell.quadraticCurveTo(.735, -.17, .732, -.075);
  shell.quadraticCurveTo(.728, .027, .64, .069);
  shell.quadraticCurveTo(.55, .11, .37, .127);
  shell.lineTo(-.56, .145);
  shell.quadraticCurveTo(-.698, .13, -.707, .06);
  shell.lineTo(-.714, -.13);
  shell.quadraticCurveTo(-.713, -.19, -.68, -.19);
  // The curves above form genuine cutouts, leaving daylight behind the tires.
  mesh(sideShell(shell, .74, .025), pearl, body, 'SUV_Body');

  const cabin = new THREE.Shape();
  cabin.moveTo(-.61, .53);
  cabin.quadraticCurveTo(-.54, .65, -.40, .721);
  cabin.bezierCurveTo(-.28, .775, -.01, .782, .15, .74);
  cabin.quadraticCurveTo(.23, .72, .29, .67);
  cabin.lineTo(.46, .53);
  cabin.closePath();
  mesh(sideShell(cabin, .655, .060), glass, root, 'Panoramic_Roof');
  curve(root, 'Roof_Edge', [[-.255,.754,-.40],[0,.792,-.4],[.255,.754,-.40]], .012, pearl);

  const head = pivot(root, 'Head', [0, 0, 0]);
  const windshield = ellipsoid(head, 'Windshield', glass, [0,.637,.348], [.292,.130,.051]);
  windshield.rotation.x = -.78;
  const eyes = pivot(head, 'Eyes', [0, .655, .386]);
  for (const s of [-1, 1]) {
    const eye = pivot(eyes, s < 0 ? 'Eye_L' : 'Eye_R', [s * .133, 0, 0]);
    eye.rotation.x = -.44;
    ellipsoid(eye, 'Eye_White', white, [0, 0, 0], [.092, .060, .025]);
    ellipsoid(eye, 'Pupil', ink, [0, 0, .023], [.042, .044, .012]);
    ellipsoid(eye, 'Catchlight', white, [-.011, .017, .033], [.011, .012, .004]);
    const brow = ellipsoid(head, s < 0 ? 'Brow_L' : 'Brow_R', alloy,
      [s * .133, .726, .324], [.080, .012, .013]);
    brow.rotation.set(-.44, 0, s * .07);
    pivot(head, s < 0 ? 'Ear_L' : 'Ear_R', [s * .37, .55, .27]);
    ellipsoid(body, 'Mirror_Base', glass, [s * .373, .163, .299], [.055, .024, .035]);
    ellipsoid(body, 'Mirror', pearl, [s * .414, .179, .297], [.048, .031, .060]);
    curve(body, 'Headlight_Housing', [[s*.112,.042,.724],[s*.245,.049,.717],[s*.345,.077,.668]], .023, glass);
    curve(body, 'Ice_Blue_Headlight', [[s*.132,.044,.739],[s*.247,.053,.733],[s*.345,.082,.680]], .013, lamp);
    curve(body, 'Rear_Light', [[s*.164,.080,-.729],[s*.29,.084,-.719],[s*.353,.073,-.677]], .015, red);

    const door = pivot(root, s < 0 ? 'Falcon_L' : 'Falcon_R', [s * .256, .739, -.208]);
    const doorGlass = mesh(new RoundedBoxGeometry(.055, .205, .415, 3, .024), glass, door,
      'Falcon_Glass', [s * .060, -.09, 0]);
    doorGlass.rotation.z = s * .39;
    mesh(new RoundedBoxGeometry(.058, .222, .405, 3, .023), pearl, door,
      'Falcon_White_Panel', [s * .106, -.293, 0]);
    curve(door, 'Door_Upper_Rail', [[s*.021,-.011,-.202],[s*.087,-.14,-.208],[s*.108,-.197,-.193]], .014, pearl);
    ellipsoid(door, 'Flush_Handle', alloy, [s * .138, -.231, .100], [.006, .010, .038]);

    for (const [name, z] of [[s < 0 ? 'Arm_L' : 'Arm_R', .45], [s < 0 ? 'Leg_L' : 'Leg_R', -.46]]) {
      const wheel = pivot(root, name, [s * .331, .153, z]);
      mesh(new THREE.CylinderGeometry(.153, .153, .107, 28), rubber, wheel, 'Tire').rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(.113, .113, .012, 24), ink, wheel, 'Wheel_Dish', [s*.056,0,0]).rotation.z = Math.PI / 2;
      mesh(new THREE.TorusGeometry(.104, .008, 8, 24), alloy, wheel, 'Alloy_Rim', [s*.065,0,0]).rotation.y = Math.PI / 2;
      for (let i = 0; i < 5; i++) {
        const spoke = pivot(wheel, 'Spoke', [s*.064,0,0]);
        spoke.rotation.x = i * Math.PI * 2 / 5;
        ellipsoid(spoke, 'Alloy_Spoke', alloy, [0,.067,0], [.006,.034,.011]);
      }
      ellipsoid(wheel, 'Hubcap', alloy, [s*.070,0,0], [.012,.038,.038]);
    }
  }

  const tail = pivot(root, 'Tail', [0, .657, -.57]);
  mesh(new RoundedBoxGeometry(.57, .033, .12, 3, .015), pearl, tail, 'Rear_Spoiler');
  const badge = pivot(root, 'Bow', [0, .449, .691]);
  curve(badge, 'Hood_Badge', [[-.029,.008,0],[0,.014,.004],[.029,.008,0]], .005, alloy);
  curve(badge, 'Badge_Stem', [[0,.01,0],[0,-.015,.016]], .005, alloy);
  mesh(new RoundedBoxGeometry(.37, .064, .046, 4, .022), glass, body, 'Lower_Intake', [0, -.14, .712]);
  curve(head, 'Smile', [[-.112,.325,.756],[0,.299,.761],[.112,.325,.756]], .010, ink);
  const happy = pivot(head, 'Happy_Mouth', [0, 0, 0]);
  curve(happy, 'Happy_Curve', [[-.13,.341,.755],[0,.290,.764],[.13,.341,.755]], .013, ink);
  happy.visible = false;
  return root;
}
