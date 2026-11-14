import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const COMPLEMENTARY_ART = {
  // 1. 香甜水果 (fruits)
  mango: {
    title: 'mango',
    zh: '芒果',
    bg: '#FEF5E7',
    accent: '#F39C12',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="mangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFD54F"/>
            <stop offset="55%" stop-color="#FFA726"/>
            <stop offset="100%" stop-color="#FB8C00"/>
          </linearGradient>
          <linearGradient id="mangoBlush" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF7043" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#E64A19" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="leafGrad_mango" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#81C784"/>
            <stop offset="100%" stop-color="#388E3C"/>
          </linearGradient>
        </defs>
        <!-- Stem -->
        <path d="M-10 -72 C-8 -88 4 -96 14 -94 C12 -88 6 -80 -2 -68" fill="#6D4C41" stroke="#4E342E" stroke-width="3" stroke-linecap="round"/>
        <!-- Leaf -->
        <path d="M0 -74 C26 -96 64 -92 72 -70 C52 -62 26 -66 0 -74 Z" fill="url(#leafGrad_mango)" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/>
        <path d="M8 -72 Q38 -76 66 -72" fill="none" stroke="#C8E6C9" stroke-width="2" stroke-linecap="round"/>
        <!-- Mango Body: smooth kidney / teardrop curve -->
        <path d="M-12 -64 C36 -68 76 -28 72 26 C68 68 28 84 -14 80 C-58 76 -80 34 -76 -10 C-72 -48 -44 -62 -12 -64 Z" fill="url(#mangoGrad)" stroke="#E65100" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Blush -->
        <path d="M10 -40 C48 -38 68 -10 66 28 C64 54 44 68 18 64 C42 44 48 -14 10 -40 Z" fill="url(#mangoBlush)"/>
        <!-- Highlight -->
        <path d="M-52 -16 C-56 12 -46 44 -26 56 C-38 38 -44 14 -40 -12 C-38 -20 -46 -24 -52 -16 Z" fill="#FFFFFF" opacity="0.6"/>
        <circle cx="-38" cy="-28" r="5.5" fill="#FFFFFF" opacity="0.85"/>
      </g>
    `
  },
  pineapple: {
    title: 'pineapple',
    zh: '菠萝',
    bg: '#FEF9E7',
    accent: '#F1C40F',
    svgBody: `
      <g transform="translate(128, 134)">
        <defs>
          <linearGradient id="crownLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4CAF50"/>
            <stop offset="100%" stop-color="#2E7D32"/>
          </linearGradient>
          <linearGradient id="pineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFEE58"/>
            <stop offset="50%" stop-color="#FDD835"/>
            <stop offset="100%" stop-color="#F57F17"/>
          </linearGradient>
        </defs>
        <!-- Crown Leaves -->
        <path d="M0 -34 L-28 -84 C-10 -76 0 -58 0 -34 Z" fill="url(#crownLeaf)" stroke="#1B5E20" stroke-width="3"/>
        <path d="M0 -34 L28 -84 C10 -76 0 -58 0 -34 Z" fill="url(#crownLeaf)" stroke="#1B5E20" stroke-width="3"/>
        <path d="M0 -34 L-48 -70 C-28 -60 -16 -46 0 -34 Z" fill="#388E3C" stroke="#1B5E20" stroke-width="3"/>
        <path d="M0 -34 L48 -70 C28 -60 16 -46 0 -34 Z" fill="#388E3C" stroke="#1B5E20" stroke-width="3"/>
        <path d="M0 -34 L0 -96 C6 -76 8 -56 0 -34 Z" fill="#81C784" stroke="#1B5E20" stroke-width="3"/>

        <!-- Pineapple Oval Body -->
        <rect x="-54" y="-36" width="108" height="116" rx="52" fill="url(#pineGrad)" stroke="#E65100" stroke-width="4.5"/>

        <!-- Diamond grid texture -->
        <path d="M-44 -6 L14 54 M-48 18 L2 72 M-26 -28 L42 40 M-2 36 L-38 72 M-36 -12 L38 62 M-18 -26 L46 38 M2 -32 L48 14" fill="none" stroke="#E65100" stroke-width="2.5" opacity="0.65"/>
        <path d="M44 -6 L-14 54 M48 18 L-2 72 M26 -28 L-42 40 M2 36 L38 72 M36 -12 L-38 62 M18 -26 L-46 38 M-2 -32 L-48 14" fill="none" stroke="#E65100" stroke-width="2.5" opacity="0.65"/>

        <!-- Cute little diamond tufts / dots -->
        <circle cx="0" cy="18" r="3" fill="#BF360C"/>
        <circle cx="-24" cy="-2" r="2.5" fill="#BF360C"/>
        <circle cx="24" cy="-2" r="2.5" fill="#BF360C"/>
        <circle cx="-22" cy="38" r="2.5" fill="#BF360C"/>
        <circle cx="22" cy="38" r="2.5" fill="#BF360C"/>
        <circle cx="0" cy="56" r="2.5" fill="#BF360C"/>

        <!-- Highlights -->
        <ellipse cx="-32" cy="-4" rx="8" ry="16" transform="rotate(-20 -32 -4)" fill="#FFFFFF" opacity="0.55"/>
        <circle cx="-26" cy="-18" r="4" fill="#FFFFFF" opacity="0.75"/>
      </g>
    `
  },

  // 2. 好喝饮料 (drinks)
  soymilk: {
    title: 'soymilk',
    zh: '豆浆',
    bg: '#FEF9E7',
    accent: '#F7DC6F',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <linearGradient id="bowlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFF9C4"/>
            <stop offset="50%" stop-color="#FFFDE7"/>
            <stop offset="100%" stop-color="#FFF176"/>
          </linearGradient>
          <linearGradient id="milkSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="100%" stop-color="#F9FBE7"/>
          </linearGradient>
        </defs>

        <!-- Wooden Tray Underneath -->
        <rect x="-70" y="52" width="140" height="18" rx="9" fill="#BCAAA4" stroke="#6D4C41" stroke-width="3"/>

        <!-- Bowl Ears/Handles -->
        <circle cx="-56" cy="10" r="14" fill="none" stroke="#FBC02D" stroke-width="5"/>
        <circle cx="56" cy="10" r="14" fill="none" stroke="#FBC02D" stroke-width="5"/>

        <!-- Bowl Body -->
        <path d="M-52 -6 C-52 46 -28 58 0 58 C28 58 52 46 52 -6 Z" fill="url(#bowlGrad)" stroke="#F57F17" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Warm Soymilk Surface -->
        <ellipse cx="0" cy="-6" rx="52" ry="18" fill="url(#milkSurface)" stroke="#F57F17" stroke-width="3.5"/>
        <ellipse cx="0" cy="-6" rx="42" ry="12" fill="#FFFFFF"/>

        <!-- Rising Steam -->
        <path d="M-16 -24 Q-22 -38 -14 -50 Q-8 -60 -12 -70" fill="none" stroke="#FFF59D" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
        <path d="M12 -26 Q6 -40 16 -54 Q22 -64 16 -74" fill="none" stroke="#FFF59D" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>

        <!-- Soybeans decor next to bowl -->
        <circle cx="48" cy="54" r="6" fill="#FDD835" stroke="#F57F17" stroke-width="2"/>
        <circle cx="58" cy="56" r="5" fill="#FFEE58" stroke="#F57F17" stroke-width="2"/>
        <!-- Spoon leaning -->
        <path d="M26 -8 L48 -44" fill="none" stroke="#B0BEC5" stroke-width="5" stroke-linecap="round"/>
        <circle cx="48" cy="-44" r="5" fill="#CFD8DC"/>
      </g>
    `
  },
  lemonade: {
    title: 'lemonade',
    zh: '柠檬水',
    bg: '#FEFDE8',
    accent: '#F4D03F',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="lemonadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFF59D"/>
            <stop offset="60%" stop-color="#FFF176"/>
            <stop offset="100%" stop-color="#FDD835"/>
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="#E1F5FE" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#B3E5FC" stop-opacity="0.8"/>
          </linearGradient>
        </defs>
        <!-- Blue Straw -->
        <path d="M12 -84 L26 -46 L20 46" fill="none" stroke="#00BCD4" stroke-width="7" stroke-linecap="round"/>
        <path d="M14 -78 L18 -68 M22 -58 L24 -48 M24 -30 L24 -20 M23 0 L23 10 M22 30 L22 40" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>

        <!-- Glass Cup -->
        <path d="M-44 -46 L-34 66 C-32 76 32 76 34 66 L44 -46 Z" fill="url(#glassGrad)" stroke="#0288D1" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Liquid -->
        <path d="M-38 -16 Q-18 -22 0 -16 Q20 -10 38 -16 L32 64 C30 72 -30 72 -32 64 Z" fill="url(#lemonadeGrad)" stroke="#FBC02D" stroke-width="2.5"/>

        <!-- Ice cubes -->
        <rect x="-24" y="8" width="18" height="18" rx="4" fill="#FFFFFF" opacity="0.75" stroke="#81D4FA" stroke-width="1.5"/>
        <rect x="8" y="24" width="16" height="16" rx="4" fill="#FFFFFF" opacity="0.75" stroke="#81D4FA" stroke-width="1.5"/>

        <!-- Mint leaf -->
        <path d="M-28 -40 C-36 -54 -24 -62 -14 -54 C-10 -46 -18 -40 -28 -40 Z" fill="#66BB6A" stroke="#2E7D32" stroke-width="2"/>

        <!-- Lemon Slice on Rim -->
        <circle cx="-38" cy="-42" r="22" fill="#FFEE58" stroke="#F57F17" stroke-width="3.5"/>
        <circle cx="-38" cy="-42" r="17" fill="#FFF59D"/>
        <circle cx="-38" cy="-42" r="3" fill="#FFFFFF"/>
        <line x1="-38" y1="-59" x2="-38" y2="-25" stroke="#F57F17" stroke-width="2"/>
        <line x1="-55" y1="-42" x2="-21" y2="-42" stroke="#F57F17" stroke-width="2"/>
        <line x1="-50" y1="-54" x2="-26" y2="-30" stroke="#F57F17" stroke-width="2"/>
        <line x1="-50" y1="-30" x2="-26" y2="-54" stroke="#F57F17" stroke-width="2"/>

        <!-- Bubbles -->
        <circle cx="-10" cy="46" r="3" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="16" cy="12" r="3.5" fill="#FFFFFF" opacity="0.8"/>
      </g>
    `
  },

  // 3. 动物朋友 (animals)
  lion: {
    title: 'lion',
    zh: '狮子',
    bg: '#FEF5E7',
    accent: '#E67E22',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="maneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFA726"/>
            <stop offset="50%" stop-color="#FB8C00"/>
            <stop offset="100%" stop-color="#E65100"/>
          </linearGradient>
          <linearGradient id="lionFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFE082"/>
            <stop offset="100%" stop-color="#FFCA28"/>
          </linearGradient>
        </defs>
        <!-- Mane: big fluffy cloud/sunburst -->
        <path d="M0 -86 C24 -86 42 -76 56 -62 C74 -68 90 -52 86 -34 C100 -20 102 4 92 20 C102 38 92 58 76 68 C80 86 64 100 46 96 C30 106 6 104 -10 100 C-26 104 -50 96 -54 78 C-72 74 -86 54 -80 36 C-94 22 -92 -4 -80 -18 C-88 -38 -74 -58 -54 -58 C-44 -74 -24 -86 0 -86 Z" fill="url(#maneGrad)" stroke="#BF360C" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Round Ears -->
        <circle cx="-42" cy="-44" r="16" fill="#FFCA28" stroke="#E65100" stroke-width="3.5"/>
        <circle cx="-42" cy="-44" r="9" fill="#FF8A65"/>
        <circle cx="42" cy="-44" r="16" fill="#FFCA28" stroke="#E65100" stroke-width="3.5"/>
        <circle cx="42" cy="-44" r="9" fill="#FF8A65"/>

        <!-- Face Base -->
        <circle cx="0" cy="8" r="54" fill="url(#lionFace)" stroke="#E65100" stroke-width="4"/>

        <!-- Eyes -->
        <ellipse cx="-20" cy="0" rx="6.5" ry="8.5" fill="#263238"/>
        <circle cx="-22" cy="-3" r="3" fill="#FFFFFF"/>
        <ellipse cx="20" cy="0" rx="6.5" ry="8.5" fill="#263238"/>
        <circle cx="18" cy="-3" r="3" fill="#FFFFFF"/>

        <!-- Muzzle / Cheeks -->
        <ellipse cx="-12" cy="24" rx="16" ry="12" fill="#FFF9C4"/>
        <ellipse cx="12" cy="24" rx="16" ry="12" fill="#FFF9C4"/>

        <!-- Nose -->
        <path d="M-10 14 L10 14 L0 26 Z" fill="#8D6E63" stroke="#4E342E" stroke-width="2.5" stroke-linejoin="round"/>

        <!-- Whiskers & Smile -->
        <path d="M0 24 L0 32 M-8 32 Q0 38 8 32" fill="none" stroke="#4E342E" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="-36" y1="22" x2="-24" y2="24" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        <line x1="-36" y1="28" x2="-24" y2="27" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="22" x2="24" y2="24" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="28" x2="24" y2="27" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
      </g>
    `
  },
  panda: {
    title: 'panda',
    zh: '熊猫',
    bg: '#ECEFF1',
    accent: '#263238',
    svgBody: `
      <g transform="translate(128, 128)">
        <!-- Bamboo stem in paws -->
        <path d="M46 36 L58 -56" stroke="#43A047" stroke-width="8" stroke-linecap="round"/>
        <path d="M48 2 M51 -18 M54 -38" stroke="#1B5E20" stroke-width="2"/>
        <path d="M52 -24 C64 -34 76 -30 76 -20 C64 -20 56 -22 52 -24 Z" fill="#66BB6A"/>

        <!-- Black Ears -->
        <circle cx="-50" cy="-44" r="20" fill="#212121" stroke="#000000" stroke-width="3"/>
        <circle cx="50" cy="-44" r="20" fill="#212121" stroke="#000000" stroke-width="3"/>

        <!-- Big Round White Head -->
        <ellipse cx="0" cy="4" rx="66" ry="60" fill="#FFFFFF" stroke="#212121" stroke-width="4.5"/>

        <!-- Iconic Black Eye Patches (angled) -->
        <ellipse cx="-26" cy="-2" rx="16" ry="19" transform="rotate(-20 -26 -2)" fill="#212121"/>
        <ellipse cx="26" cy="-2" rx="16" ry="19" transform="rotate(20 26 -2)" fill="#212121"/>

        <!-- Sparkling Pupils inside patches -->
        <circle cx="-24" cy="-2" r="5.5" fill="#FFFFFF"/>
        <circle cx="-24" cy="-2" r="3.5" fill="#263238"/>
        <circle cx="-22" cy="-4" r="1.5" fill="#FFFFFF"/>
        <circle cx="24" cy="-2" r="5.5" fill="#FFFFFF"/>
        <circle cx="24" cy="-2" r="3.5" fill="#263238"/>
        <circle cx="22" cy="-4" r="1.5" fill="#FFFFFF"/>

        <!-- Cute Pink Cheeks -->
        <ellipse cx="-44" cy="20" rx="9" ry="5" fill="#FFCDD2" opacity="0.8"/>
        <ellipse cx="44" cy="20" rx="9" ry="5" fill="#FFCDD2" opacity="0.8"/>

        <!-- Inverted Triangle Nose & Smile -->
        <path d="M-8 16 L8 16 L0 24 Z" fill="#212121" stroke="#000000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M0 24 L0 30 M-7 30 Q0 36 7 30" fill="none" stroke="#212121" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Little Black Paws at bottom -->
        <ellipse cx="-34" cy="56" rx="15" ry="11" fill="#212121"/>
        <ellipse cx="34" cy="56" rx="15" ry="11" fill="#212121"/>
      </g>
    `
  },
  monkey: {
    title: 'monkey',
    zh: '猴子',
    bg: '#EFEBE9',
    accent: '#8D6E63',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="monkeyFur" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#A1887F"/>
            <stop offset="100%" stop-color="#6D4C41"/>
          </linearGradient>
          <linearGradient id="bananaM" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFEE58"/>
            <stop offset="100%" stop-color="#FBC02D"/>
          </linearGradient>
        </defs>
        <!-- Big Round Ears with Pink Inside -->
        <circle cx="-56" cy="-4" r="22" fill="#6D4C41" stroke="#4E342E" stroke-width="4"/>
        <circle cx="-56" cy="-4" r="13" fill="#FFCCBC"/>
        <circle cx="56" cy="-4" r="22" fill="#6D4C41" stroke="#4E342E" stroke-width="4"/>
        <circle cx="56" cy="-4" r="13" fill="#FFCCBC"/>

        <!-- Head Base -->
        <circle cx="0" cy="0" r="58" fill="url(#monkeyFur)" stroke="#4E342E" stroke-width="4.5"/>
        <!-- Hair tuft on top -->
        <path d="M-6 -56 Q0 -68 6 -56 Q0 -62 -6 -56" fill="#4E342E"/>

        <!-- Heart/Peanut Shaped Face -->
        <path d="M-24 -28 C-44 -28 -44 14 -22 28 C-32 38 -12 50 0 50 C12 50 32 38 22 28 C44 14 44 -28 24 -28 C12 -28 0 -16 0 -16 C0 -16 -12 -28 -24 -28 Z" fill="#FFE0B2" stroke="#4E342E" stroke-width="3"/>

        <!-- Big Expressive Eyes -->
        <ellipse cx="-16" cy="-4" rx="7" ry="10" fill="#212121"/>
        <circle cx="-18" cy="-7" r="3" fill="#FFFFFF"/>
        <ellipse cx="16" cy="-4" rx="7" ry="10" fill="#212121"/>
        <circle cx="14" cy="-7" r="3" fill="#FFFFFF"/>

        <!-- Little Nostrils -->
        <circle cx="-5" cy="18" r="2" fill="#4E342E"/>
        <circle cx="5" cy="18" r="2" fill="#4E342E"/>

        <!-- Wide Happy Smile -->
        <path d="M-14 26 Q0 38 14 26" fill="none" stroke="#4E342E" stroke-width="3" stroke-linecap="round"/>

        <!-- Cute Banana held below -->
        <path d="M-22 56 C-2 44 26 50 36 68 C22 66 2 64 -18 64 Z" fill="url(#bananaM)" stroke="#F57F17" stroke-width="2"/>
        <circle cx="28" cy="62" r="7" fill="#6D4C41"/>
      </g>
    `
  },
  pig: {
    title: 'pig',
    zh: '小猪',
    bg: '#FCE4EC',
    accent: '#EC407A',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="pigGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FF80AB"/>
            <stop offset="100%" stop-color="#FF4081"/>
          </linearGradient>
        </defs>
        <!-- Floppy Ears -->
        <path d="M-52 -34 C-68 -64 -32 -74 -22 -48 Z" fill="#F48FB1" stroke="#C2185B" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M52 -34 C68 -64 32 -74 22 -48 Z" fill="#F48FB1" stroke="#C2185B" stroke-width="3.5" stroke-linejoin="round"/>

        <!-- Big Round Pink Head -->
        <circle cx="0" cy="4" r="62" fill="#F8BBD0" stroke="#C2185B" stroke-width="4.5"/>

        <!-- Eyes -->
        <circle cx="-24" cy="-6" r="6" fill="#212121"/>
        <circle cx="-26" cy="-8" r="2.5" fill="#FFFFFF"/>
        <circle cx="24" cy="-6" r="6" fill="#212121"/>
        <circle cx="22" cy="-8" r="2.5" fill="#FFFFFF"/>

        <!-- Rosy Cheeks -->
        <circle cx="-42" cy="14" r="8" fill="#F06292" opacity="0.6"/>
        <circle cx="42" cy="14" r="8" fill="#F06292" opacity="0.6"/>

        <!-- Iconic Pig Snout -->
        <ellipse cx="0" cy="18" rx="26" ry="18" fill="#F48FB1" stroke="#C2185B" stroke-width="3.5"/>
        <ellipse cx="-9" cy="18" rx="5" ry="7" fill="#C2185B"/>
        <ellipse cx="9" cy="18" rx="5" ry="7" fill="#C2185B"/>

        <!-- Little Grin below snout -->
        <path d="M-10 40 Q0 46 10 40" fill="none" stroke="#C2185B" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `
  },

  // 4. 身体部位 (body)
  hand: {
    title: 'hand',
    zh: '手',
    bg: '#FBE9E7',
    accent: '#FF7043',
    svgBody: `
      <g transform="translate(128, 134)">
        <defs>
          <linearGradient id="handGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFCCBC"/>
            <stop offset="100%" stop-color="#FFAB91"/>
          </linearGradient>
        </defs>
        <!-- Palm and 5 round chubby toddler fingers waving -->
        <!-- Thumb -->
        <path d="M-44 14 C-58 10 -64 -8 -50 -16 C-38 -22 -32 -4 -28 10" fill="url(#handGrad)" stroke="#D84315" stroke-width="4" stroke-linecap="round"/>
        <!-- Index -->
        <path d="M-26 -12 C-34 -38 -26 -64 -10 -64 C6 -64 4 -36 2 -12" fill="url(#handGrad)" stroke="#D84315" stroke-width="4" stroke-linecap="round"/>
        <!-- Middle (tallest) -->
        <path d="M-4 -14 C-10 -46 -2 -78 14 -78 C30 -78 24 -46 20 -14" fill="url(#handGrad)" stroke="#D84315" stroke-width="4" stroke-linecap="round"/>
        <!-- Ring -->
        <path d="M16 -10 C14 -38 24 -66 38 -64 C50 -62 42 -36 34 -8" fill="url(#handGrad)" stroke="#D84315" stroke-width="4" stroke-linecap="round"/>
        <!-- Pinky -->
        <path d="M32 4 C36 -18 48 -44 60 -40 C70 -36 58 -10 48 16" fill="url(#handGrad)" stroke="#D84315" stroke-width="4" stroke-linecap="round"/>
        <!-- Main Chubby Palm -->
        <path d="M-42 16 C-40 54 -24 68 0 68 C24 68 46 54 48 16 C48 -6 -38 -6 -42 16 Z" fill="url(#handGrad)" stroke="#D84315" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Palm Lines (M-shape / cute heart vibe) -->
        <path d="M-20 24 Q-6 34 8 22" fill="none" stroke="#FF8A65" stroke-width="3" stroke-linecap="round"/>
        <path d="M-10 32 Q4 42 22 34" fill="none" stroke="#FF8A65" stroke-width="3" stroke-linecap="round"/>
        <!-- Motion wave sparkle -->
        <path d="M-60 -36 Q-50 -44 -60 -52" fill="none" stroke="#FFA726" stroke-width="3" stroke-linecap="round"/>
        <path d="M60 -56 Q70 -64 60 -72" fill="none" stroke="#FFA726" stroke-width="3" stroke-linecap="round"/>
      </g>
    `
  },
  foot: {
    title: 'foot',
    zh: '脚',
    bg: '#FBE9E7',
    accent: '#FF7043',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <linearGradient id="footGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFCCBC"/>
            <stop offset="100%" stop-color="#FFAB91"/>
          </linearGradient>
        </defs>
        <!-- 5 chubby toes at top (big toe to small toe) -->
        <circle cx="-34" cy="-56" r="14" fill="url(#footGrad)" stroke="#D84315" stroke-width="3.5"/>
        <circle cx="-8" cy="-60" r="11" fill="url(#footGrad)" stroke="#D84315" stroke-width="3.5"/>
        <circle cx="14" cy="-56" r="9.5" fill="url(#footGrad)" stroke="#D84315" stroke-width="3.5"/>
        <circle cx="32" cy="-48" r="8" fill="url(#footGrad)" stroke="#D84315" stroke-width="3.5"/>
        <circle cx="46" cy="-38" r="6.5" fill="url(#footGrad)" stroke="#D84315" stroke-width="3.5"/>

        <!-- Chubby sole & round heel -->
        <path d="M-44 -36 C-52 0 -36 38 -24 64 C-14 78 14 78 24 64 C36 40 48 4 48 -24 C46 -38 34 -44 14 -40 C-8 -44 -36 -44 -44 -36 Z" fill="url(#footGrad)" stroke="#D84315" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Sole highlight pads -->
        <ellipse cx="-8" cy="-14" rx="20" ry="14" fill="#FFE0B2" opacity="0.6"/>
        <circle cx="0" cy="50" r="14" fill="#FFE0B2" opacity="0.6"/>
      </g>
    `
  },
  tooth: {
    title: 'tooth',
    zh: '牙齿',
    bg: '#E1F5FE',
    accent: '#03A9F4',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="toothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="70%" stop-color="#F1F8E9"/>
            <stop offset="100%" stop-color="#E1F5FE"/>
          </linearGradient>
        </defs>
        <!-- Sparkle cross on top right -->
        <path d="M46 -54 L52 -68 L58 -54 L72 -48 L58 -42 L52 -28 L46 -42 L32 -48 Z" fill="#FFD54F" stroke="#FFA000" stroke-width="1.5"/>
        <circle cx="52" cy="-48" r="2.5" fill="#FFFFFF"/>

        <!-- Tooth Body: round crown + two roots -->
        <path d="M-48 -32 C-52 14 -46 44 -28 72 C-20 82 -6 76 -8 50 C-10 28 10 28 8 50 C6 76 20 82 28 72 C46 44 52 14 48 -32 C46 -60 16 -62 0 -50 C-16 -62 -46 -60 -48 -32 Z" fill="url(#toothGrad)" stroke="#0288D1" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Happy smiling face on the tooth -->
        <ellipse cx="-16" cy="-14" rx="4.5" ry="6" fill="#212121"/>
        <circle cx="-18" cy="-16" r="2" fill="#FFFFFF"/>
        <ellipse cx="16" cy="-14" rx="4.5" ry="6" fill="#212121"/>
        <circle cx="14" cy="-16" r="2" fill="#FFFFFF"/>
        <circle cx="-26" cy="-2" r="5" fill="#FF8A80" opacity="0.6"/>
        <circle cx="26" cy="-2" r="5" fill="#FF8A80" opacity="0.6"/>
        <path d="M-10 -2 Q0 10 10 -2" fill="none" stroke="#212121" stroke-width="3" stroke-linecap="round"/>

        <!-- Clean shine curve -->
        <path d="M-36 -32 C-38 -12 -34 16 -24 38" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
      </g>
    `
  },

  // 5. 生活发现 (everyday)
  bowl: {
    title: 'bowl',
    zh: '碗',
    bg: '#E1F5FE',
    accent: '#03A9F4',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <linearGradient id="bowlColor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4FC3F7"/>
            <stop offset="100%" stop-color="#0288D1"/>
          </linearGradient>
        </defs>
        <!-- Side handles -->
        <path d="M-52 4 C-68 4 -68 28 -52 28" fill="none" stroke="#0288D1" stroke-width="6" stroke-linecap="round"/>
        <path d="M52 4 C68 4 68 28 52 28" fill="none" stroke="#0288D1" stroke-width="6" stroke-linecap="round"/>

        <!-- Steaming Hot Rice Mound -->
        <path d="M-44 -4 C-44 -46 44 -46 44 -4 Z" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="3"/>
        <!-- Rice grain details & veggie cubes -->
        <rect x="-12" y="-30" width="8" height="8" rx="2" fill="#FF7043"/>
        <circle cx="14" cy="-26" r="4.5" fill="#66BB6A"/>
        <rect x="2" y="-18" width="7" height="7" rx="2" fill="#FF7043"/>
        <circle cx="-22" cy="-16" r="4" fill="#66BB6A"/>

        <!-- Bowl Rim & Body -->
        <path d="M-52 -4 C-52 54 -28 66 0 66 C28 66 52 54 52 -4 Z" fill="url(#bowlColor)" stroke="#01579B" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Bowl Foot Base -->
        <rect x="-26" y="66" width="52" height="12" rx="4" fill="#01579B"/>

        <!-- Decorative Rim Pattern -->
        <ellipse cx="0" cy="-4" rx="52" ry="14" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0.9"/>
        <path d="M-42 18 Q0 24 42 18" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
      </g>
    `
  },
  spoon: {
    title: 'spoon',
    zh: '勺子',
    bg: '#FFF3E0',
    accent: '#FF9800',
    svgBody: `
      <g transform="translate(128, 128) rotate(-35)">
        <defs>
          <linearGradient id="metalSpoon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ECEFF1"/>
            <stop offset="40%" stop-color="#FFFFFF"/>
            <stop offset="100%" stop-color="#CFD8DC"/>
          </linearGradient>
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFA726"/>
            <stop offset="100%" stop-color="#FB8C00"/>
          </linearGradient>
        </defs>
        <!-- Spoon Oval Bowl -->
        <ellipse cx="0" cy="-46" rx="30" ry="42" fill="url(#metalSpoon)" stroke="#78909C" stroke-width="4"/>
        <ellipse cx="-4" cy="-46" rx="20" ry="32" fill="#FFFFFF" opacity="0.6"/>

        <!-- Spoon Neck & Long Handle -->
        <path d="M-8 -6 L-10 64 C-10 76 10 76 10 64 L8 -6 Z" fill="url(#handleGrad)" stroke="#E65100" stroke-width="4" stroke-linejoin="round"/>
        <!-- Grip details -->
        <circle cx="0" cy="62" r="5" fill="#FFFFFF"/>
        <line x1="-6" y1="20" x2="6" y2="20" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="-6" y1="32" x2="6" y2="32" stroke="#FFE082" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `
  },
  bed: {
    title: 'bed',
    zh: '床',
    bg: '#F3E5F5',
    accent: '#AB47BC',
    svgBody: `
      <g transform="translate(128, 130)">
        <defs>
          <linearGradient id="quiltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#81D4FA"/>
            <stop offset="100%" stop-color="#29B6F6"/>
          </linearGradient>
          <linearGradient id="woodBed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8D6E63"/>
            <stop offset="100%" stop-color="#5D4037"/>
          </linearGradient>
        </defs>
        <!-- Wooden Headboard (High Back) -->
        <rect x="-68" y="-56" width="136" height="60" rx="8" fill="url(#woodBed)" stroke="#3E2723" stroke-width="4"/>
        <circle cx="0" cy="-40" r="8" fill="#D7CCC8"/>

        <!-- Soft Fluffy White Pillow -->
        <rect x="-48" y="-30" width="96" height="32" rx="14" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="3"/>
        <path d="M-12 -14 Q0 -8 12 -14" fill="none" stroke="#CFD8DC" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Cozy Quilt / Blanket -->
        <path d="M-62 -4 L62 -4 L58 48 L-58 48 Z" fill="url(#quiltGrad)" stroke="#0288D1" stroke-width="4" stroke-linejoin="round"/>
        <!-- Polka dots on quilt -->
        <circle cx="-32" cy="14" r="5" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="0" cy="14" r="5" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="32" cy="14" r="5" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="-16" cy="34" r="5" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="16" cy="34" r="5" fill="#FFFFFF" opacity="0.8"/>

        <!-- Bed Legs -->
        <rect x="-64" y="48" width="12" height="24" rx="4" fill="#5D4037" stroke="#3E2723" stroke-width="3"/>
        <rect x="52" y="48" width="12" height="24" rx="4" fill="#5D4037" stroke="#3E2723" stroke-width="3"/>
      </g>
    `
  },
  shoe: {
    title: 'shoe',
    zh: '鞋子',
    bg: '#FFEBEE',
    accent: '#E53935',
    svgBody: `
      <g transform="translate(128, 130)">
        <defs>
          <linearGradient id="shoeBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#EF5350"/>
            <stop offset="100%" stop-color="#C62828"/>
          </linearGradient>
        </defs>
        <!-- Thick White Rubber Sole -->
        <path d="M-68 36 C-68 28 -40 24 0 24 C40 24 72 26 74 42 C74 54 -68 54 -68 36 Z" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="3.5" stroke-linejoin="round"/>
        <line x1="-50" y1="44" x2="56" y2="44" stroke="#CFD8DC" stroke-width="2.5"/>

        <!-- Shoe Upper (Chubby toddler sneaker) -->
        <path d="M-62 26 C-62 -14 -42 -44 -18 -44 C-4 -44 8 -24 32 -10 C56 4 68 18 68 30 Z" fill="url(#shoeBody)" stroke="#B71C1C" stroke-width="4" stroke-linejoin="round"/>

        <!-- Round White Toe Cap -->
        <path d="M30 6 C48 14 66 22 66 32 L26 32 C26 20 28 12 30 6 Z" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="2.5"/>

        <!-- Yellow Velcro Strap with Star -->
        <rect x="-24" y="-18" width="46" height="18" rx="6" fill="#FDD835" stroke="#F57F17" stroke-width="3"/>
        <!-- Cute Little Star on Velcro -->
        <path d="M0 -15 L2 -10 L7 -10 L3 -6 L5 -1 L0 -4 L-5 -1 L-3 -6 L-7 -10 L-2 -10 Z" fill="#E65100"/>

        <!-- Ankle Opening & Cushion -->
        <ellipse cx="-20" cy="-40" rx="14" ry="8" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="2.5"/>
      </g>
    `
  },

  // 6. 小小教室 (school)
  clock: {
    title: 'clock',
    zh: '闹钟',
    bg: '#E0F2F1',
    accent: '#00897B',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="clockCase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4DB6AC"/>
            <stop offset="100%" stop-color="#00796B"/>
          </linearGradient>
        </defs>
        <!-- Two Brass Bells on Top -->
        <circle cx="-44" cy="-52" r="16" fill="#FFD54F" stroke="#FFA000" stroke-width="3"/>
        <circle cx="44" cy="-52" r="16" fill="#FFD54F" stroke="#FFA000" stroke-width="3"/>
        <!-- Top Handle & Hammer -->
        <path d="M-18 -58 C-18 -74 18 -74 18 -58" fill="none" stroke="#78909C" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="0" cy="-56" r="4" fill="#546E7A"/>

        <!-- Two Feet Pegs at Bottom -->
        <line x1="-36" y1="52" x2="-48" y2="72" stroke="#546E7A" stroke-width="6" stroke-linecap="round"/>
        <line x1="36" y1="52" x2="48" y2="72" stroke="#546E7A" stroke-width="6" stroke-linecap="round"/>

        <!-- Clock Round Outer Frame -->
        <circle cx="0" cy="4" r="62" fill="url(#clockCase)" stroke="#004D40" stroke-width="4.5"/>
        <!-- Clock White Dial -->
        <circle cx="0" cy="4" r="48" fill="#FFFFFF" stroke="#004D40" stroke-width="3"/>

        <!-- 12, 3, 6, 9 Dot Markers -->
        <circle cx="0" cy="-34" r="3.5" fill="#004D40"/>
        <circle cx="38" cy="4" r="3.5" fill="#004D40"/>
        <circle cx="0" cy="42" r="3.5" fill="#004D40"/>
        <circle cx="-38" cy="4" r="3.5" fill="#004D40"/>

        <!-- Hands (pointing to happy 10:10) -->
        <!-- Hour Hand -->
        <line x1="0" y1="4" x2="-18" y2="-16" stroke="#D32F2F" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Minute Hand -->
        <line x1="0" y1="4" x2="22" y2="-20" stroke="#004D40" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="0" cy="4" r="4.5" fill="#D32F2F"/>
      </g>
    `
  },
  glue: {
    title: 'glue',
    zh: '胶水',
    bg: '#FCE4EC',
    accent: '#D81B60',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <linearGradient id="glueTube" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#EC407A"/>
            <stop offset="60%" stop-color="#D81B60"/>
            <stop offset="100%" stop-color="#AD1457"/>
          </linearGradient>
        </defs>
        <!-- Exposed White Glue Stick Top -->
        <path d="M-22 -44 L-22 -72 C-22 -80 22 -80 22 -72 L22 -44 Z" fill="#FFFFFF" stroke="#B0BEC5" stroke-width="3.5"/>
        <ellipse cx="0" cy="-72" rx="20" ry="7" fill="#F1F8E9"/>

        <!-- Main Glue Cylinder Tube -->
        <rect x="-30" y="-44" width="60" height="96" rx="8" fill="url(#glueTube)" stroke="#880E4F" stroke-width="4.5"/>

        <!-- White Label on Tube with Star & Text -->
        <rect x="-24" y="-24" width="48" height="48" rx="4" fill="#FFFFFF" stroke="#F48FB1" stroke-width="2"/>
        <polygon points="0,-14 4,-2 16,-2 6,6 10,18 0,10 -10,18 -6,6 -16,-2 -4,-2" fill="#FDD835"/>

        <!-- Yellow Twist Base -->
        <rect x="-26" y="52" width="52" height="18" rx="5" fill="#FDD835" stroke="#F57F17" stroke-width="3.5"/>
        <line x1="-12" y1="56" x2="-12" y2="66" stroke="#F57F17" stroke-width="2"/>
        <line x1="0" y1="56" x2="0" y2="66" stroke="#F57F17" stroke-width="2"/>
        <line x1="12" y1="56" x2="12" y2="66" stroke="#F57F17" stroke-width="2"/>
      </g>
    `
  },

  // 7. 玩具乐园 (toys)
  shovel: {
    title: 'shovel',
    zh: '小铲子',
    bg: '#FFEBEE',
    accent: '#E53935',
    svgBody: `
      <g transform="translate(128, 128) rotate(25)">
        <defs>
          <linearGradient id="shovelScoop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#EF5350"/>
            <stop offset="100%" stop-color="#C62828"/>
          </linearGradient>
        </defs>
        <!-- D-Grip Ring Handle at Top -->
        <path d="M-22 -74 C-22 -92 22 -92 22 -74 L14 -74 L14 -64 L-14 -64 L-14 -74 Z" fill="#FDD835" stroke="#F57F17" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="0" cy="-78" r="8" fill="#FFFFFF"/>

        <!-- Sturdy Shaft -->
        <rect x="-7" y="-64" width="14" height="66" rx="4" fill="#FDD835" stroke="#F57F17" stroke-width="3"/>

        <!-- Wide Shovel Scoop Blade -->
        <path d="M-36 2 C-38 32 -30 68 0 74 C30 68 38 32 36 2 Z" fill="url(#shovelScoop)" stroke="#B71C1C" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Scoop Rim Ribs -->
        <path d="M-24 16 L-10 58 M24 16 L10 58" stroke="#FFCDD2" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="-16" cy="24" r="3.5" fill="#FFFFFF" opacity="0.7"/>
      </g>
    `
  },
  pinwheel: {
    title: 'pinwheel',
    zh: '风车',
    bg: '#E3F2FD',
    accent: '#1E88E5',
    svgBody: `
      <g transform="translate(128, 128)">
        <!-- Wood Stick Handle -->
        <rect x="-5" y="0" width="10" height="92" rx="4" fill="#D7CCC8" stroke="#8D6E63" stroke-width="3"/>

        <!-- 4 Colorful Triangular Vanes (Red, Yellow, Green, Blue) -->
        <!-- Top Vane (Red) -->
        <path d="M0 0 L-46 -46 L0 -68 Z" fill="#EF5350" stroke="#C62828" stroke-width="3" stroke-linejoin="round"/>
        <!-- Right Vane (Yellow) -->
        <path d="M0 0 L46 -46 L68 0 Z" fill="#FFEE58" stroke="#F57F17" stroke-width="3" stroke-linejoin="round"/>
        <!-- Bottom Vane (Green) -->
        <path d="M0 0 L46 46 L0 68 Z" fill="#66BB6A" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/>
        <!-- Left Vane (Blue) -->
        <path d="M0 0 L-46 46 L-68 0 Z" fill="#42A5F5" stroke="#1565C0" stroke-width="3" stroke-linejoin="round"/>

        <!-- Center Golden Pin Button -->
        <circle cx="0" cy="0" r="12" fill="#FFA000" stroke="#E65100" stroke-width="3"/>
        <circle cx="0" cy="0" r="6" fill="#FFF9C4"/>

        <!-- Motion breeze curve -->
        <path d="M-62 -28 Q-72 -42 -54 -52" fill="none" stroke="#81D4FA" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 54 Q68 62 72 44" fill="none" stroke="#81D4FA" stroke-width="3" stroke-linecap="round"/>
      </g>
    `
  },

  // 8. 形状积木 (shapes)
  diamond: {
    title: 'diamond',
    zh: '菱形',
    bg: '#F3E5F5',
    accent: '#8E24AA',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#BA68C8"/>
            <stop offset="50%" stop-color="#9C27B0"/>
            <stop offset="100%" stop-color="#7B1FA2"/>
          </linearGradient>
        </defs>
        <!-- Diamond Shape (Equal sides, kite / rhombus) -->
        <polygon points="0,-78 62,0 0,78 -62,0" fill="url(#diamondGrad)" stroke="#4A148C" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Facet shine lines -->
        <polygon points="0,-74 58,0 0,0" fill="#E1BEE7" opacity="0.5"/>
        <polygon points="0,0 -58,0 0,-74" fill="#FFFFFF" opacity="0.35"/>
        <line x1="0" y1="-74" x2="0" y2="74" stroke="#FFFFFF" stroke-width="3" opacity="0.7"/>
        <line x1="-58" y1="0" x2="58" y2="0" stroke="#FFFFFF" stroke-width="3" opacity="0.7"/>

        <!-- Sparkles -->
        <circle cx="28" cy="-26" r="4" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="-18" cy="28" r="3" fill="#FFFFFF" opacity="0.8"/>
      </g>
    `
  },

  // 9. 彩虹颜色 (colors)
  gold: {
    title: 'gold',
    zh: '金色',
    bg: '#FFFDE7',
    accent: '#FBC02D',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <radialGradient id="goldCoin" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stop-color="#FFF9C4"/>
            <stop offset="40%" stop-color="#FDD835"/>
            <stop offset="80%" stop-color="#FBC02D"/>
            <stop offset="100%" stop-color="#F57F17"/>
          </radialGradient>
        </defs>
        <!-- Radiant Starburst Behind -->
        <path d="M0 -86 L14 -42 L58 -58 L42 -14 L86 0 L42 14 L58 58 L14 42 L0 86 L-14 42 L-58 58 L-42 14 L-86 0 L-42 -14 L-58 -58 L-14 -42 Z" fill="#FFF59D" opacity="0.7"/>

        <!-- Big Shiny Gold Coin / Medal -->
        <circle cx="0" cy="0" r="66" fill="url(#goldCoin)" stroke="#E65100" stroke-width="4.5"/>
        <!-- Inner Coin Ring with Beaded Dots -->
        <circle cx="0" cy="0" r="54" fill="none" stroke="#FFF9C4" stroke-width="3"/>
        <circle cx="0" cy="0" r="48" fill="none" stroke="#F57F17" stroke-width="2.5" stroke-dasharray="4,6"/>

        <!-- Center 5-pointed Star Symbol -->
        <polygon points="0,-34 10,-10 34,-10 14,6 22,30 0,16 -22,30 -14,6 -34,-10 -10,-10" fill="#FFFFFF" stroke="#E65100" stroke-width="2.5" stroke-linejoin="round"/>

        <!-- Shimmering Glint -->
        <ellipse cx="-28" cy="-28" rx="8" ry="16" transform="rotate(-30 -28 -28)" fill="#FFFFFF" opacity="0.65"/>
      </g>
    `
  }
};

function generateLearningSvg(key, meta) {
  const { title, svgBody } = meta;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
  <title>${title}</title>
  <defs>
    <filter id="softShadow_${key}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#softShadow_${key})">
    ${svgBody}
  </g>
</svg>
`;
}

function generateFullSvg(key, meta) {
  const { title, bg, accent, svgBody } = meta;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <filter id="shadow_${key}" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <radialGradient id="cardGlow_${key}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.92"/>
    </radialGradient>
  </defs>

  <circle cx="128" cy="128" r="114" fill="url(#cardGlow_${key})" filter="url(#shadow_${key})"/>
  <circle cx="128" cy="128" r="114" fill="none" stroke="${accent}" stroke-width="6" opacity="0.85"/>
  <circle cx="128" cy="128" r="106" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.9"/>

  ${svgBody}

  <g transform="translate(128, 206)">
    <rect x="-56" y="-18" width="112" height="32" rx="16" fill="${accent}" stroke="#FFFFFF" stroke-width="2.5" filter="url(#shadow_${key})"/>
    <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Comic Sans MS', sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">${title.toUpperCase()}</text>
  </g>
</svg>
`;
}

function generateItemSvg(key, meta) {
  const { svgBody } = meta;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <filter id="itemShadow_${key}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#itemShadow_${key})">
    ${svgBody}
  </g>
</svg>
`;
}

async function main() {
  const learningDir = path.resolve('public/images/words/learning');
  const wordsDir = path.resolve('public/images/words');
  const itemsDir = path.resolve('public/images/words/items');

  await fs.mkdir(learningDir, { recursive: true });
  await fs.mkdir(wordsDir, { recursive: true });
  await fs.mkdir(itemsDir, { recursive: true });

  const chromePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const tmpHtml = '/tmp/render_comp_asset.html';

  console.log(`Building SVG and PNG assets for ${Object.keys(COMPLEMENTARY_ART).length} complementary words...`);

  for (const [key, meta] of Object.entries(COMPLEMENTARY_ART)) {
    // 1. Learning illustration (used in Word Garden & learning card)
    const learningSvg = generateLearningSvg(key, meta);
    await fs.writeFile(path.join(learningDir, `${key}.svg`), learningSvg, 'utf8');

    // 2. Token badge SVG (3D bubble token)
    const tokenSvg = generateFullSvg(key, meta);
    const tokenSvgPath = path.join(wordsDir, `${key}.svg`);
    const tokenPngPath = path.join(wordsDir, `${key}.png`);
    await fs.writeFile(tokenSvgPath, tokenSvg, 'utf8');

    // Render token PNG
    const htmlToken = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html, body { width: 256px; height: 256px; background: transparent; overflow: hidden; } svg { width: 256px; height: 256px; display: block; }</style></head><body>${tokenSvg}</body></html>`;
    await fs.writeFile(tmpHtml, htmlToken, 'utf8');
    try {
      execFileSync(chromePath, ['--headless', '--disable-gpu', `--screenshot=${tokenPngPath}`, '--window-size=256,256', '--default-background-color=00000000', `file://${tmpHtml}`], { stdio: 'pipe' });
    } catch (e) {
      console.warn(`Chrome token render error on ${key}: ${e.message}`);
    }

    // 3. Item standalone SVG & PNG
    const itemSvg = generateItemSvg(key, meta);
    const itemSvgPath = path.join(itemsDir, `${key}.svg`);
    const itemPngPath = path.join(itemsDir, `${key}.png`);
    await fs.writeFile(itemSvgPath, itemSvg, 'utf8');

    const htmlItem = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html, body { width: 256px; height: 256px; background: transparent; overflow: hidden; } svg { width: 256px; height: 256px; display: block; }</style></head><body>${itemSvg}</body></html>`;
    await fs.writeFile(tmpHtml, htmlItem, 'utf8');
    try {
      execFileSync(chromePath, ['--headless', '--disable-gpu', `--screenshot=${itemPngPath}`, '--window-size=256,256', '--default-background-color=00000000', `file://${tmpHtml}`], { stdio: 'pipe' });
    } catch (e) {
      console.warn(`Chrome item render error on ${key}: ${e.message}`);
    }

    console.log(`Generated all assets for ${key} (${meta.zh})`);
  }

  console.log('All complementary word assets successfully created!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
