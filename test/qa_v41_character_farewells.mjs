import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RescueAnimal,ANIMAL_MODELS} from '../src/rescueAnimal.js';

function makeAnimal(id) {
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(48,1194/834,.1,100);
  camera.position.z=7.5;camera.updateMatrixWorld();
  return new RescueAnimal(scene,camera,id);
}

function stepTo(animal,seconds) {
  while(animal.escapeElapsed<seconds && animal.state!=='ESCAPED')animal.update(1/60,animal.escapeElapsed);
}

test('all friends reach their own farewell and finish before the five second result',()=>{
  const signatures=new Map();
  for(const id of Object.keys(ANIMAL_MODELS)) {
    const animal=makeAnimal(id);let reached=0;
    animal.onReachedExit=()=>reached++;
    animal.startFriendPlay();animal.startEscape();
    stepTo(animal,3.58);
    assert.equal(animal.state,'WAVING',`${id} should reach the farewell`);
    assert.equal(reached,1,`${id} should trigger the exit cue once`);
    const parts=[animal.animalGroup.position.y-animal.groundY,animal.animalGroup.rotation.z,
      animal.model.rotation.z,animal.bodyMesh.rotation.z,animal.headGroup.rotation.x,
      animal.headGroup.rotation.z,animal.leftArm.rotation.z,animal.rightArm.rotation.z,
      animal.leftEarGroup.rotation.z,animal.tailGroup.rotation.z];
    assert.ok(parts.every(Number.isFinite),`${id} should have a valid pose`);
    signatures.set(id,parts.map(n=>Math.round(n*100)).join(','));
    stepTo(animal,4.5);
    assert.equal(animal.state,'ESCAPED',`${id} should clear the stage`);
    assert.equal(reached,1,`${id} should not repeat the cue`);
  }
  assert.ok(new Set(signatures.values()).size>=15,'most characters should have distinct visible silhouettes');
});

test('vehicles keep their wheels neutral and Thomas keeps his face attached',()=>{
  for(const id of ['mcqueen','thomas','excavator','tayo']) {
    const animal=makeAnimal(id),rest=animal.headRestPosition.clone();
    animal.startFriendPlay();animal.startEscape();stepTo(animal,3.58);
    assert.equal(animal.leftArm.rotation.z,0,`${id} should not wave a wheel`);
    assert.equal(animal.rightArm.rotation.z,0,`${id} should not wave a wheel`);
    if(id==='thomas')assert.ok(animal.headGroup.position.distanceTo(rest)<.002,'Thomas face must stay attached');
  }
});
