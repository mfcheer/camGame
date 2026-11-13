import assert from 'node:assert/strict';
import {getViewport} from '../src/viewport.js';
import * as T from 'three';
import {BubbleManager} from '../src/bubbleManager.js';
import {Game} from '../src/main.js';
const original=globalThis.window;const results=[];
try{
 globalThis.window={innerWidth:390,innerHeight:844,visualViewport:{width:390,height:620,scale:1,offsetTop:10,offsetLeft:0}};
 assert.deepEqual(getViewport(),{width:390,height:620,top:10,left:0});results.push('Browser-bar height and visible origin drive the viewport');
 window.visualViewport.scale=2;assert.equal(getViewport().height,844);results.push('Pinch zoom does not shrink the game layout under the fingers');
 let randomizations=0;
 const game=Object.assign(Object.create(Game.prototype),{sceneManager:{randomizeStage(){randomizations++;}},bubbleManager:{clear(){},spawnNext(){}},poseDetector:{resume(){}},state:'PAUSED'});
 game.handleRestart();assert.equal(randomizations,1);assert.equal(game.state,'PLAYING');results.push('Each restarted round randomises its scenery exactly once');
 for(const [width,height]of [[568,260],[667,240]]){
  globalThis.window={innerWidth:width,innerHeight:height};const c=new T.PerspectiveCamera(48,width/height,.1,100);c.position.z=7.5;c.updateMatrixWorld();const bm=new BubbleManager(new T.Scene(),c,{},null);
  for(let i=0;i<15;i++){bm.clear();bm.createBubble(i);const g=bm.activeBubble.group;g.scale.setScalar(1.25*1.13);g.updateWorldMatrix(true,true);g.traverse(o=>{if(!o.isMesh||!o.visible)return;const a=o.geometry.attributes.position;for(let j=0;j<a.count;j++){const p=new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(o.matrixWorld).project(c);assert.ok(p.x>=-1&&p.x<=1&&p.y>=-1&&p.y<=1,`${width}x${height} expanded bubble clipped`);}});}
  bm.clear();
 }
 results.push('Expanded bubble rims stay visible in 240px and 260px short landscape viewports');
}finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
console.log(JSON.stringify({passed:results.length,results},null,2));
