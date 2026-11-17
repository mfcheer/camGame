"""Project-original beginner phrase/actions and dialogue art. Existing assets are read only.
Explicit drawings for four new verbs; not a generic phrase-to-picture generator.
"""
import math
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PH=ROOT/'public/images/learning-phrases'
DI=ROOT/'public/images/dialogue'

def svg(body,w=256):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="256" viewBox="0 0 {w} 256">{body}</svg>\n'

def source(name):
    text=(ROOT/f'public/images/words/learning/{name}.svg').read_text()
    body=re.search(r'<svg\b[^>]*>(.*)</svg>',text,re.S).group(1)
    return re.sub(r'<(?:title|text)\b[^>]*>.*?</(?:title|text)>','',body,flags=re.S)

def placed(body,x,y,size=100):
    return f'<g transform="translate({x} {y}) scale({size/256})">{body}</g>'

def balls(n=1,color='#ef9555',radius=49):
    def ball(x,y,r):
        return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" stroke="#8f6557" stroke-width="4"/><path d="M{x-r} {y}H{x+r}M{x} {y-r}V{y+r}" fill="none" stroke="#fff0d1" stroke-width="4"/>'
    return ball(128,128,radius) if n==1 else ball(65,128,49)+ball(191,128,49)

def cat():
    return '<g stroke="#99623f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M171 194Q235 191 215 143Q203 124 196 140" fill="none" stroke="#de9e5e" stroke-width="17"/><ellipse cx="120" cy="166" rx="58" ry="55" fill="#efb675"/><ellipse cx="102" cy="178" rx="26" ry="34" fill="#fce3b6"/><path d="M67 89L65 34L104 65M141 65L179 34L176 91" fill="#efb675"/><path d="M74 66L73 48L91 65M155 65L171 48L169 71" fill="#e9a0a1" stroke="none"/><ellipse cx="122" cy="99" rx="61" ry="46" fill="#efb675"/><path d="M100 59L105 77M122 55V76M143 59L138 77" stroke="#bd7d48" stroke-width="7"/><path d="M82 94Q94 84 102 96Q93 104 82 94M141 96Q152 84 163 94Q153 104 141 96" fill="#6a815d"/><path d="M117 108H128L122 115Z" fill="#bb7979"/><path d="M122 115V120L112 123M122 120L133 123M66 110L94 114M154 114L182 110" fill="none"/><path d="M85 203V218H109M139 203V218H164" fill="#efb675"/></g>'

def dog():
    return '<g stroke="#805d48" stroke-width="4" stroke-linejoin="round"><path d="M176 178Q218 161 214 138" fill="none" stroke="#ae825a" stroke-width="16" stroke-linecap="round"/><ellipse cx="126" cy="167" rx="57" ry="54" fill="#cda273"/><ellipse cx="126" cy="178" rx="25" ry="30" fill="#f4dfba"/><ellipse cx="126" cy="96" rx="58" ry="47" fill="#cda273"/><path d="M76 61Q38 53 54 128Q72 151 87 104M176 61Q214 53 198 128Q180 151 165 104" fill="#96704e"/><ellipse cx="106" cy="94" rx="5" ry="7" fill="#463f3d"/><ellipse cx="146" cy="94" rx="5" ry="7" fill="#463f3d"/><ellipse cx="126" cy="117" rx="28" ry="19" fill="#f4dfba"/><path d="M117 108Q126 102 135 108L126 117Z" fill="#463f3d"/><path d="M126 117V125Q138 130 142 121" fill="none"/><path d="M85 202V219H110M142 202V219H167" fill="#cda273"/></g>'

