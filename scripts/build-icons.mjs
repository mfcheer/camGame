import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

const svg = await fs.readFile('public/icons/app-icon.svg', 'utf8');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>* { margin: 0; padding: 0; } html, body { width: 512px; height: 512px; background: transparent; overflow: hidden; } svg { width: 512px; height: 512px; display: block; }</style></head><body>${svg}</body></html>`;

const tmpHtml = '/tmp/render_app_icon.html';
await fs.writeFile(tmpHtml, html, 'utf8');

const chromePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
try {
  execSync(`"${chromePath}" --headless --disable-gpu --screenshot=public/icons/icon-512.png --window-size=512,512 --default-background-color=00000000 file://${tmpHtml}`, { stdio: 'pipe' });
  execSync('sips -z 192 192 public/icons/icon-512.png --out public/icons/icon-192.png', { stdio: 'pipe' });
  execSync('sips -z 180 180 public/icons/icon-512.png --out public/icons/apple-touch-icon.png', { stdio: 'pipe' });
  execSync('sips -z 32 32 public/icons/icon-512.png --out public/icons/icon-32.png', { stdio: 'pipe' });
  console.log('App icons built successfully from public/icons/app-icon.svg');
} catch (err) {
  console.error('Failed to build icons via Chrome/sips:', err.message);
  process.exit(1);
}
