// Improve the existing editable vector library without re-encoding low-resolution PNGs.
import fs from 'node:fs/promises';
import {WORDS_LIST} from '../src/wordsConfig.js';
const dir='public/images/words/learning';
await fs.mkdir(dir,{recursive:true});
const colors={red:'#E74547',yellow:'#F6CA35',blue:'#3986E7',green:'#42AA68',purple:'#975ACB'};
for(const word of WORDS_LIST){
  if(['teacher','circle','orange'].includes(word.id))continue; // Preserve dedicated, deliberately distinct art.
  try{await fs.access(`public/images/words/items/${word.id}.svg`);}catch{continue;} // Book art has its own sources.
  let svg;
  if(word.category==='colors'||word.category==='shapes'){
    const color=colors[word.id]||word.accent;
    const geometry=word.category==='colors'||word.id==='circle'?'<circle cx="128" cy="126" r="91"/>':
      word.id==='square'?'<rect x="43" y="41" width="170" height="170" rx="3"/>':
      word.id==='rectangle'?'<rect x="23" y="67" width="210" height="126" rx="3"/>':
      '<path d="M128 29 L237 218 H19 Z"/>';
    svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512"><title>${word.word}</title><defs><linearGradient id="fill" x2=".3" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}"/></linearGradient><filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#233f30" flood-opacity=".12"/></filter></defs><g fill="url(#fill)" stroke="${word.id==='yellow'?'#B58018':'#284C45'}" stroke-opacity=".5" stroke-width="4" stroke-linejoin="round" filter="url(#soft)">${geometry}</g></svg>`;
  }else{
    svg=await fs.readFile(`public/images/words/items/${word.id}.svg`,'utf8');
    svg=svg.replace('viewBox="0 0 256 256" width="256" height="256"','viewBox="24 24 208 208" width="512" height="512"');
    svg=svg.replace('dy="8" stdDeviation="8"','dy="4" stdDeviation="3"').replace('flood-opacity="0.25"','flood-opacity="0.14"');
    // Replace flat body tones with gentle volume while keeping the recognizable source shapes.
    const fills=[...svg.matchAll(/fill="(#[A-Fa-f0-9]{6})"/g)].map(m=>m[1]);
    const counts=new Map();for(const fill of fills)counts.set(fill,(counts.get(fill)||0)+1);
    const palette=[...counts.keys()].filter(c=>!['#FFFFFF','#F8F9F9','#2C3E50','#263238'].includes(c.toUpperCase()));
    let gradients='';
    palette.forEach((color,i)=>{gradients+=`<linearGradient id="tone${i}" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".82"/></linearGradient>`;svg=svg.replaceAll(`fill="${color}"`,`fill="url(#tone${i})"`);});
    svg=svg.replace('<defs>','<title>'+word.word+'</title><defs>'+gradients);
  }
  await fs.writeFile(`${dir}/${word.id}.svg`,svg.split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
}
console.log('Refreshed 20 native learning illustrations.');
