import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const WORDS_META = {
  // 1. 教室与文具
  chair: {
    title: 'chair',
    category: 'school',
    bg: '#FFF2E2',
    accent: '#D35400',
    svgBody: `
      <!-- Chair -->
      <g transform="translate(128, 120)">
        <rect x="-34" y="-72" width="68" height="48" rx="8" fill="#E67E22" stroke="#B95C00" stroke-width="4"/>
        <rect x="-22" y="-62" width="10" height="28" rx="4" fill="#F39C12"/>
        <rect x="12" y="-62" width="10" height="28" rx="4" fill="#F39C12"/>
        <ellipse cx="0" cy="-18" rx="46" ry="14" fill="#F39C12" stroke="#B95C00" stroke-width="4"/>
        <ellipse cx="0" cy="-20" rx="38" ry="9" fill="#F8C471"/>
        <path d="M-36 -12 L-42 48" stroke="#B95C00" stroke-width="6" stroke-linecap="round"/>
        <path d="M36 -12 L42 48" stroke="#B95C00" stroke-width="6" stroke-linecap="round"/>
        <path d="M-18 -10 L-20 40" stroke="#7E3D00" stroke-width="5" stroke-linecap="round"/>
        <path d="M18 -10 L20 40" stroke="#7E3D00" stroke-width="5" stroke-linecap="round"/>
        <path d="M-38 24 L38 24" stroke="#B95C00" stroke-width="4" stroke-linecap="round"/>
      </g>
    `
  },
  table: {
    title: 'table',
    category: 'school',
    bg: '#EAF2F8',
    accent: '#2980B9',
    svgBody: `
      <!-- Table -->
      <g transform="translate(128, 124)">
        <path d="M-42 -10 L-46 44" stroke="#5D6D7E" stroke-width="6" stroke-linecap="round"/>
        <path d="M42 -10 L46 44" stroke="#5D6D7E" stroke-width="6" stroke-linecap="round"/>
        <path d="M-56 0 L-62 50" stroke="#795548" stroke-width="8" stroke-linecap="round"/>
        <path d="M56 0 L62 50" stroke="#795548" stroke-width="8" stroke-linecap="round"/>
        <path d="M-58 -4 Q0 12 58 -4" fill="none" stroke="#5D4037" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="0" cy="-16" rx="68" ry="24" fill="#8D6E63" stroke="#4E342E" stroke-width="5"/>
        <ellipse cx="0" cy="-19" rx="62" ry="19" fill="#A1887F"/>
        <rect x="-8" y="-36" width="16" height="15" rx="3" fill="#4CAF50"/>
        <circle cx="0" cy="-40" r="8" fill="#81C784"/>
      </g>
    `
  },
  pencil: {
    title: 'pencil',
    category: 'school',
    bg: '#FFFDE7',
    accent: '#F39C12',
    svgBody: `
      <!-- Pencil angled 35deg -->
      <g transform="translate(128, 120) rotate(35)">
        <path d="M-14 -70 L14 -70 C14 -82 -14 -82 -14 -70 Z" fill="#FF8A80" stroke="#C62828" stroke-width="3"/>
        <rect x="-15" y="-70" width="30" height="14" rx="2" fill="#CFD8DC" stroke="#78909C" stroke-width="3"/>
        <line x1="-15" y1="-63" x2="15" y2="-63" stroke="#90A4AE" stroke-width="2"/>
        <rect x="-14" y="-56" width="28" height="96" fill="#FBC02D" stroke="#F57F17" stroke-width="3"/>
        <line x1="-5" y1="-56" x2="-5" y2="40" stroke="#F57F17" stroke-width="3"/>
        <line x1="5" y1="-56" x2="5" y2="40" stroke="#FFF176" stroke-width="3"/>
        <polygon points="-14,40 14,40 0,72" fill="#FFE0B2" stroke="#D7CCC8" stroke-width="2"/>
        <polygon points="-5,60 5,60 0,72" fill="#263238"/>
      </g>
    `
  },
  book: {
    title: 'book',
    category: 'school',
    bg: '#E8F8F5',
    accent: '#16A085',
    svgBody: `
      <!-- Open Book -->
      <g transform="translate(128, 122)">
        <path d="M-64 26 C-30 32 -10 24 0 20 C10 24 30 32 64 26 L64 -32 C30 -26 10 -34 0 -38 C-10 -34 -30 -26 -64 -32 Z" fill="#2980B9" stroke="#1B4F72" stroke-width="5"/>
        <path d="M-60 22 C-30 26 -8 18 0 16 L0 -40 C-8 -38 -30 -30 -60 -34 Z" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="3"/>
        <path d="M60 22 C30 26 8 18 0 16 L0 -40 C8 -38 30 -30 60 -34 Z" fill="#F8F9F9" stroke="#BDC3C7" stroke-width="3"/>
        <line x1="-48" y1="-20" x2="-14" y2="-16" stroke="#95A5A6" stroke-width="3" stroke-linecap="round"/>
        <line x1="-48" y1="-8" x2="-14" y2="-4" stroke="#95A5A6" stroke-width="3" stroke-linecap="round"/>
        <line x1="-48" y1="4" x2="-20" y2="7" stroke="#95A5A6" stroke-width="3" stroke-linecap="round"/>
        <path d="M32 -8 L35 -2 L41 -2 L36 3 L38 9 L32 5 L26 9 L28 3 L23 -2 L29 -2 Z" fill="#F1C40F"/>
        <path d="M0 -38 Q5 -10 12 30 L6 26 L0 32 Z" fill="#E74C3C"/>
      </g>
    `
  },
  crayon: {
    title: 'crayon',
    category: 'school',
    bg: '#FDEDEC',
    accent: '#E74C3C',
    svgBody: `
      <!-- Crayon tilted 40deg -->
      <g transform="translate(128, 120) rotate(40)">
        <polygon points="-12,-62 12,-62 0,-86" fill="#E74C3C" stroke="#C0392B" stroke-width="3"/>
        <rect x="-12" y="-62" width="24" height="124" rx="4" fill="#E74C3C" stroke="#C0392B" stroke-width="3"/>
        <rect x="-13" y="-42" width="26" height="88" rx="2" fill="#3498DB" stroke="#2980B9" stroke-width="3"/>
        <ellipse cx="0" cy="2" rx="10" ry="16" fill="#2ECC71"/>
        <line x1="-12" y1="-30" x2="12" y2="-30" stroke="#1F618D" stroke-width="3"/>
        <line x1="-12" y1="36" x2="12" y2="36" stroke="#1F618D" stroke-width="3"/>
      </g>
    `
  },
  teacher: {
    title: 'teacher',
    category: 'school',
    bg: '#FEF9E7',
    accent: '#F39C12',
    svgBody: `
      <!-- Friendly Teacher -->
      <g transform="translate(128, 122)">
        <circle cx="0" cy="-30" r="38" fill="#5D4037"/>
        <path d="M-36 48 C-36 22 -20 12 0 12 C20 12 36 22 36 48 Z" fill="#2E86C1" stroke="#1B4F72" stroke-width="4"/>
        <polygon points="-8,12 8,12 0,26" fill="#FDFEFE"/>
        <rect x="-10" y="-2" width="20" height="16" fill="#FFCCBC"/>
        <circle cx="0" cy="-28" r="28" fill="#FFE0B2" stroke="#FFB74D" stroke-width="3"/>
        <circle cx="-10" cy="-28" r="9" fill="none" stroke="#2C3E50" stroke-width="3"/>
        <circle cx="10" cy="-28" r="9" fill="none" stroke="#2C3E50" stroke-width="3"/>
        <line x1="-1" y1="-28" x2="1" y2="-28" stroke="#2C3E50" stroke-width="3"/>
        <circle cx="-10" cy="-28" r="3" fill="#2C3E50"/>
        <circle cx="10" cy="-28" r="3" fill="#2C3E50"/>
        <path d="M-7 -18 Q0 -12 7 -18" fill="none" stroke="#E65100" stroke-width="3" stroke-linecap="round"/>
        <circle cx="-18" cy="-22" r="5" fill="#FF8A80" opacity="0.6"/>
        <circle cx="18" cy="-22" r="5" fill="#FF8A80" opacity="0.6"/>
        <path d="M-28 -42 Q0 -26 28 -42 Q20 -60 0 -60 Q-20 -60 -28 -42 Z" fill="#5D4037"/>
        <line x1="28" y1="36" x2="52" y2="-10" stroke="#795548" stroke-width="4" stroke-linecap="round"/>
        <circle cx="52" cy="-10" r="5" fill="#F39C12"/>
      </g>
    `
  },

  // 2. 经典色彩
  red: {
    title: 'red',
    category: 'colors',
    bg: '#FDEDEC',
    accent: '#E74C3C',
    svgBody: `
      <!-- Red Apple -->
      <g transform="translate(128, 120)">
        <path d="M0 -34 Q8 -54 18 -58" fill="none" stroke="#795548" stroke-width="6" stroke-linecap="round"/>
        <path d="M8 -48 Q28 -56 24 -36 Q12 -38 8 -48 Z" fill="#4CAF50" stroke="#2E7D32" stroke-width="3"/>
        <path d="M0 -28 C-32 -48 -66 -20 -62 16 C-58 48 -24 58 0 44 C24 58 58 48 62 16 C66 -20 32 -48 0 -28 Z" fill="#E74C3C" stroke="#B03A2E" stroke-width="5"/>
        <ellipse cx="-26" cy="-6" rx="14" ry="24" transform="rotate(-25 -26 -6)" fill="#FF7675" opacity="0.8"/>
        <circle cx="-20" cy="-14" r="5" fill="#FFFFFF" opacity="0.9"/>
      </g>
    `
  },
  yellow: {
    title: 'yellow',
    category: 'colors',
    bg: '#FEFDE8',
    accent: '#F1C40F',
    svgBody: `
      <!-- Smiling Yellow Sun -->
      <g transform="translate(128, 120)">
        <g stroke="#F39C12" stroke-width="6" stroke-linecap="round">
          <line x1="0" y1="-62" x2="0" y2="-48"/>
          <line x1="0" y1="48" x2="0" y2="62"/>
          <line x1="-62" y1="0" x2="-48" y2="0"/>
          <line x1="48" y1="0" x2="62" y2="0"/>
          <line x1="-44" y1="-44" x2="-34" y2="-34"/>
          <line x1="34" y1="34" x2="44" y2="44"/>
          <line x1="44" y1="-44" x2="34" y2="-34"/>
          <line x1="-34" y1="34" x2="-44" y2="44"/>
        </g>
        <circle cx="0" cy="0" r="38" fill="#F1C40F" stroke="#D4AC0D" stroke-width="4"/>
        <circle cx="-12" cy="-6" r="4.5" fill="#2C3E50"/>
        <circle cx="12" cy="-6" r="4.5" fill="#2C3E50"/>
        <path d="M-12 8 Q0 18 12 8" fill="none" stroke="#C0392B" stroke-width="4" stroke-linecap="round"/>
        <circle cx="-20" cy="4" r="6" fill="#E67E22" opacity="0.5"/>
        <circle cx="20" cy="4" r="6" fill="#E67E22" opacity="0.5"/>
      </g>
    `
  },
  blue: {
    title: 'blue',
    category: 'colors',
    bg: '#EBF5FB',
    accent: '#3498DB',
    svgBody: `
      <!-- Glossy Blue Water Droplet -->
      <g transform="translate(128, 120)">
        <path d="M0 -56 C-24 -24 -52 6 -52 30 C-52 56 -28 66 0 66 C28 66 52 56 52 30 C52 6 24 -24 0 -56 Z" fill="#3498DB" stroke="#1F618D" stroke-width="5"/>
        <path d="M-40 38 C-20 48 20 20 44 32 C38 52 20 62 0 62 C-20 62 -36 52 -40 38 Z" fill="#2980B9"/>
        <ellipse cx="-22" cy="12" rx="10" ry="20" transform="rotate(-20 -22 12)" fill="#85C1E9" opacity="0.8"/>
        <circle cx="-16" cy="4" r="5" fill="#FFFFFF" opacity="0.9"/>
      </g>
    `
  },
  green: {
    title: 'green',
    category: 'colors',
    bg: '#EAFAF1',
    accent: '#2ECC71',
    svgBody: `
      <!-- Lucky 4-Leaf Clover -->
      <g transform="translate(128, 120)">
        <path d="M0 10 Q14 48 26 58" fill="none" stroke="#27AE60" stroke-width="6" stroke-linecap="round"/>
        <g stroke="#1E8449" stroke-width="4">
          <path d="M0 0 C-18 -26 0 -48 0 -48 C0 -48 18 -26 0 0 Z" fill="#2ECC71"/>
          <path d="M0 0 C-18 26 0 48 0 48 C0 48 18 26 0 0 Z" fill="#2ECC71"/>
          <path d="M0 0 C-26 -18 -48 0 -48 0 C-48 0 -26 18 0 0 Z" fill="#27AE60"/>
          <path d="M0 0 C26 -18 48 0 48 0 C48 0 26 18 0 0 Z" fill="#27AE60"/>
        </g>
        <circle cx="0" cy="0" r="7" fill="#F1C40F"/>
      </g>
    `
  },
  purple: {
    title: 'purple',
    category: 'colors',
    bg: '#F4ECF7',
    accent: '#9B59B6',
    svgBody: `
      <!-- Juicy Purple Grapes -->
      <g transform="translate(128, 120)">
        <path d="M0 -36 Q-12 -54 -4 -60" fill="none" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
        <path d="M-2 -44 Q20 -54 22 -36 Q8 -34 -2 -44 Z" fill="#27AE60" stroke="#1E8449" stroke-width="3"/>
        <g stroke="#6C3483" stroke-width="3">
          <circle cx="-22" cy="-22" r="15" fill="#9B59B6"/>
          <circle cx="0" cy="-24" r="16" fill="#8E44AD"/>
          <circle cx="22" cy="-22" r="15" fill="#9B59B6"/>
          <circle cx="-14" cy="2" r="16" fill="#8E44AD"/>
          <circle cx="14" cy="2" r="16" fill="#9B59B6"/>
          <circle cx="0" cy="26" r="15" fill="#8E44AD"/>
          <circle cx="0" cy="46" r="12" fill="#9B59B6"/>
        </g>
        <circle cx="-2" cy="-28" r="4" fill="#D7BDE2"/>
        <circle cx="-16" cy="-2" r="4" fill="#D7BDE2"/>
        <circle cx="12" cy="-2" r="4" fill="#D7BDE2"/>
      </g>
    `
  },

  // 3. 基础几何图形
  circle: {
    title: 'circle',
    category: 'shapes',
    bg: '#FDF2E9',
    accent: '#E67E22',
    svgBody: `
      <!-- Cheerful Circle -->
      <g transform="translate(128, 120)">
        <circle cx="0" cy="0" r="54" fill="#E67E22" stroke="#BA4A00" stroke-width="6"/>
        <circle cx="0" cy="0" r="48" fill="#F39C12"/>
        <circle cx="-16" cy="-8" r="6" fill="#2C3E50"/>
        <circle cx="16" cy="-8" r="6" fill="#2C3E50"/>
        <circle cx="-14" cy="-10" r="2" fill="#FFFFFF"/>
        <circle cx="18" cy="-10" r="2" fill="#FFFFFF"/>
        <path d="M-14 10 Q0 24 14 10" fill="none" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
        <path d="M-36 -36 A 50 50 0 0 1 36 -36" fill="none" stroke="#F8C471" stroke-width="6" stroke-linecap="round"/>
      </g>
    `
  },
  triangle: {
    title: 'triangle',
    category: 'shapes',
    bg: '#FEF9E7',
    accent: '#F1C40F',
    svgBody: `
      <!-- Cheerful Triangle -->
      <g transform="translate(128, 122)">
        <polygon points="0,-60 -60,46 60,46" fill="#F1C40F" stroke="#B7950B" stroke-width="6" stroke-linejoin="round"/>
        <polygon points="0,-50 -50,40 50,40" fill="#F7DC6F" stroke="none"/>
        <circle cx="-14" cy="6" r="5" fill="#2C3E50"/>
        <circle cx="14" cy="6" r="5" fill="#2C3E50"/>
        <path d="M-10 20 Q0 28 10 20" fill="none" stroke="#2C3E50" stroke-width="4" stroke-linecap="round"/>
        <circle cx="-22" cy="14" r="5" fill="#E67E22" opacity="0.6"/>
        <circle cx="22" cy="14" r="5" fill="#E67E22" opacity="0.6"/>
      </g>
    `
  },
  square: {
    title: 'square',
    category: 'shapes',
    bg: '#E8F6F3',
    accent: '#1ABC9C',
    svgBody: `
      <!-- Cheerful Square -->
      <g transform="translate(128, 120)">
        <rect x="-50" y="-50" width="100" height="100" rx="14" fill="#1ABC9C" stroke="#117A65" stroke-width="6"/>
        <rect x="-42" y="-42" width="84" height="84" rx="10" fill="#48C9B0"/>
        <circle cx="-16" cy="-8" r="6" fill="#2C3E50"/>
        <circle cx="16" cy="-8" r="6" fill="#2C3E50"/>
        <circle cx="-14" cy="-10" r="2" fill="#FFFFFF"/>
        <circle cx="18" cy="-10" r="2" fill="#FFFFFF"/>
        <path d="M-12 12 Q0 24 12 12" fill="none" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
        <line x1="-36" y1="-34" x2="36" y2="-34" stroke="#A3E4D7" stroke-width="5" stroke-linecap="round"/>
      </g>
    `
  },
  rectangle: {
    title: 'rectangle',
    category: 'shapes',
    bg: '#EAF2F8',
    accent: '#3498DB',
    svgBody: `
      <!-- Cheerful Rectangle -->
      <g transform="translate(128, 120)">
        <rect x="-62" y="-38" width="124" height="76" rx="14" fill="#3498DB" stroke="#1F618D" stroke-width="6"/>
        <rect x="-54" y="-30" width="108" height="60" rx="10" fill="#5DADE2"/>
        <circle cx="-18" cy="-4" r="6" fill="#2C3E50"/>
        <circle cx="18" cy="-4" r="6" fill="#2C3E50"/>
        <path d="M-12 12 Q0 22 12 12" fill="none" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
        <line x1="-46" y1="-22" x2="46" y2="-22" stroke="#AED6F1" stroke-width="5" stroke-linecap="round"/>
      </g>
    `
  },

  // 4. 玩具与交通工具
  doll: {
    title: 'doll',
    category: 'toys',
    bg: '#FDEDEC',
    accent: '#E91E63',
    svgBody: `
      <!-- Cute Ragdoll -->
      <g transform="translate(128, 120)">
        <circle cx="-28" cy="-24" r="14" fill="#F39C12" stroke="#D68910" stroke-width="3"/>
        <circle cx="28" cy="-24" r="14" fill="#F39C12" stroke="#D68910" stroke-width="3"/>
        <path d="M-28 48 L-14 4 L14 4 L28 48 Z" fill="#FF4081" stroke="#C2185B" stroke-width="4"/>
        <path d="M-10 18 Q0 28 10 18" stroke="#FFFFFF" stroke-width="3" fill="none"/>
        <circle cx="0" cy="-20" r="26" fill="#FFE0B2" stroke="#FFCC80" stroke-width="3"/>
        <path d="M-24 -30 Q0 -14 24 -30 Q16 -46 0 -46 Q-16 -46 -24 -30 Z" fill="#F39C12"/>
        <circle cx="-10" cy="-18" r="3.5" fill="#2C3E50"/>
        <circle cx="10" cy="-18" r="3.5" fill="#2C3E50"/>
        <path d="M-6 -8 Q0 -2 6 -8" fill="none" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
        <circle cx="-16" cy="-12" r="4.5" fill="#FF80AB" opacity="0.6"/>
        <circle cx="16" cy="-12" r="4.5" fill="#FF80AB" opacity="0.6"/>
        <path d="M0 -42 L-10 -48 L-10 -36 Z M0 -42 L10 -48 L10 -36 Z" fill="#E91E63"/>
        <circle cx="0" cy="-42" r="4" fill="#C2185B"/>
      </g>
    `
  },
  ball: {
    title: 'ball',
    category: 'toys',
    bg: '#E8F8F5',
    accent: '#2ECC71',
    svgBody: `
      <!-- Colorful Beach/Play Ball -->
      <g transform="translate(128, 120)">
        <circle cx="0" cy="0" r="54" fill="#FFFFFF" stroke="#2C3E50" stroke-width="5"/>
        <path d="M0 -54 A 54 54 0 0 1 54 0 L0 0 Z" fill="#E74C3C"/>
        <path d="M54 0 A 54 54 0 0 1 0 54 L0 0 Z" fill="#F1C40F"/>
        <path d="M0 54 A 54 54 0 0 1 -54 0 L0 0 Z" fill="#3498DB"/>
        <path d="M-54 0 A 54 54 0 0 1 0 -54 L0 0 Z" fill="#2ECC71"/>
        <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#2C3E50" stroke-width="4"/>
        <circle cx="0" cy="0" r="8" fill="#9B59B6"/>
        <ellipse cx="-20" cy="-24" rx="8" ry="14" transform="rotate(-30 -20 -24)" fill="#FFFFFF" opacity="0.75"/>
      </g>
    `
  },
  car: {
    title: 'car',
    category: 'toys',
    bg: '#FEF5E7',
    accent: '#E74C3C',
    svgBody: `
      <!-- Cute Red Toy Car -->
      <g transform="translate(128, 120)">
        <path d="M-36 -8 Q-24 -42 0 -42 Q24 -42 36 -8 Z" fill="#C0392B" stroke="#922B21" stroke-width="4"/>
        <path d="M-28 -8 Q-18 -34 -4 -34 L-4 -8 Z" fill="#D6EAF8"/>
        <path d="M4 -8 L4 -34 Q18 -34 28 -8 Z" fill="#D6EAF8"/>
        <rect x="-58" y="-8" width="116" height="32" rx="10" fill="#E74C3C" stroke="#922B21" stroke-width="4"/>
        <circle cx="-54" cy="2" r="5" fill="#F1C40F"/>
        <circle cx="54" cy="2" r="5" fill="#F1C40F"/>
        <rect x="-62" y="16" width="124" height="6" rx="3" fill="#BDC3C7"/>
        <g stroke="#17202A" stroke-width="4">
          <circle cx="-34" cy="26" r="16" fill="#2C3E50"/>
          <circle cx="-34" cy="26" r="7" fill="#BDC3C7"/>
          <circle cx="34" cy="26" r="16" fill="#2C3E50"/>
          <circle cx="34" cy="26" r="7" fill="#BDC3C7"/>
        </g>
      </g>
    `
  },
  train: {
    title: 'train',
    category: 'toys',
    bg: '#EBF5FB',
    accent: '#2980B9',
    svgBody: `
      <!-- Cute Steam Train -->
      <g transform="translate(128, 120)">
        <circle cx="-32" cy="-56" r="8" fill="#BDC3C7" opacity="0.7"/>
        <circle cx="-22" cy="-66" r="11" fill="#BDC3C7" opacity="0.6"/>
        <circle cx="-8" cy="-76" r="14" fill="#BDC3C7" opacity="0.5"/>
        <rect x="-40" y="-44" width="16" height="24" rx="2" fill="#E67E22" stroke="#BA4A00" stroke-width="3"/>
        <polygon points="-44,-44 -20,-44 -24,-36 -40,-36" fill="#D35400"/>
        <rect x="0" y="-42" width="48" height="56" rx="6" fill="#2980B9" stroke="#1B4F72" stroke-width="4"/>
        <rect x="10" y="-32" width="28" height="20" rx="4" fill="#AED6F1" stroke="#1B4F72" stroke-width="3"/>
        <rect x="-52" y="-20" width="56" height="34" rx="6" fill="#27AE60" stroke="#1E8449" stroke-width="4"/>
        <circle cx="-54" cy="-4" r="6" fill="#F1C40F" stroke="#B7950B" stroke-width="3"/>
        <rect x="-56" y="14" width="108" height="10" rx="3" fill="#E74C3C" stroke="#B03A2E" stroke-width="3"/>
        <g stroke="#1B2631" stroke-width="4">
          <circle cx="-36" cy="28" r="13" fill="#34495E"/>
          <circle cx="-36" cy="28" r="5" fill="#BDC3C7"/>
          <circle cx="-6" cy="28" r="13" fill="#34495E"/>
          <circle cx="-6" cy="28" r="5" fill="#BDC3C7"/>
          <circle cx="26" cy="26" r="15" fill="#34495E"/>
          <circle cx="26" cy="26" r="6" fill="#BDC3C7"/>
        </g>
      </g>
    `
  },
  bike: {
    title: 'bike',
    category: 'toys',
    bg: '#E8F8F5',
    accent: '#16A085',
    svgBody: `
      <!-- Cute Bicycle -->
      <g transform="translate(128, 122)">
        <g stroke="#2C3E50" stroke-width="4">
          <circle cx="-42" cy="18" r="26" fill="none"/>
          <circle cx="-42" cy="18" r="6" fill="#BDC3C7"/>
          <circle cx="42" cy="18" r="26" fill="none"/>
          <circle cx="42" cy="18" r="6" fill="#BDC3C7"/>
        </g>
        <g stroke="#95A5A6" stroke-width="2">
          <line x1="-42" y1="-8" x2="-42" y2="44"/>
          <line x1="-68" y1="18" x2="-16" y2="18"/>
          <line x1="42" y1="-8" x2="42" y2="44"/>
          <line x1="16" y1="18" x2="68" y2="18"/>
        </g>
        <g stroke="#E74C3C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
          <line x1="-42" y1="18" x2="-10" y2="18"/>
          <line x1="-10" y1="18" x2="-18" y2="-16"/>
          <line x1="-42" y1="18" x2="-18" y2="-16"/>
          <line x1="-18" y1="-16" x2="16" y2="-16"/>
          <line x1="-10" y1="18" x2="26" y2="-6"/>
          <line x1="16" y1="-16" x2="42" y2="18"/>
          <line x1="26" y1="-6" x2="34" y2="-32"/>
        </g>
        <path d="M-30 -18 L-8 -18" stroke="#2C3E50" stroke-width="8" stroke-linecap="round"/>
        <path d="M26 -32 L40 -32 L44 -26" fill="none" stroke="#2C3E50" stroke-width="5" stroke-linecap="round"/>
        <rect x="36" y="-30" width="16" height="14" rx="2" fill="#F39C12"/>
      </g>
    `
  },
  teddy: {
    title: 'teddy',
    category: 'toys',
    bg: '#FEF9E7',
    accent: '#D35400',
    svgBody: `
      <!-- Super Cute Teddy Bear -->
      <g transform="translate(128, 120)">
        <circle cx="-32" cy="-42" r="16" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <circle cx="-32" cy="-42" r="9" fill="#D7CCC8"/>
        <circle cx="32" cy="-42" r="16" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <circle cx="32" cy="-42" r="9" fill="#D7CCC8"/>
        <circle cx="-38" cy="14" r="14" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <circle cx="38" cy="14" r="14" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <ellipse cx="-26" cy="48" rx="14" ry="12" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <ellipse cx="-26" cy="48" rx="8" ry="7" fill="#D7CCC8"/>
        <ellipse cx="26" cy="48" rx="14" ry="12" fill="#8D6E63" stroke="#5D4037" stroke-width="3"/>
        <ellipse cx="26" cy="48" rx="8" ry="7" fill="#D7CCC8"/>
        <ellipse cx="0" cy="18" rx="34" ry="32" fill="#8D6E63" stroke="#5D4037" stroke-width="4"/>
        <ellipse cx="0" cy="18" rx="20" ry="18" fill="#D7CCC8"/>
        <circle cx="0" cy="-22" r="34" fill="#8D6E63" stroke="#5D4037" stroke-width="4"/>
        <ellipse cx="0" cy="-14" rx="16" ry="12" fill="#D7CCC8"/>
        <polygon points="-5,-18 5,-18 0,-13" fill="#3E2723"/>
        <path d="M0 -13 L0 -8 M-5 -8 Q0 -4 5 -8" fill="none" stroke="#3E2723" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="-14" cy="-26" r="4.5" fill="#3E2723"/>
        <circle cx="-12" cy="-28" r="1.5" fill="#FFFFFF"/>
        <circle cx="14" cy="-26" r="4.5" fill="#3E2723"/>
        <circle cx="16" cy="-28" r="1.5" fill="#FFFFFF"/>
        <polygon points="0,-4 -12,-10 -12,2" fill="#E74C3C"/>
        <polygon points="0,-4 12,-10 12,2" fill="#E74C3C"/>
        <circle cx="0" cy="-4" r="4" fill="#C0392B"/>
      </g>
    `
  }
};

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
    <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Comic Sans MS', sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
  </g>
