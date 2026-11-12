import assert from 'node:assert/strict';
import {getViewport} from '../src/viewport.js';
import {Game} from '../src/main.js';
const original=globalThis.window;const results=[];
try{
 globalThis.window={innerWidth:390,innerHeight:844,visualViewport:{width:390,height:620,scale:1,offsetTop:10,offsetLeft:0}};
 assert.deepEqual(getViewport(),{width:390,height:620,top:10,left:0});results.push('Browser-bar height and visible origin drive the viewport');
 window.visualViewport.scale=2;assert.equal(getViewport().height,844);results.push('Pinch zoom does not shrink the game layout under the fingers');
 let randomizations=0;
 const game=Object.assign(Object.create(Game.prototype),{sceneManager:{randomizeStage(){randomizations++;}},bubbleManager:{clear(){},spawnNext(){}},poseDetector:{resume(){}},state:'PAUSED'});
 game.handleRestart();assert.equal(randomizations,1);assert.equal(game.state,'PLAYING');results.push('Each restarted round randomises its scenery exactly once');
}finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
console.log(JSON.stringify({passed:results.length,results},null,2));
