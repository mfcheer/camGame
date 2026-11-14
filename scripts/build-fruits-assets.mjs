import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const FRUITS_ART = {
  apple: {
    title: 'apple',
    zh: '苹果',
    bg: '#FDEDEC',
    accent: '#E74C3C',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FF6B6B"/>
            <stop offset="70%" stop-color="#E74C3C"/>
            <stop offset="100%" stop-color="#C0392B"/>
          </radialGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#27AE60"/>
          </linearGradient>
        </defs>
        <path d="M0 -58 C-2 -78 12 -92 20 -96 C16 -90 14 -76 10 -58" fill="#795548" stroke="#5D4037" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M12 -76 C32 -96 68 -88 72 -68 C52 -60 28 -68 12 -76 Z" fill="url(#leafGrad)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <path d="M16 -74 Q42 -76 66 -70" fill="none" stroke="#A9DFBF" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M0 -46 C-32 -54 -76 -32 -76 16 C-76 64 -38 88 0 78 C38 88 76 64 76 16 C76 -32 32 -54 0 -46 Z" fill="url(#appleGrad)" stroke="#922B21" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M-12 -46 Q0 -40 12 -46" fill="none" stroke="#78281F" stroke-width="3" stroke-linecap="round"/>
        <path d="M-52 -18 C-56 6 -46 36 -32 50 C-38 34 -42 6 -36 -14 C-34 -24 -44 -26 -52 -18 Z" fill="#FFFFFF" opacity="0.6"/>
        <circle cx="-32" cy="-28" r="6" fill="#FFFFFF" opacity="0.75"/>
      </g>
    `
  },
  banana: {
    title: 'banana',
    zh: '香蕉',
    bg: '#FEF9E7',
    accent: '#F1C40F',
    svgBody: `
      <g transform="translate(128, 128) rotate(-15)">
        <defs>
          <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFF176"/>
            <stop offset="50%" stop-color="#F1C40F"/>
            <stop offset="100%" stop-color="#F39C12"/>
          </linearGradient>
        </defs>
        <path d="M-72 -56 L-84 -70 L-72 -76 L-62 -62 Z" fill="#7CB342" stroke="#558B2F" stroke-width="3"/>
        <path d="M-66 -58 C-10 -72 68 -24 82 52 C84 62 76 68 68 62 C50 0 -12 -38 -64 -44 Z" fill="url(#bananaGrad)" stroke="#B7950B" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M-64 -44 C-12 -36 46 8 64 56" fill="none" stroke="#F5B041" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M80 50 L90 62 L82 66 L74 58 Z" fill="#5D4037" stroke="#3E2723" stroke-width="2.5"/>
        <path d="M-48 -54 C-6 -56 52 -18 64 36" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
      </g>
    `
  },
  watermelon: {
    title: 'watermelon',
    zh: '西瓜',
    bg: '#EAFAF1',
    accent: '#27AE60',
    svgBody: `
      <g transform="translate(128, 134)">
        <defs>
          <linearGradient id="rindGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1E8449"/>
            <stop offset="50%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#1E8449"/>
          </linearGradient>
          <radialGradient id="melonGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FF6B81"/>
            <stop offset="70%" stop-color="#FF4757"/>
            <stop offset="100%" stop-color="#EE5253"/>
          </radialGradient>
        </defs>
        <path d="M-84 -10 C-74 68 74 68 84 -10 L72 -14 C62 54 -62 54 -72 -14 Z" fill="url(#rindGrad)" stroke="#196F3D" stroke-width="4" stroke-linejoin="round"/>
        <path d="M-72 -14 C-62 54 62 54 72 -14 L66 -18 C56 46 -56 46 -66 -18 Z" fill="#E8F8F5" stroke="none"/>
        <path d="M-70 -20 Q0 8 70 -20 C60 42 -60 42 -70 -20 Z" fill="url(#melonGrad)" stroke="#C0392B" stroke-width="3.5" stroke-linejoin="round"/>
        <g fill="#2C3E50" stroke="#1A252F" stroke-width="1.5">
          <path d="M-42 6 C-44 2 -40 -2 -38 0 C-36 2 -38 8 -42 6 Z"/>
          <path d="M-20 18 C-22 14 -18 10 -16 12 C-14 14 -16 20 -20 18 Z"/>
          <path d="M0 22 C-2 18 2 14 4 16 C6 18 4 24 0 22 Z"/>
          <path d="M22 18 C20 14 24 10 26 12 C28 14 26 20 22 18 Z"/>
          <path d="M44 6 C42 2 46 -2 48 0 C50 2 48 8 44 6 Z"/>
          <path d="M-24 -4 C-26 -8 -22 -12 -20 -10 C-18 -8 -20 -2 -24 -4 Z"/>
          <path d="M24 -4 C22 -8 26 -12 28 -10 C30 -8 28 -2 24 -4 Z"/>
        </g>
        <ellipse cx="-46" cy="-12" rx="14" ry="4" transform="rotate(-15 -46 -12)" fill="#FFFFFF" opacity="0.55"/>
      </g>
    `
  },
  grape: {
    title: 'grape',
    zh: '葡萄',
    bg: '#F4ECF7',
    accent: '#8E44AD',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <radialGradient id="grapeGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#D7BDE2"/>
            <stop offset="35%" stop-color="#9B59B6"/>
            <stop offset="100%" stop-color="#6C3483"/>
          </radialGradient>
          <linearGradient id="grapeLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#27AE60"/>
          </linearGradient>
        </defs>
        <path d="M0 -64 C-4 -82 6 -92 12 -96" fill="none" stroke="#795548" stroke-width="5" stroke-linecap="round"/>
        <path d="M8 -86 C24 -96 32 -76 22 -68 C16 -62 6 -66 8 -74" fill="none" stroke="#27AE60" stroke-width="3" stroke-linecap="round"/>
        <path d="M-4 -70 C-28 -90 -64 -84 -58 -58 C-54 -40 -34 -52 -18 -56 C-24 -44 -8 -38 0 -54 Z" fill="url(#grapeLeaf)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <g stroke="#512E5F" stroke-width="3.5">
          <circle cx="-34" cy="-38" r="18" fill="url(#grapeGrad)"/>
          <circle cx="0" cy="-42" r="18" fill="url(#grapeGrad)"/>
          <circle cx="34" cy="-38" r="18" fill="url(#grapeGrad)"/>
          <circle cx="-48" cy="-12" r="18" fill="url(#grapeGrad)"/>
          <circle cx="-16" cy="-16" r="19" fill="url(#grapeGrad)"/>
          <circle cx="20" cy="-16" r="19" fill="url(#grapeGrad)"/>
          <circle cx="48" cy="-12" r="18" fill="url(#grapeGrad)"/>
          <circle cx="-32" cy="14" r="18" fill="url(#grapeGrad)"/>
          <circle cx="2" cy="12" r="19" fill="url(#grapeGrad)"/>
          <circle cx="34" cy="14" r="18" fill="url(#grapeGrad)"/>
          <circle cx="-16" cy="40" r="17" fill="url(#grapeGrad)"/>
          <circle cx="18" cy="40" r="17" fill="url(#grapeGrad)"/>
          <circle cx="0" cy="64" r="16" fill="url(#grapeGrad)"/>
        </g>
        <g fill="#FFFFFF" opacity="0.65">
          <circle cx="-38" cy="-42" r="4"/>
          <circle cx="-4" cy="-46" r="4"/>
          <circle cx="30" cy="-42" r="4"/>
          <circle cx="-20" cy="-20" r="4.5"/>
          <circle cx="16" cy="-20" r="4.5"/>
          <circle cx="-2" cy="8" r="4.5"/>
          <circle cx="-4" cy="60" r="3.5"/>
        </g>
      </g>
    `
  },
  strawberry: {
    title: 'strawberry',
    zh: '草莓',
    bg: '#FDEDEC',
    accent: '#FF4757',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <radialGradient id="strawGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FF6B81"/>
            <stop offset="60%" stop-color="#FF4757"/>
            <stop offset="100%" stop-color="#C0392B"/>
          </radialGradient>
          <linearGradient id="calyxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ED573"/>
            <stop offset="100%" stop-color="#26AF61"/>
          </linearGradient>
        </defs>
        <path d="M0 -42 C-46 -42 -72 -14 -64 24 C-56 58 -24 82 0 88 C24 82 56 58 64 24 C72 -14 46 -42 0 -42 Z" fill="url(#strawGrad)" stroke="#962D24" stroke-width="4.5" stroke-linejoin="round"/>
        <g fill="url(#calyxGrad)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round">
          <path d="M0 -42 C-14 -72 -42 -66 -48 -44 C-36 -46 -24 -44 -14 -38 Z"/>
          <path d="M0 -42 C14 -72 42 -66 48 -44 C36 -46 24 -44 14 -38 Z"/>
          <path d="M0 -42 C-8 -78 8 -78 0 -42 Z"/>
          <path d="M-24 -40 C-56 -52 -62 -28 -42 -26 C-34 -32 -26 -36 -24 -40 Z"/>
          <path d="M24 -40 C56 -52 62 -28 42 -26 C34 -32 26 -36 24 -40 Z"/>
        </g>
        <path d="M0 -44 C-2 -62 4 -72 8 -76" fill="none" stroke="#26AF61" stroke-width="4" stroke-linecap="round"/>
        <g fill="#F9CA24" stroke="#D4AC0D" stroke-width="1.2">
          <ellipse cx="-34" cy="-6" rx="2.5" ry="4" transform="rotate(-15 -34 -6)"/>
          <ellipse cx="-12" cy="-12" rx="2.5" ry="4" transform="rotate(-5 -12 -12)"/>
          <ellipse cx="14" cy="-12" rx="2.5" ry="4" transform="rotate(5 14 -12)"/>
          <ellipse cx="36" cy="-6" rx="2.5" ry="4" transform="rotate(15 36 -6)"/>
          <ellipse cx="-40" cy="18" rx="2.5" ry="4" transform="rotate(-20 -40 18)"/>
          <ellipse cx="-18" cy="14" rx="2.5" ry="4" transform="rotate(-8 -18 14)"/>
          <ellipse cx="12" cy="14" rx="2.5" ry="4" transform="rotate(8 12 14)"/>
          <ellipse cx="38" cy="18" rx="2.5" ry="4" transform="rotate(20 38 18)"/>
          <ellipse cx="-24" cy="40" rx="2.5" ry="4" transform="rotate(-12 -24 40)"/>
          <ellipse cx="0" cy="38" rx="2.5" ry="4"/>
          <ellipse cx="24" cy="40" rx="2.5" ry="4" transform="rotate(12 24 40)"/>
          <ellipse cx="-10" cy="62" rx="2.2" ry="3.5" transform="rotate(-6 -10 62)"/>
          <ellipse cx="10" cy="62" rx="2.2" ry="3.5" transform="rotate(6 10 62)"/>
          <ellipse cx="0" cy="76" rx="2" ry="3"/>
        </g>
        <path d="M-44 -12 C-48 8 -42 28 -32 40 C-36 28 -40 10 -36 -6 Z" fill="#FFFFFF" opacity="0.6"/>
      </g>
    `
  },
  peach: {
    title: 'peach',
    zh: '桃子',
    bg: '#FDF2E9',
    accent: '#FFAAA6',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <radialGradient id="peachGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFEAA7"/>
            <stop offset="40%" stop-color="#FFAAA6"/>
            <stop offset="85%" stop-color="#FF6B81"/>
            <stop offset="100%" stop-color="#EE5253"/>
          </radialGradient>
          <linearGradient id="peachLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#27AE60"/>
          </linearGradient>
        </defs>
        <path d="M0 -54 C-2 -72 6 -82 10 -86" fill="none" stroke="#795548" stroke-width="4" stroke-linecap="round"/>
        <path d="M4 -66 C28 -82 58 -74 62 -56 C46 -50 24 -56 6 -64 Z" fill="url(#peachLeaf)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-4 -64 C-28 -80 -56 -70 -58 -52 C-42 -48 -22 -54 -4 -62 Z" fill="url(#peachLeaf)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <path d="M0 -48 C-44 -56 -78 -24 -76 22 C-74 66 -36 86 0 74 C36 86 74 66 76 22 C78 -24 44 -56 0 -48 Z" fill="url(#peachGrad)" stroke="#C0392B" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M0 -48 C-8 -20 -10 18 0 74" fill="none" stroke="#C0392B" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <ellipse cx="-42" cy="-8" rx="14" ry="24" transform="rotate(-25 -42 -8)" fill="#FFFFFF" opacity="0.45"/>
        <circle cx="-28" cy="-22" r="6" fill="#FFFFFF" opacity="0.65"/>
      </g>
    `
  },
  pear: {
    title: 'pear',
    zh: '梨',
    bg: '#F9FBE7',
    accent: '#70C1B3',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <radialGradient id="pearGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#F9FBE7"/>
            <stop offset="40%" stop-color="#D4E157"/>
            <stop offset="85%" stop-color="#9CCC65"/>
            <stop offset="100%" stop-color="#7CB342"/>
          </radialGradient>
          <linearGradient id="pearLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ECC71"/>
            <stop offset="100%" stop-color="#27AE60"/>
          </linearGradient>
        </defs>
        <path d="M0 -62 C2 -82 16 -92 24 -96 C20 -90 14 -76 10 -60" fill="#795548" stroke="#5D4037" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M14 -76 C36 -92 64 -80 64 -64 C48 -58 28 -66 14 -76 Z" fill="url(#pearLeaf)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <path d="M0 -54 C-24 -54 -38 -24 -42 4 C-46 32 -74 36 -74 54 C-74 82 -38 92 0 92 C38 92 74 82 74 54 C74 36 46 32 42 4 C38 -24 24 -54 0 -54 Z" fill="url(#pearGrad)" stroke="#558B2F" stroke-width="4.5" stroke-linejoin="round"/>
        <g fill="#827717" opacity="0.4">
          <circle cx="-26" cy="46" r="1.8"/>
          <circle cx="-42" cy="62" r="1.8"/>
          <circle cx="-14" cy="72" r="1.8"/>
          <circle cx="18" cy="54" r="1.8"/>
          <circle cx="38" cy="66" r="1.8"/>
          <circle cx="48" cy="48" r="1.8"/>
          <circle cx="-18" cy="18" r="1.8"/>
          <circle cx="22" cy="22" r="1.8"/>
        </g>
        <path d="M-22 -34 C-34 -14 -36 16 -50 44" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity="0.6"/>
        <circle cx="-18" cy="-28" r="5" fill="#FFFFFF" opacity="0.75"/>
      </g>
    `
  },
  cherry: {
    title: 'cherry',
    zh: '樱桃',
    bg: '#FDEDEC',
    accent: '#C0392B',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <radialGradient id="cherryGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FF6B81"/>
            <stop offset="50%" stop-color="#EE5253"/>
            <stop offset="100%" stop-color="#962D24"/>
          </radialGradient>
          <linearGradient id="cherryLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2ED573"/>
            <stop offset="100%" stop-color="#26AF61"/>
          </linearGradient>
        </defs>
        <path d="M-2 -78 C18 -98 52 -92 56 -74 C40 -68 18 -74 -2 -78 Z" fill="url(#cherryLeaf)" stroke="#1E8449" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-2 -76 C-18 -50 -44 -26 -44 14" fill="none" stroke="#26AF61" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M-2 -76 C12 -48 38 -20 40 18" fill="none" stroke="#26AF61" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="-44" cy="34" r="32" fill="url(#cherryGrad)" stroke="#78281F" stroke-width="4.5"/>
        <path d="M-50 14 Q-44 18 -38 14" fill="none" stroke="#5D1E16" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="-54" cy="24" rx="7" ry="12" transform="rotate(-30 -54 24)" fill="#FFFFFF" opacity="0.7"/>
        <circle cx="-38" cy="46" r="3" fill="#FFFFFF" opacity="0.5"/>
        <circle cx="40" cy="38" r="32" fill="url(#cherryGrad)" stroke="#78281F" stroke-width="4.5"/>
        <path d="M34 18 Q40 22 46 18" fill="none" stroke="#5D1E16" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="30" cy="28" rx="7" ry="12" transform="rotate(-30 30 28)" fill="#FFFFFF" opacity="0.7"/>
        <circle cx="48" cy="50" r="3" fill="#FFFFFF" opacity="0.5"/>
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
    <text x="0" y="5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Comic Sans MS', sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
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
  const tmpHtml = '/tmp/render_fruit_asset.html';

  console.log('Building SVG and PNG assets for 8 common fruits...');

  for (const [key, meta] of Object.entries(FRUITS_ART)) {
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

  console.log('All 8 fruits assets successfully created!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
