import { SphereGeometry } from 'three';
import { mesh } from './rabbitModel.js';

// Vehicle details reuse the same vertex buffer in the exported GLB.
const rounded = new SphereGeometry(1, 32, 24);

export function vehicleEllipsoid(parent, name, material, position, scale) {
  return mesh(rounded, material, parent, name, position, scale);
}
