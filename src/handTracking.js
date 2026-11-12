// All interaction anchors use Hand Landmarker #8. Wrists only associate hands
// with already selected bodies; they never become collision points.
export function mapVideoPoint(point,videoW,videoH,screenW,screenH) {
  const mirroredX=1-point.x;
  if(!videoW||!videoH)return {x:mirroredX,y:point.y};
  const scale=Math.max(screenW/videoW,screenH/videoH);
  return {x:(mirroredX*videoW*scale-(videoW*scale-screenW)/2)/screenW,y:(point.y*videoH*scale-(videoH*scale-screenH)/2)/screenH};
}
export class HandAssociator {
  constructor(){this.previous=new Map();}
  reset(){this.previous.clear();}
  assign(players,result,map,timestamp) {
    const slots=[];
    for(const p of players) {
      p.hands=[];
      for(const side of ['left','right']) {
        const wrist=p.wrists?.find(w=>w.side===side);
        const old=this.previous.get(`${p.id}_${side}`);
        slots.push({player:p,side,wrist,old:old&&timestamp-old.timestamp<250?old:null,key:`${p.id}_${side}`});
      }
    }
    const candidates=[];
    for(const [index,lm] of (result?.landmarks||[]).entries()) {
      if(!lm[0]||!lm[8]||!lm[5]||!lm[17])continue;
      if(![lm[0],lm[8],lm[5],lm[17]].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))continue;
      // Do not clamp an out-of-camera tip into a valid on-screen target.
      if(lm[8].x<0||lm[8].x>1||lm[8].y<0||lm[8].y>1)continue;
      const tip=map(lm[8]),wrist=map(lm[0]);
      if(tip.x<0||tip.x>1||tip.y<0||tip.y>1)continue;
      const palm=Math.hypot(lm[5].x-lm[17].x,lm[5].y-lm[17].y);
      if(palm<.008||palm>.45)continue;
      candidates.push({index,tip,wrist,z:lm[8].z||0,label:result.handedness?.[index]?.[0]?.categoryName});
    }
    const pairs=[];
    for(const c of candidates)for(const s of slots) {
      const current=s.wrist?Math.hypot(c.wrist.x-s.wrist.x,c.wrist.y-s.wrist.y):Infinity;
      const temporal=s.old?Math.hypot(c.wrist.x-s.old.x,c.wrist.y-s.old.y):Infinity;
      if(current>.28&&temporal>.16)continue;
      pairs.push({c,s,cost:Math.min(current,temporal+.025)});
    }
    pairs.sort((a,b)=>a.cost-b.cost);
    const usedHands=new Set(),usedSlots=new Set();
    const accept=(c,s)=>{
      usedHands.add(c.index);usedSlots.add(s.key);
      s.player.hands.push({side:s.side,x:c.tip.x,y:c.tip.y,z:c.z,isIndexTip:true,source:'hand-21',observed:true});
      this.previous.set(s.key,{...c.wrist,timestamp});
    };
    for(const {c,s} of pairs)if(!usedHands.has(c.index)&&!usedSlots.has(s.key))accept(c,s);
    // A single selected body can still use a fully detected hand when the pose
    // wrist is occluded. Multi-person ambiguity is deliberately not guessed.
    if(players.length===1)for(const c of candidates)if(!usedHands.has(c.index)) {
      const options=slots.filter(s=>!usedSlots.has(s.key)&&!s.wrist);
      options.sort((a,b)=>Math.abs((a.wrist?.x??a.player.centerX)-c.wrist.x)-Math.abs((b.wrist?.x??b.player.centerX)-c.wrist.x));
      if(options[0]&&Math.abs(c.wrist.x-players[0].centerX)<.38)accept(c,options[0]);
    }
    for(const [key,old] of this.previous)if(timestamp-old.timestamp>250)this.previous.delete(key);
    return players;
  }
}
