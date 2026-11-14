import fs from 'node:fs/promises';
const c=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const rect=(x,y,w,h,fill,rx=8,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const face=(active='face')=>{
 const highlight=(part,d)=>active===part?path(d,'none','stroke="#f6a938" stroke-width="11" stroke-linecap="round"'):'';
 return `<g stroke="#755442" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${c(128,134,73,'#ffd9b3')}${path('M55 111 Q54 32 128 35 Q202 31 201 111 Q186 104 175 80 Q139 101 77 88 Q68 102 55 111','#805b45')}${c(53,137,13,'#ffd9b3')}${c(203,137,13,'#ffd9b3')}${c(100,128,5,'#445955')}${c(156,128,5,'#445955')}${path('M126 133 q-5 14 5 14','none')}${path('M105 161 Q128 182 151 161','none','stroke-width="6"')}${highlight('face','M58 133 A70 70 0 1 0 198 133')}${highlight('eye','M83 129 Q99 109 115 129')}${highlight('ear','M40 120 Q28 137 42 154 M216 120 Q228 137 214 154')}${highlight('mouth','M101 160 Q128 188 155 160')}${highlight('nose','M119 130 Q113 151 137 150')}${highlight('hair','M56 108 Q54 32 128 35 Q201 30 201 108')}</g>`;
};
const colors={pink:'#f58cb3',white:'#fffdf9',black:'#333f43',brown:'#986442'};
const art={
 star:path('M128 31 L150 95 L217 95 L163 134 L184 201 L128 160 L72 201 L93 134 L39 95 L106 95 Z','#ffdb67'),
 heart:path('M128 208 C107 190 40 149 40 100 C40 56 94 45 128 81 C162 45 216 56 216 100 C216 149 149 190 128 208 Z','#f58c9e'),
 oval:'<ellipse cx="128" cy="126" rx="66" ry="96" fill="#fffdf7" stroke="#3b625b" stroke-width="11"/>',
 eraser:`<g transform="rotate(-18 128 128)">${rect(52,80,152,96,'#f596ad',20)}${path('M52 139 H204 V157 Q204 176 185 176 H71 Q52 176 52 157 Z','#f4eee3')}${line(52,139,204,139)}</g>`,
 ruler:`<g transform="rotate(-23 128 128)">${rect(31,91,194,74,'#f4c15d',10)}${[57,81,105,129,153,177,201].map((x,i)=>line(x,93,x, i%2?111:123)).join('')}</g>`,
 schoolbag:`${rect(58,60,140,151,'#78b5cb',30)}${path('M91 62 Q94 25 128 25 Q162 25 165 62','none','stroke-width="10"')}${rect(80,130,96,63,'#a4d7df',16)}${path('M112 132 v18 h32 v-18','#f4c96a')}`,
 scissors:`${c(77,172,25,'none','stroke="#e47c7a" stroke-width="12"')}${c(165,172,25,'none','stroke="#e47c7a" stroke-width="12"')}${path('M95 153 L182 47 L158 136 Z','#c3d6d7')}${path('M147 153 L65 47 L85 137 Z','#e5eeeb')}${c(121,132,8,'#6b827c')}`,
 puzzle:path('M52 62 H99 C92 42 112 29 128 40 C136 45 138 54 134 62 H204 V111 C222 103 235 116 229 129 C224 140 214 143 204 138 V194 H146 C154 212 143 226 128 224 C113 222 105 210 112 194 H52 V137 C33 145 21 132 27 119 C31 109 42 106 52 111 Z','#76c4aa'),
 balloon:`<ellipse cx="128" cy="96" rx="63" ry="75" fill="#f28f9e"/>${path('M118 169 L108 182 H148 L138 169','#e77b8b')}${path('M128 183 Q104 206 132 229','none')}${path('M92 67 Q100 49 116 47','none','stroke="#fff9ee" stroke-width="8"')}`,
 slide:`${path('M47 202 L55 70 H78 L86 202 M64 95 H80 M62 127 H82 M60 159 H84','none','stroke-width="10"')}${path('M76 69 H102 Q114 149 205 178 L205 205 Q97 187 76 116 Z','#f2b85d')}${path('M96 70 Q119 146 203 171','none','stroke="#f7d883" stroke-width="9"')}`,
 swing:`${path('M58 216 L90 43 H166 L198 216 M128 43 V153 M162 43 V153','none','stroke-width="9"')}${rect(112,153,68,18,'#d99f67',5)}`,
 duck:`${c(108,139,55,'#f6ce5d')}${c(151,95,39,'#f6ce5d')}${path('M183 96 L222 109 L184 118 Z','#ed9954')}${c(161,87,5,'#354e49')}${path('M63 141 Q97 112 134 144 Q115 176 79 169','#f9e49c')}`,
 sheep:`${c(128,125,60,'#f9f8ee')}${[[-45,-26],[-13,-55],[25,-51],[53,-20],[-52,13],[49,20],[22,48],[-18,49]].map(([x,y])=>c(128+x,125+y,25,'#f9f8ee')).join('')}${c(128,128,39,'#997c70')}${c(114,122,4,'#374c48')}${c(142,122,4,'#374c48')}${path('M118 145 Q128 153 138 145','none')}`,
 rabbit:`<ellipse cx="91" cy="61" rx="22" ry="49" fill="#f8f6ed"/><ellipse cx="165" cy="61" rx="22" ry="49" fill="#f8f6ed"/>${c(128,147,69,'#f8f6ed')}${c(102,137,5,'#41544e')}${c(154,137,5,'#41544e')}${path('M119 153 Q128 164 137 153','#eda2a1')}${path('M112 171 Q128 183 144 171','none')}`,
 frog:`${c(128,143,71,'#8bc894')}${c(79,88,25,'#8bc894')}${c(177,88,25,'#8bc894')}${c(79,88,10,'#fffdf7')}${c(177,88,10,'#fffdf7')}${c(79,88,4,'#334d46')}${c(177,88,4,'#334d46')}${path('M97 164 Q128 186 159 164','none','stroke-width="7"')}`,
 weather:`${c(86,83,32,'#f8cb63')}${[0,45,90,135,180,225,270,315].map(a=>`<g transform="rotate(${a} 86 83)">${line(86,35,86,24)}</g>`).join('')}${path('M77 176 Q51 174 51 150 Q51 128 75 123 Q81 94 111 94 Q138 94 148 117 Q174 112 185 135 Q198 165 171 175 Z','#e7f0ef')}${path('M94 190 l-8 17 M133 190 l-8 17 M164 190 l-8 17','none','stroke="#75b6d1" stroke-width="8"')}`,
 one:`${rect(49,35,158,184,'#f7f2e5',26)}<text x="128" y="177" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="150" fill="#557f74" stroke="none">1</text>`,
 happy:face('face').replace('M105 161 Q128 182 151 161','M100 156 Q128 194 156 156').replace('M83 129 Q99 109 115 129','M83 129 Q99 109 115 129'),face:face('face'),eye:face('eye'),ear:face('ear'),mouth:face('mouth'),nose:face('nose'),hair:face('hair')
};
for(const [id,color] of Object.entries(colors))art[id]=c(128,126,91,color,'stroke="#668078" stroke-width="4"');
for(const [id,body] of Object.entries(art)){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512"><title>${id}</title><g stroke="#55706c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>\n`;
 await fs.writeFile(`public/images/words/learning/${id}.svg`,svg);
}
console.log(`Wrote ${Object.keys(art).length} illustrations`);
