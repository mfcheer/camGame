import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DRINKS_ART = {
  water: {
    title: 'water',
    zh: '水',
    bg: '#EBF5FB',
    accent: '#3498DB',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="cupGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#E8F8F5" stop-opacity="0.85"/>
            <stop offset="30%" stop-color="#D4E6F1" stop-opacity="0.6"/>
            <stop offset="70%" stop-color="#EBF5FB" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#AED6F1" stop-opacity="0.9"/>
          </linearGradient>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#5DADE2"/>
            <stop offset="50%" stop-color="#3498DB"/>
            <stop offset="100%" stop-color="#2980B9"/>
          </linearGradient>
          <linearGradient id="strawGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FF7675"/>
            <stop offset="100%" stop-color="#D63031"/>
          </linearGradient>
        </defs>
        <!-- Straw -->
        <path d="M12 -86 L28 -42 L24 46" fill="none" stroke="url(#strawGrad)" stroke-width="8" stroke-linecap="round"/>
        <path d="M14 -80 L18 -70 M22 -58 L25 -48 M26 -30 L26 -20 M25 0 L25 10 M24 30 L24 40" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>

        <!-- Glass Cup Body -->
        <path d="M-46 -52 L-36 68 C-34 78 34 78 36 68 L46 -52 Z" fill="url(#cupGrad)" stroke="#2980B9" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Water inside -->
        <path d="M-40 -12 Q-20 -20 0 -12 Q20 -4 40 -12 L34 66 C32 74 -32 74 -34 66 Z" fill="url(#waterGrad)" stroke="#1F618D" stroke-width="3"/>

        <!-- Water surface ellipse highlight -->
        <ellipse cx="0" cy="-12" rx="39" ry="8" fill="#85C1E9" opacity="0.65"/>
        <ellipse cx="0" cy="-12" rx="28" ry="4" fill="#EBF5FB" opacity="0.85"/>

        <!-- Bubbles in water -->
        <circle cx="-16" cy="38" r="5" fill="#EBF5FB" opacity="0.75"/>
        <circle cx="14" cy="22" r="4" fill="#EBF5FB" opacity="0.75"/>
        <circle cx="-6" cy="12" r="3.5" fill="#EBF5FB" opacity="0.75"/>
        <circle cx="18" cy="46" r="3" fill="#EBF5FB" opacity="0.75"/>

        <!-- Glass reflection highlight -->
        <path d="M-38 -44 L-30 60" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.75"/>
        <circle cx="-38" cy="-48" r="3" fill="#FFFFFF" opacity="0.9"/>

        <!-- Cute water drops -->
        <path d="M54 -16 C54 -24 64 -34 64 -34 C64 -34 74 -24 74 -16 C74 -10 70 -6 64 -6 C58 -6 54 -10 54 -16 Z" fill="#3498DB" stroke="#1F618D" stroke-width="2.5"/>
        <circle cx="62" cy="-14" r="2.5" fill="#FFFFFF" opacity="0.8"/>
      </g>
    `
  },
  milk: {
    title: 'milk',
    zh: '牛奶',
    bg: '#EBF5FB',
    accent: '#4A90E2',
    svgBody: `
      <g transform="translate(128, 126)">
        <defs>
          <linearGradient id="milkCartonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="70%" stop-color="#F4F6F6"/>
            <stop offset="100%" stop-color="#EAEDED"/>
          </linearGradient>
          <linearGradient id="milkBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5DADE2"/>
            <stop offset="100%" stop-color="#3498DB"/>
          </linearGradient>
        </defs>

        <!-- Carton Gable Top -->
        <path d="M-36 -46 L0 -82 L36 -46 Z" fill="#2980B9" stroke="#1B4F72" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M-8 -82 L-8 -92 L8 -92 L8 -82 Z" fill="#3498DB" stroke="#1B4F72" stroke-width="3" stroke-linejoin="round"/>

        <!-- Carton Main Body -->
        <rect x="-42" y="-46" width="84" height="126" rx="10" fill="url(#milkCartonGrad)" stroke="#1B4F72" stroke-width="4.5"/>

        <!-- Blue header banner on carton -->
        <path d="M-40 -44 L40 -44 L40 -12 L-40 -12 Z" fill="url(#milkBlueGrad)"/>
        <text x="0" y="-22" font-family="-apple-system, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MILK</text>

        <!-- Cow spots on carton -->
        <path d="M-40 20 C-26 14 -20 30 -28 42 C-38 46 -40 38 -40 20 Z" fill="#34495E"/>
        <path d="M40 34 C26 28 22 48 30 58 C38 62 40 54 40 34 Z" fill="#34495E"/>
        <path d="M-6 60 C4 54 12 66 6 76 C-4 78 -10 70 -6 60 Z" fill="#34495E"/>

        <!-- Cute smiling milk glass beside carton -->
        <g transform="translate(38, 42) scale(0.68)">
          <path d="M-20 -28 L-14 36 C-12 42 12 42 14 36 L20 -28 Z" fill="#EBF5FB" stroke="#2980B9" stroke-width="4"/>
          <path d="M-16 -8 L-12 34 C-10 38 10 38 12 34 L16 -8 Z" fill="#FFFFFF"/>
          <circle cx="-6" cy="10" r="2.5" fill="#2C3E50"/>
          <circle cx="6" cy="10" r="2.5" fill="#2C3E50"/>
          <path d="M-3 16 Q0 20 3 16" fill="none" stroke="#2C3E50" stroke-width="2" stroke-linecap="round"/>
          <circle cx="-9" cy="14" r="3" fill="#FF7675" opacity="0.6"/>
          <circle cx="9" cy="14" r="3" fill="#FF7675" opacity="0.6"/>
        </g>

        <!-- Cute Milk drop on left -->
        <path d="M-52 64 C-52 56 -44 48 -44 48 C-44 48 -36 56 -36 64 C-36 69 -40 73 -44 73 C-48 73 -52 69 -52 64 Z" fill="#FFFFFF" stroke="#3498DB" stroke-width="2.5"/>
      </g>
    `
  },
  juice: {
    title: 'juice',
    zh: '果汁',
    bg: '#FEF5E7',
    accent: '#FF9F43',
    svgBody: `
      <g transform="translate(128, 128)">
        <defs>
          <linearGradient id="juiceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFC048"/>
            <stop offset="50%" stop-color="#FF9F43"/>
            <stop offset="100%" stop-color="#EE5A24"/>
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#FFF5EB" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#FFEAA7" stop-opacity="0.75"/>
          </linearGradient>
          <radialGradient id="orangeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFDD59"/>
            <stop offset="70%" stop-color="#FFA801"/>
            <stop offset="100%" stop-color="#FF5E57"/>
          </radialGradient>
        </defs>

        <!-- Straw -->
        <path d="M-10 -90 L16 -40 L12 40" fill="none" stroke="#2ED573" stroke-width="8" stroke-linecap="round"/>
        <path d="M-8 -82 L-4 -74 M3 -60 L7 -52 M14 -32 L14 -24 M13 0 L13 8 M12 24 L12 32" fill="none" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round"/>

        <!-- Glass Outline -->
        <path d="M-42 -48 L-30 68 C-28 78 28 78 30 68 L42 -48 Z" fill="url(#glassGrad)" stroke="#E67E22" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Juice Inside -->
        <path d="M-36 -14 Q0 -8 36 -14 L28 66 C26 74 -26 74 -28 66 Z" fill="url(#juiceGrad)" stroke="#D35400" stroke-width="3"/>

        <!-- Ice cubes -->
        <rect x="-20" y="4" width="18" height="18" rx="4" fill="#FFFFFF" opacity="0.6" stroke="#FFA801" stroke-width="1.5"/>
        <rect x="4" y="20" width="16" height="16" rx="4" fill="#FFFFFF" opacity="0.6" stroke="#FFA801" stroke-width="1.5"/>

        <!-- Orange Slice on Rim -->
        <g transform="translate(38, -48)">
          <!-- Rind -->
          <circle cx="0" cy="0" r="26" fill="url(#orangeGrad)" stroke="#D35400" stroke-width="3"/>
          <circle cx="0" cy="0" r="22" fill="#FFF5EB"/>
          <circle cx="0" cy="0" r="19" fill="#FFA801"/>
          <!-- Segments -->
          <path d="M0 0 L0 -18 M0 0 L15 -10 M0 0 L15 10 M0 0 L0 18 M0 0 L-15 10 M0 0 L-15 -10" stroke="#FFF5EB" stroke-width="2.5"/>
          <circle cx="0" cy="0" r="4" fill="#FFF5EB"/>
        </g>

        <!-- Glass Highlight -->
        <path d="M-34 -40 L-25 60" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
      </g>
    `
  },
  tea: {
    title: 'tea',
    zh: '茶',
    bg: '#E8F8F5',
    accent: '#10AC84',
    svgBody: `
      <g transform="translate(128, 134)">
        <defs>
          <linearGradient id="teaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#55E6C1"/>
            <stop offset="50%" stop-color="#1DD1A1"/>
            <stop offset="100%" stop-color="#10AC84"/>
          </linearGradient>
          <linearGradient id="cupCeramic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="60%" stop-color="#F0FDF4"/>
            <stop offset="100%" stop-color="#D1F2EB"/>
          </linearGradient>
        </defs>

        <!-- Steam Wafting -->
        <path d="M-18 -52 C-26 -64 -14 -76 -20 -90" fill="none" stroke="#A3E4D7" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>
        <path d="M0 -56 C-6 -70 8 -80 2 -96" fill="none" stroke="#A3E4D7" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
        <path d="M18 -50 C10 -62 22 -74 16 -88" fill="none" stroke="#A3E4D7" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>

        <!-- Saucer -->
        <ellipse cx="0" cy="56" rx="64" ry="14" fill="#E8F8F5" stroke="#16A085" stroke-width="4"/>
        <ellipse cx="0" cy="54" rx="48" ry="8" fill="#A3E4D7" opacity="0.6"/>

        <!-- Cup Handle -->
        <path d="M38 -12 C60 -12 60 32 36 32" fill="none" stroke="#16A085" stroke-width="8" stroke-linecap="round"/>
        <path d="M38 -12 C54 -12 54 32 36 32" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>

        <!-- Cup Body -->
        <path d="M-44 -32 C-46 36 46 36 44 -32 Z" fill="url(#cupCeramic)" stroke="#16A085" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Tea Surface -->
        <ellipse cx="0" cy="-30" rx="41" ry="12" fill="url(#teaGrad)" stroke="#0E6251" stroke-width="3"/>
        <ellipse cx="0" cy="-30" rx="30" ry="7" fill="#A2F5DE" opacity="0.65"/>

        <!-- Teabag String and Tag -->
        <path d="M-18 -24 C-28 -20 -38 -6 -32 16 L-24 18" fill="none" stroke="#BDC3C7" stroke-width="2.5"/>
        <rect x="-42" y="14" width="18" height="22" rx="3" fill="#F1C40F" stroke="#B7950B" stroke-width="2"/>
        <path d="M-33 18 L-33 22" stroke="#795548" stroke-width="1.5"/>
        <path d="M-36 26 C-34 22 -30 22 -28 26 C-30 30 -34 30 -36 26 Z" fill="#27AE60"/>

        <!-- Fresh Green Leaf on saucer -->
        <path d="M-36 48 C-48 38 -56 46 -52 54 C-42 56 -36 52 -36 48 Z" fill="#2ECC71" stroke="#27AE60" stroke-width="2"/>
      </g>
    `
  },
  yogurt: {
    title: 'yogurt',
    zh: '酸奶',
    bg: '#FDF2E9',
    accent: '#EE5253',
    svgBody: `
      <g transform="translate(128, 130)">
        <defs>
          <linearGradient id="yogurtCup" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="60%" stop-color="#FDEDEC"/>
            <stop offset="100%" stop-color="#FADBD8"/>
          </linearGradient>
          <linearGradient id="strawberryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF7675"/>
            <stop offset="100%" stop-color="#D63031"/>
          </linearGradient>
        </defs>

        <!-- Wooden Spoon in Cup -->
        <path d="M16 -80 C26 -86 36 -74 30 -62 L18 10" fill="none" stroke="#D7A15C" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="26" cy="-72" rx="7" ry="11" transform="rotate(-25 26 -72)" fill="#EDBB99" stroke="#BA4A00" stroke-width="2"/>

        <!-- Yogurt Cup Rim (peeled foil) -->
        <ellipse cx="0" cy="-36" rx="46" ry="12" fill="#E74C3C" stroke="#922B21" stroke-width="4"/>
        <ellipse cx="0" cy="-36" rx="42" ry="9" fill="#FFFFFF"/>

        <!-- Creamy Yogurt Surface -->
        <ellipse cx="0" cy="-36" rx="38" ry="7" fill="#FDFEFE"/>
        <path d="M-14 -37 Q0 -33 12 -38 Q-2 -39 -14 -37" fill="#FCE4EC" stroke="#F8BBD0" stroke-width="2"/>

        <!-- Cup Pot Body (flared) -->
        <path d="M-42 -36 L-32 54 C-30 64 30 64 32 54 L42 -36 Z" fill="url(#yogurtCup)" stroke="#922B21" stroke-width="4.5" stroke-linejoin="round"/>

        <!-- Decorative Label on Pot -->
        <rect x="-34" y="-8" width="68" height="42" rx="6" fill="#FFFFFF" stroke="#FF7675" stroke-width="2"/>
        <text x="0" y="6" font-family="-apple-system, sans-serif" font-size="12" font-weight="900" fill="#E74C3C" text-anchor="middle" letter-spacing="0.5">YOGURT</text>

        <!-- Cute Strawberry on label -->
        <path d="M0 12 C-8 10 -12 18 -6 24 C-2 28 2 28 6 24 C12 18 8 10 0 12 Z" fill="url(#strawberryGrad)"/>
        <path d="M0 12 L-3 10 M0 12 L3 10 M0 12 L0 9" stroke="#2ECC71" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="-2" cy="18" r="0.8" fill="#FFFFFF"/>
        <circle cx="2" cy="18" r="0.8" fill="#FFFFFF"/>
        <circle cx="0" cy="22" r="0.8" fill="#FFFFFF"/>
      </g>
    `
  },
  soup: {
    title: 'soup',
    zh: '汤',
    bg: '#FEF9E7',
    accent: '#F39C12',
    svgBody: `
      <g transform="translate(128, 134)">
        <defs>
          <linearGradient id="bowlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F39C12"/>
            <stop offset="60%" stop-color="#E67E22"/>
            <stop offset="100%" stop-color="#D35400"/>
          </linearGradient>
          <linearGradient id="brothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#F9E79F"/>
            <stop offset="60%" stop-color="#F5B041"/>
            <stop offset="100%" stop-color="#EB984E"/>
          </linearGradient>
        </defs>

        <!-- Warm Steam Rising -->
        <path d="M-16 -50 C-24 -64 -12 -76 -18 -92" fill="none" stroke="#F8C471" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
        <path d="M0 -54 C-8 -68 8 -82 0 -98" fill="none" stroke="#F8C471" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>
        <path d="M16 -48 C8 -62 20 -76 14 -90" fill="none" stroke="#F8C471" stroke-width="4" stroke-linecap="round" opacity="0.8"/>

        <!-- Bowl Handles -->
        <path d="M-46 -8 C-62 -8 -62 16 -46 16" fill="none" stroke="#BA4A00" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M46 -8 C62 -8 62 16 46 16" fill="none" stroke="#BA4A00" stroke-width="6.5" stroke-linecap="round"/>

        <!-- Ceramic Bowl Base -->
        <path d="M-50 -20 C-52 54 52 54 50 -20 Z" fill="url(#bowlGrad)" stroke="#935116" stroke-width="5" stroke-linejoin="round"/>
        <ellipse cx="0" cy="50" rx="26" ry="6" fill="#935116" opacity="0.4"/>

        <!-- Soup Broth Surface -->
        <ellipse cx="0" cy="-20" rx="46" ry="15" fill="url(#brothGrad)" stroke="#935116" stroke-width="3.5"/>
        <ellipse cx="0" cy="-20" rx="36" ry="9" fill="#FCF3CF" opacity="0.6"/>

        <!-- Spoon Resting in Soup -->
        <path d="M22 -62 L32 -20" fill="none" stroke="#BDC3C7" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="26" cy="-18" rx="8" ry="12" transform="rotate(-30 26 -18)" fill="#EAEDED" stroke="#7F8C8D" stroke-width="2"/>

        <!-- Healthy Vegetables in Soup -->
        <circle cx="-16" cy="-18" r="4.5" fill="#2ECC71" stroke="#27AE60" stroke-width="1.5"/>
        <circle cx="6" cy="-14" r="4" fill="#2ECC71" stroke="#27AE60" stroke-width="1.5"/>
        <rect x="-6" y="-24" width="7" height="7" rx="1.5" fill="#E74C3C" stroke="#C0392B" stroke-width="1.5"/>
        <rect x="-24" y="-14" width="6" height="6" rx="1.5" fill="#E67E22" stroke="#D35400" stroke-width="1.5"/>
        <rect x="14" y="-24" width="6" height="6" rx="1.5" fill="#E67E22" stroke="#D35400" stroke-width="1.5"/>
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
  const tmpHtml = '/tmp/render_drink_asset.html';

  console.log('Building SVG and PNG assets for 6 common drinks...');

  for (const [key, meta] of Object.entries(DRINKS_ART)) {
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

  console.log('All 6 drinks assets successfully created!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
