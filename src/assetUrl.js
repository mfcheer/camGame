/** Public assets follow Vite's deployment base, including project GitHub Pages. */
export function assetUrl(path) {
  return `${import.meta.env?.BASE_URL || '/'}${path.replace(/^\/+/, '')}`;
}