# Rounded child in side view, fixed face and body across eat/drink/kick.
def side_child(arm,legs=None,mouth_open=False):
    legs=legs or '<path d="M88 151L78 211M100 151L119 211" stroke="#5575a6" stroke-width="19"/><path d="M69 215H92M110 215H134" stroke="#58637b" stroke-width="12"/>'
    mouth='<ellipse cx="132" cy="67" rx="6" ry="8" fill="#9c5c55"/>' if mouth_open else '<path d="M128 70h8" stroke="#9c5c55" stroke-width="3"/>'
    return f'<g stroke-linecap="round" stroke-linejoin="round">{legs}<path d="M85 92L95 150" stroke="#67b8ae" stroke-width="39"/><circle cx="102" cy="55" r="30" fill="#ffdab9"/><path d="M72 48Q66 15 97 20Q129 15 132 44L104 37L85 49Z" fill="#72594c"/><path d="M128 49L141 59L130 62" fill="#ffdab9"/><circle cx="119" cy="49" r="3" fill="#49515d"/>{mouth}<path d="{arm}" fill="none" stroke="#ffdab9" stroke-width="15"/></g>'

def action(kind,t):
    # cosine phases guarantee identical geometry at the loop boundary.
    u=(1-math.cos(2*math.pi*t))/2
    ground='<path d="M24 229H232" stroke="#b8d0c5" stroke-width="4" stroke-linecap="round"/>'
    if kind=='eat-an-apple':
        x=180-29*u;y=130-61*u
        # Show the bite after contact while lowering the hand, reset at low position.
        bitten=.5<=t<.94
        apple='<path d="M0 -9C-30 -26 -31 22 -9 28Q0 32 7 28C34 20 28 -26 0 -9Z" fill="#e96b6b" stroke="#b65156" stroke-width="3"/><path d="M0 -9Q-1 -23 8 -26" fill="none" stroke="#816342" stroke-width="4"/><path d="M4 -20Q24 -30 23 -17Q14 -10 4 -20" fill="#83ad66"/>'
        if bitten: apple='<defs><mask id="bite"><rect x="-40" y="-40" width="80" height="80" fill="white"/><circle cx="-20" cy="-7" r="12" fill="black"/></mask></defs><g mask="url(#bite)">'+apple+'</g>'
        return ground+side_child(f'M88 104L132 120L{x} {y+12}',mouth_open=u>.6)+f'<g transform="translate({x} {y})">{apple}</g>'
    if kind=='drink-water':
        x=181-17*u;y=139-75*u;angle=-46*u
        # Rotates around cup lip beside the mouth. Water stays horizontal in world space.
        return ground+side_child(f'M88 104L132 123L{x+10} {y+17}',mouth_open=u>.6)+f'<g transform="translate({x} {y}) rotate({angle})"><path d="M-22 -19H22L17 33H-17Z" fill="#e4f6f9" stroke="#79aebc" stroke-width="3"/><defs><clipPath id="cup-water"><path d="M-19 -15H19L15 29H-15Z"/></clipPath></defs><g clip-path="url(#cup-water)"><g transform="rotate({-angle})"><rect x="-50" y="0" width="100" height="90" fill="#87cbe1"/></g></g></g>'
    if kind=='kick-the-ball':
        # Foot goes from behind to contact at halfway; then ball rolls ahead.
        swing=math.sin(2*math.pi*t-math.pi/2)
        fx=110+35*swing;fy=198-10*u
        bx=170 if t<.5 else 170+45*math.sin((t-.5)*math.pi)
        by=208
        opacity=min(1,t/.125) if t<.5 else max(0,min(1,(.9375-t)/.125))
        legs=f'<path d="M84 151L78 215" stroke="#5575a6" stroke-width="18"/><path d="M100 150L108 175L{fx} {fy}" fill="none" stroke="#5575a6" stroke-width="18"/><path d="M68 219H92M{fx-5} {fy+4}H{fx+15}" stroke="#58637b" stroke-width="12"/>'
        return ground+side_child('M85 103L64 130M92 104L126 123',legs)+f'<g opacity="{opacity}" transform="translate({bx} {by}) rotate({max(0,t-.5)*300})"><circle r="21" fill="#ef9555" stroke="#8f6557" stroke-width="3"/><path d="M-20 0H20M0 -20V20" stroke="#fff0d1" stroke-width="3"/></g>'
    if kind=='hug-the-teddy':
        # Teddy stays grounded in the child's lap; hands wrap around its sides.
        spread=38*(1-u)
        face='<circle cx="128" cy="53" r="29" fill="#ffdab9"/><path d="M100 43Q96 12 128 18Q157 13 157 44L133 33L110 44Z" fill="#72594c"/><circle cx="118" cy="53" r="3" fill="#49515d"/><circle cx="139" cy="53" r="3" fill="#49515d"/><path d="M118 66Q128 76 138 66" fill="none" stroke="#b07769" stroke-width="3"/>'
        return ground+'<g stroke-linecap="round" stroke-linejoin="round"><path d="M107 163L93 215M147 163L163 215" stroke="#5575a6" stroke-width="20"/><path d="M104 90H151L163 173H93Z" fill="#67b8ae"/>'+face+placed(source('teddy'),38,68,180)+f'<path d="M104 103Q{68-spread} 139 {97-spread} 157M151 103Q{188+spread} 139 {159+spread} 157" fill="none" stroke="#ffdab9" stroke-width="15"/></g>'
    raise ValueError(kind)