</svg>
`;
}

function generateItemSvg(key, meta) {
  const { title, accent, svgBody } = meta;
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
  const svgDir = path.resolve('public/images/words');
  const itemsDir = path.join(svgDir, 'items');
  const audioDir = path.resolve('public/audio/words');

  await fs.mkdir(svgDir, { recursive: true });
  await fs.mkdir(itemsDir, { recursive: true });
  await fs.mkdir(audioDir, { recursive: true });

  const chromePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const tmpHtml = '/tmp/render_word_card.html';

  console.log('Generating 21 vector SVG tokens and standalone item pictures...');

  for (const [key, meta] of Object.entries(WORDS_META)) {
    // 1. 生成 3D 泡泡专用的圆形徽章卡 (带外圈与底部标牌)
    const tokenSvg = generateFullSvg(key, meta);
    const tokenSvgPath = path.join(svgDir, `${key}.svg`);
    const tokenPngPath = path.join(svgDir, `${key}.png`);
    await fs.writeFile(tokenSvgPath, tokenSvg, 'utf8');

    const htmlToken = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html, body { width: 256px; height: 256px; background: transparent; overflow: hidden; } svg { width: 256px; height: 256px; display: block; }</style></head><body>${tokenSvg}</body></html>`;
    await fs.writeFile(tmpHtml, htmlToken, 'utf8');
    try {
      execFileSync(chromePath, ['--headless', '--disable-gpu', `--screenshot=${tokenPngPath}`, '--window-size=256,256', '--default-background-color=00000000', `file://${tmpHtml}`], { stdio: 'pipe' });
    } catch (e) {
      console.warn(`Chrome token render error on ${key}: ${e.message}`);
    }

    // 2. 生成划破泡泡时弹出的纯实物物品大图 (无圆框、无底部标牌、大比例透明背景实物照片感)
    const itemSvg = generateItemSvg(key, meta);
    const itemSvgPath = path.join(itemsDir, `${key}.svg`);
    const itemPngPath = path.join(itemsDir, `${key}.png`);
    await fs.writeFile(itemSvgPath, itemSvg, 'utf8');

    const htmlItem = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html, body { width: 256px; height: 256px; background: transparent; overflow: hidden; } svg { width: 256px; height: 256px; display: block; }</style></head><body>${itemSvg}</body></html>`;
    await fs.writeFile(tmpHtml, htmlItem, 'utf8');
    try {
      execFileSync(chromePath, ['--headless', '--disable-gpu', `--screenshot=${itemPngPath}`, '--window-size=256,256', '--default-background-color=00000000', `file://${tmpHtml}`], { stdio: 'pipe' });
      console.log(`✓ Rendered: ${key} -> token (${path.basename(tokenPngPath)}) & item (${path.basename(itemPngPath)})`);
    } catch (e) {
      console.warn(`Chrome item render error on ${key}: ${e.message}`);
    }

    // 3. 生成/检验高清标准发音音频 (Samantha + ffmpeg)
    const mp3Path = path.join(audioDir, `${key}.mp3`);
    let needAudio = false;
    try {
      const st = await fs.stat(mp3Path);
      if (st.size < 2000) needAudio = true;
    } catch {
      needAudio = true;
    }

    if (needAudio) {
      const aiffTmp = `/tmp/word_gen_${key}.aiff`;
      const spoken = key.charAt(0).toUpperCase() + key.slice(1);
      execSync(`say -v Samantha "${spoken}" -o "${aiffTmp}"`);
      execSync(`ffmpeg -y -i "${aiffTmp}" -af "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-50dB,areverse,volume=1.8" -ar 44100 -b:a 128k "${mp3Path}" 2>/dev/null`);
      console.log(`✓ Generated audio: ${key}.mp3`);
    }
  }

  const manifestPath = path.join(svgDir, 'words-manifest.json');
  const manifest = Object.entries(WORDS_META).map(([id, meta]) => ({
    id,
    word: meta.title,
    category: meta.category,
    image: `/images/words/items/${id}.png`,
    bubbleImage: `/images/words/${id}.png`,
    svg: `/images/words/items/${id}.svg`,
    bubbleSvg: `/images/words/${id}.svg`,
    audio: `/audio/words/${id}.mp3`,
    accent: meta.accent
  }));

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest created: ${manifestPath} (${manifest.length} words total)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
