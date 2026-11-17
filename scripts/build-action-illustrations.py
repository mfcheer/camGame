"""Original project vector illustrations; deterministic 16-frame action sheets."""
import math
from pathlib import Path
out=Path('public/images/learning-phrases')
N=16

def scene(kind,t):
    p=2*math.pi*t
    ground='<path d="M20 211H236" stroke="#b1c7b9" stroke-width="5" stroke-linecap="round"/>'
    if kind=='bounce-the-ball':
        y=183-76*abs(math.sin(p/2)); hand=65+14*math.sin(p/2)**2
        return ground+f'<ellipse cx="128" cy="211" rx="29" ry="5" fill="#bbd6c9"/><g transform="translate(0 {y})"><circle cx="128" r="28" fill="#ef9555"/><path d="M100 0H156M128 -28V28M108 -20Q143 0 108 20" fill="none" stroke="#a75834" stroke-width="3"/></g><path d="M83 27L91 {hand-12}Q94 {hand} 108 {hand}H149Q164 {hand} 155 {hand+10}H111Q83 {hand+11} 78 {hand-5}L65 30" fill="#ffd6b2" stroke="#b47a58" stroke-width="4" stroke-linejoin="round"/>'
    if kind in ('move-the-car','move-the-train'):
        x=25+75*(1-math.cos(p))/2
        body=('<rect x="0" y="139" width="120" height="48" rx="14" fill="#ed6570"/><path d="M25 139L40 111H83L103 139" fill="#84cce3" stroke="#b94258" stroke-width="5"/>' if kind=='move-the-car' else '<rect x="0" y="129" width="60" height="58" rx="6" fill="#54a48b"/><rect x="65" y="149" width="57" height="38" rx="8" fill="#ec9a48"/><rect x="10" y="139" width="34" height="23" rx="4" fill="#c1e9f2"/><path d="M70 147V125H86V147" fill="#ed6570"/>')
        return ground+f'<g transform="translate({x} 0)">{body}<circle cx="23" cy="190" r="17" fill="#435168"/><circle cx="100" cy="190" r="17" fill="#435168"/><path d="M24 25L36 93Q54 98 55 107Q56 116 44 116H25Q13 116 10 102L3 30" fill="#ffd6b2" stroke="#b47a58" stroke-width="4"/></g>'
    # Side view: seated rider, hands on bars, alternating bent legs on pedals.
    a=(130+17*math.cos(p),177+17*math.sin(p)); b=(130-17*math.cos(p),177-17*math.sin(p))
    return ground+''.join(f'<g transform="translate({x} 177) rotate({t*360})"><circle r="31" fill="#fff" stroke="#435168" stroke-width="6"/><path d="M-29 0H29M0 -29V29" stroke="#a9c6d3" stroke-width="3"/></g>' for x in [56,202])+f'<path d="M56 177L94 128L130 177H56M94 128H171L130 177M171 128L202 177M171 128L165 108H185" fill="none" stroke="#eb677a" stroke-width="6" stroke-linejoin="round"/><path d="M81 123H107" stroke="#435168" stroke-width="8" stroke-linecap="round"/><path d="M107 113L140 139L{b[0]} {b[1]}" fill="none" stroke="#435b86" stroke-width="13" stroke-linecap="round"/><path d="M105 112L120 68L156 102L178 108" fill="none" stroke="#62bcb0" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><circle cx="126" cy="43" r="20" fill="#ffd6b2"/><path d="M103 37Q105 11 130 19Q149 20 149 37Z" fill="#f3af49"/><circle cx="137" cy="44" r="2.5" fill="#435168"/><path d="M107 113L101 149L{a[0]} {a[1]}" fill="none" stroke="#5274ad" stroke-width="13" stroke-linecap="round"/><path d="M{a[0]-8} {a[1]+4}h19M{b[0]-8} {b[1]+4}h19" stroke="#ed9555" stroke-width="7" stroke-linecap="round"/>'
for kind in ['bounce-the-ball','move-the-train','move-the-car','ride-the-bike']:
    def svg(body,w=256):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="256" viewBox="0 0 {w} 256">{body}</svg>'
    (out/f'{kind}.svg').write_text(svg(scene(kind,.25)))
    frames=''.join(f'<g transform="translate({i*256} 0)">{scene(kind,i/N)}</g>' for i in range(N))
    (out/f'{kind}-motion.svg').write_text(svg(frames,N*256))
