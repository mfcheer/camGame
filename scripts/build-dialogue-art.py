"""Original deterministic picture-book vector art; no fonts, scripts or external assets."""
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'public/images/dialogue'
out.mkdir(parents=True, exist_ok=True)
for name in ['happy','sad','sunny','rainy']:
    if name in ('happy','sad'):
        mouth='M 85 145 Q 128 190 171 145' if name=='happy' else 'M 88 169 Q 128 128 168 169'
        drawing=f'<circle cx="128" cy="127" r="92" fill="#ffe6ac" stroke="#d39f66" stroke-width="5"/><ellipse cx="94" cy="112" rx="8" ry="11" fill="#634d4b"/><ellipse cx="162" cy="112" rx="8" ry="11" fill="#634d4b"/><ellipse cx="70" cy="145" rx="15" ry="9" fill="#f6b5aa"/><ellipse cx="186" cy="145" rx="15" ry="9" fill="#f6b5aa"/><path d="{mouth}" fill="none" stroke="#895b51" stroke-width="7" stroke-linecap="round"/>'
    elif name=='sunny':
        drawing='<g stroke="#ecc068" stroke-width="10" stroke-linecap="round">'+''.join(f'<path d="M128 22V43" transform="rotate({a} 128 128)"/>' for a in range(0,360,45))+'</g><circle cx="128" cy="128" r="65" fill="#ffdc83" stroke="#e9b558" stroke-width="5"/>'
    else:
        drawing='<path d="M56 143C15 140 19 80 61 78C69 22 150 21 170 69C220 54 250 125 208 143Z" fill="#b4c8e7" stroke="#849fbf" stroke-width="5"/>'+''.join(f'<path d="M{x} 165l-9 24" stroke="#79b6df" stroke-width="10" stroke-linecap="round"/>' for x in (76,131,186))
    (out/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">{drawing}</svg>\n')
