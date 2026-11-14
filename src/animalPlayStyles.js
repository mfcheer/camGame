// Motion is expressed in CSS pixels, independent of viewport orientation and DPR.
export const ANIMAL_PLAY_STYLES = {
  bunny: {name:'安稳入门', motion:'still', amplitudeX:0, amplitudeY:0, size:1.08, period:5, comboMs:1500, cooldownMs:900, jellyAt:[], rainbowAt:[], hint:'大泡泡等你，慢慢来也可以'},
  frog: {name:'荷叶弹跳', motion:'hop', amplitudeX:0, amplitudeY:24, size:1.02, period:3.6, comboMs:2200, cooldownMs:950, jellyAt:[2], rainbowAt:[], hint:'等泡泡落稳，再伸手碰一碰'},
  cat: {name:'慢漂追踪', motion:'drift', amplitudeX:20, amplitudeY:6, size:1, period:6.8, comboMs:2100, cooldownMs:900, jellyAt:[3], rainbowAt:[], hint:'慢慢跟随，靠近泡泡它会停住'},
  dog: {name:'轻快连击', motion:'bounce', amplitudeX:13, amplitudeY:10, size:1, period:2.8, comboMs:2400, cooldownMs:700, jellyAt:[4], rainbowAt:[], hint:'轻快连戳，连击会亮起彩虹'},
  dragon: {name:'云间弧线', motion:'arc', amplitudeX:27, amplitudeY:17, size:.98, period:5.6, comboMs:2200, cooldownMs:900, jellyAt:[2,6], rainbowAt:[4], hint:'跟着云间弧线，遇见不同泡泡'},
  goldenDragon: {name:'祥云游动', motion:'serpentine', amplitudeX:22, amplitudeY:11, size:1, period:7, comboMs:2300, cooldownMs:950, jellyAt:[3], rainbowAt:[1,5], hint:'跟随祥云，慢慢画出一条曲线'},
  peppa:{name:'快乐跳跳',motion:'hop',amplitudeX:0,amplitudeY:14,size:1.07,period:4.4,comboMs:2300,cooldownMs:900,jellyAt:[2],rainbowAt:[],hint:'和佩奇蹦蹦跳，像踩泥坑一样开心'},
  thomas:{name:'快乐列车',motion:'drift',amplitudeX:14,amplitudeY:3,size:1.05,period:6.4,comboMs:2300,cooldownMs:900,jellyAt:[3],rainbowAt:[],hint:'跟着托马斯一起寻找泡泡'},
  chase:{name:'勇敢巡逻',motion:'bounce',amplitudeX:10,amplitudeY:7,size:1.05,period:3.8,comboMs:2400,cooldownMs:850,jellyAt:[3],rainbowAt:[],hint:'阿奇敬礼出发，跟着巡逻节奏找泡泡'},
  jett:{name:'天空飞行',motion:'arc',amplitudeX:17,amplitudeY:10,size:1.04,period:6.1,comboMs:2300,cooldownMs:900,jellyAt:[3],rainbowAt:[5],hint:'乐迪来啦！跟着飞行弧线冲上云霄'},
  mcqueen:{name:'闪电赛道',motion:'drift',amplitudeX:16,amplitudeY:5,size:1.05,period:5.8,comboMs:2300,cooldownMs:850,jellyAt:[3],rainbowAt:[5],hint:'和麦昆一起追逐泡泡'},
  wolf:{name:'狼王追逐',motion:'bounce',amplitudeX:16,amplitudeY:8,size:1.02,period:3.4,comboMs:2300,cooldownMs:800,jellyAt:[3],rainbowAt:[5],hint:'和灰太狼大王一起追逐泡泡'},
  teddy:{name:'温暖抱抱',motion:'drift',amplitudeX:9,amplitudeY:4,size:1.07,period:7.2,comboMs:2300,cooldownMs:950,jellyAt:[2],rainbowAt:[],hint:'慢慢伸手，和抱抱一起玩'}
};
export function getAnimalPlayStyle(id) { return ANIMAL_PLAY_STYLES[id] || ANIMAL_PLAY_STYLES.bunny; }

export function animalTargetOffset(style, elapsed, index) {
  // The first target teaches the same gesture in every animal's round.
  if (index === 0 || elapsed <= .4) return {x:0, y:0};
  const t = elapsed - .4, phase = t / style.period * Math.PI * 2;
  const entrance = Math.min(1, t / .6);
  let x = 0, y = 0;
  switch (style.motion) {
    case 'hop': { // Over two seconds of rest between small, readable hops.
      const p = (t % style.period) / style.period;
      if (p > .66) y = -style.amplitudeY * Math.sin((p - .66) / .34 * Math.PI);
      break;
    }
    case 'drift': x = style.amplitudeX * Math.sin(phase); y = style.amplitudeY * Math.sin(phase * .5); break;
    case 'bounce': x = style.amplitudeX * Math.sin(phase); y = -style.amplitudeY * Math.abs(Math.sin(phase)); break;
    case 'arc': x = style.amplitudeX * Math.sin(phase); y = -style.amplitudeY * (1 - Math.cos(phase)) / 2; break;
    case 'serpentine': x = style.amplitudeX * Math.sin(phase); y = style.amplitudeY * Math.sin(phase * 2); break;
  }
  return {x:x * entrance, y:y * entrance};
}
