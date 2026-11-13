import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { test } from 'node:test';
import { createCatModel } from '../src/catModel.js';
import { createRabbitModel, getRabbitRig } from '../src/rabbitModel.js';
import { RescueAnimal } from '../src/rescueAnimal.js';

test('QA-20: 猫咪形象加菲猫重构与兔子圆润萌化验证', async (t) => {
  await t.test('1. 加菲猫 3D 模型特征与节点规范验证 (catModel.js & GLB)', () => {
    const cat = createCatModel();
    assert.equal(cat.name, 'Marmalade_Rig');
    const rig = getRabbitRig(cat);
    assert.ok(rig.headGroup, 'Head group must exist');
    assert.ok(rig.bodyMesh, 'Torso group must exist');
    assert.ok(rig.leftEarGroup && rig.rightEarGroup, 'Ear groups must exist');
    assert.ok(rig.leftEye && rig.rightEye, 'Eye groups must exist');
    assert.ok(rig.leftArm && rig.rightArm, 'Arm groups must exist');
    assert.ok(rig.leftLeg && rig.rightLeg, 'Leg groups must exist');
    assert.ok(rig.tailGroup, 'Tail group must exist');

    // 检查加菲猫双球胡须垫与雀斑点
    const whiskerPads = [];
    const whiskerDots = [];
    cat.traverse(o => {
      if (o.name === 'Whisker_Pad') whiskerPads.push(o);
      if (o.name === 'Whisker_Dot') whiskerDots.push(o);
    });
    assert.equal(whiskerPads.length, 2, 'Must have twin cream whisker pads');
    assert.ok(whiskerDots.length >= 6, 'Must have Garfield whisker freckle dots');

    // 检查耳朵小巧圆润并贴合头颅（z 坐标靠近顶部中轴，非突兀后悬）
    const earL = rig.leftEarGroup;
    assert.ok(earL.position.z >= 0, 'Ear should sit on upper-middle skull, not stuck far behind');
    assert.ok(earL.position.y >= 0.20, 'Ear base sits on upper head contour');

    // 检查 GLB 导出完整性与必要节点
    const b = fs.readFileSync(new URL('../public/models/marmalade-cat.glb', import.meta.url));
    assert.equal(b.toString('ascii', 0, 4), 'glTF');
    const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)).trim());
    const nodeNames = new Set(json.nodes.map(n => n.name));
    for (const req of ['Pointed_Ear', 'Inner_Ear', 'Almond_Iris', 'Grounded_Forepaw', 'Cat_Heart_Nose', 'Whisker_Pad', 'Whisker_Dot']) {
      assert.ok(nodeNames.has(req), `GLB missing node: ${req}`);
    }
  });

  await t.test('2. 治愈系萌兔 3D 模型特征与圆润兔耳验证 (rabbitModel.js & GLB)', () => {
    const bunny = createRabbitModel();
    assert.equal(bunny.name, 'Bunny_Rig');
    const rig = getRabbitRig(bunny);
    assert.ok(rig.headGroup, 'Head group must exist');
    assert.ok(rig.bodyMesh, 'Torso group must exist');
    assert.ok(rig.leftEarGroup && rig.rightEarGroup, 'Ear groups must exist');

    // 检查粉嫩腮红与胖乎乎脸颊
    const cheekL = bunny.getObjectByName('Cheek_L');
    const cheekR = bunny.getObjectByName('Cheek_R');
    assert.ok(cheekL && cheekR, 'Cheek blush ovals must exist');
    assert.ok(bunny.getObjectByName('Cotton_Tail'), 'Cotton tail must exist');

    // 检查 GLB 导出完整性
    const b = fs.readFileSync(new URL('../public/models/forest-bunny.glb', import.meta.url));
    assert.equal(b.toString('ascii', 0, 4), 'glTF');
    const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)).trim());
    const nodeNames = new Set(json.nodes.map(n => n.name));
    for (const req of ['Outer_Ear', 'Inner_Ear', 'Cheek_L', 'Cheek_R', 'Cotton_Tail', 'Catchlight']) {
      assert.ok(nodeNames.has(req), `Bunny GLB missing node: ${req}`);
    }
  });

  await t.test('3. 动态骨骼交互与表情系统驱动验证 (RescueAnimal runtime)', () => {
    const camera = new T.PerspectiveCamera(48, 16 / 9, 0.1, 100);
    camera.position.z = 7.5;
    const scene = new T.Scene();

    // 加菲猫运行态：肢体动画、微笑、四足站姿
    const cat = new RescueAnimal(scene, camera, 'cat');
    cat.setEnergy(1);
    cat.update(0.1, 0.1);
    assert.ok(cat.expressionRig, 'Expression rig created');
    cat.setQuadrupedPosture(1);
    const pawBox = new T.Box3().setFromObject(cat.model.getObjectByName('Grounded_Forepaw'));
    assert.ok(pawBox.min.y > cat.groundY - 0.12, 'Forepaw bounds within ground safety limit');

    // 兔子运行态：起跳、软萌表情响应
    const bunny = new RescueAnimal(scene, camera, 'bunny');
    bunny.setEnergy(2);
    bunny.update(0.1, 0.1);
    assert.equal(bunny.state, 'TRAPPED');
    bunny.reset();
    assert.equal(bunny.emotion, 'content');
  });
});