if __name__=='__main__':
    PH.mkdir(parents=True,exist_ok=True);DI.mkdir(parents=True,exist_ok=True)
    art={
        'red-apple':source('apple'),'yellow-banana':source('banana'),'yellow-duck':source('duck'),
        'red-heart':'<path d="M128 220L41 132C-15 67 65 4 128 68C191 4 271 67 215 132Z" fill="#ed6a73" stroke="#b84e5d" stroke-width="5"/>',
        'blue-circle':'<circle cx="128" cy="128" r="93" fill="#70b6e3" stroke="#4e86ba" stroke-width="5"/>',
        'two-cats':placed(cat(),0,28,130)+placed(cat(),126,28,130),
        'two-balls':balls(2),
        'three-apples':placed(source('apple'),79,5,98)+placed(source('apple'),15,127,98)+placed(source('apple'),143,127,98)
    }
    for name,body in art.items():(PH/f'{name}.svg').write_text(svg(body))
    for name in ['eat-an-apple','drink-water','kick-the-ball','hug-the-teddy']:
        (PH/f'{name}.svg').write_text(svg(action(name,.5)))
        # Scope per-frame definitions to prevent duplicate mask/filter IDs.
        frames=[]
        for i in range(16):
            body=action(name,i/16)
            ids=re.findall(r'id="([^"]+)"',body)
            for id_ in ids:body=body.replace(f'id="{id_}"',f'id="f{i}_{id_}"').replace(f'url(#{id_})',f'url(#f{i}_{id_})')
            frames.append(f'<g transform="translate({i*256} 0)">{body}</g>')
        (PH/f'{name}-motion.svg').write_text(svg(''.join(frames),4096))
    dialogue={'cat':cat(),'dog':dog(),'red':'<circle cx="128" cy="128" r="90" fill="#ed6a73"/>','blue':'<circle cx="128" cy="128" r="90" fill="#70b6e3"/>',
              'red-ball':'<circle cx="128" cy="128" r="82" fill="#ed6a73" stroke="#bc5260" stroke-width="5"/><ellipse cx="100" cy="99" rx="22" ry="13" fill="#f28b92"/>','blue-ball':'<circle cx="128" cy="128" r="82" fill="#70b6e3" stroke="#4e86ba" stroke-width="5"/><ellipse cx="100" cy="99" rx="22" ry="13" fill="#96c9eb"/>','one-ball':balls(),'two-balls':balls(2),
              'apples':source('apple'),'bananas':source('banana'),'milk':source('milk'),'water':source('water')}
    for name,body in dialogue.items():(DI/f'{name}.svg').write_text(svg(body))
