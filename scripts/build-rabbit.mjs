import fs from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createRabbitModel } from '../src/rabbitModel.js';
import { createCatModel } from '../src/catModel.js';
import { createFrogModel } from '../src/frogModel.js';
import { createGoldenDragonModel } from '../src/goldenDragonModel.js';
import { createDragonModel } from '../src/dragonModel.js';
import { createDogModel } from '../src/dogModel.js';
// GLTFExporter uses the browser FileReader interface for binary output.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => {this.result=result;this.onloadend?.();}); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => {this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();}); }
};
for(const [name,factory] of [['forest-bunny',createRabbitModel],['marmalade-cat',createCatModel],['pond-frog',createFrogModel],['sunny-puppy',createDogModel],['jade-dragon',createDragonModel],['golden-dragon',createGoldenDragonModel]]) {
  const result=await new GLTFExporter().parseAsync(factory(),{binary:true,onlyVisible:false});
  await fs.writeFile(new URL(`../public/models/${name}.glb`,import.meta.url),Buffer.from(result));
  console.log(`Exported ${name}.glb: ${Math.round(result.byteLength/1024)} KB`);
}
