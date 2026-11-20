// Inspired by mfcheer.github.io's Canvas star-dust reveal; no media or game state.
const SEEN_KEY = 'camgame:rainbow-reveal:v1';
const COLORS = ['#ed849c', '#edac54', '#d3b844', '#66b89b', '#63aeda', '#a28acb'];

export function initHomeLauncher() {
  const home = document.getElementById('start-screen');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (_) { /* private mode */ }
  if (!home || seen || reduced.matches || document.hidden) return null;

  const overlay = document.createElement('section');
  overlay.id = 'home-launcher';
  overlay.setAttribute('aria-label', '欢迎来到彩虹小队');
  overlay.innerHTML = `<canvas aria-hidden="true"></canvas>
    <div class="launcher-copy"><div class="launcher-eyebrow">每一份小小的勇气，都有彩虹回应</div>
    <img class="launcher-logo" src="${import.meta.env.BASE_URL}icons/icon-192.png?v=20261115r2" alt="" />
    <h2>彩虹小队</h2><p>森林大解救</p><span class="launcher-invite">森林朋友，在等你一起出发</span></div>
    <button class="launcher-skip" type="button">跳过开场 <span aria-hidden="true">↗</span></button>`;
  const canvas = overlay.querySelector('canvas');
  let ctx;
  try { ctx = canvas.getContext('2d'); } catch (_) { return null; }
  if (!ctx) return null;

  let width = 0, height = 0, frame = null, start = null, disposed = false;
  const previousInert = home.inert;
  const previousFocus = document.activeElement;
  const particles = Array.from({ length: 240 }, (_, i) => ({
    angle: Math.random() * Math.PI * 2, radius: .35 + Math.random() * .4,
    band: i % 6, arc: Math.random() * Math.PI,
    size: 1 + Math.random() * 2, phase: Math.random() * Math.PI * 2,
  }));
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function finish() {
    if (disposed) return;
    disposed = true;
    const restoreFocus = overlay.contains(document.activeElement);
    cancelAnimationFrame(frame);
    clearTimeout(failsafe);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', finish);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onReduced);
    overlay.removeEventListener('keydown', onKey);
    home.inert = previousInert;
    overlay.remove();
    canvas.width = canvas.height = 0;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (_) { /* no persistence required */ }
    if (restoreFocus) {
      const target = previousFocus !== document.body && previousFocus?.isConnected ? previousFocus : home.querySelector('button');
      target?.focus({ preventScroll: true });
    }
  }
  function onVisibility() { if (document.hidden) finish(); }
  function onReduced() { if (reduced.matches) finish(); }
  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
  }
  function draw(now) {
    if (disposed) return;
    start ??= now;
    const elapsed = now - start;
    if (elapsed >= 2400) { finish(); return; }
    const gather = Math.min(1, elapsed / 1150);
    const ease = 1 - Math.pow(1 - gather, 3);
    const fade = Math.max(0, Math.min(1, (2400 - elapsed) / 450));
    overlay.style.opacity = String(fade);
    ctx.clearRect(0, 0, width, height);
    const unit = Math.min(width * .42, height * .39, 380);
    const cx = width / 2, cy = height / 2 + 50;
    for (const p of particles) {
      const r = unit * (1 - p.band * .055);
      const tx = cx + Math.cos(p.arc) * r;
      const ty = cy - Math.sin(p.arc) * r;
      const drift = Math.sin(elapsed / 750 + p.phase) * 3;
      const sx = cx + Math.cos(p.angle) * width * p.radius;
      const sy = height / 2 + Math.sin(p.angle) * height * p.radius;
      const x = sx + (tx - sx) * ease + drift;
      const y = sy + (ty - sy) * ease + drift;
      ctx.globalAlpha = (.55 + .3 * Math.sin(p.phase + elapsed / 1000)) * Math.min(1, elapsed / 250);
      ctx.fillStyle = COLORS[p.band];
      ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      if (p.size > 2.6) {
        ctx.fillRect(x - 5, y - .6, 10, 1.2); ctx.fillRect(x - .6, y - 5, 1.2, 10);
      }
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  document.body.append(overlay);
  home.inert = true;
  overlay.querySelector('button').addEventListener('click', finish);
  overlay.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', finish);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onReduced);
  // Separate fallback: drawing errors or a stalled frame never leave a blocking layer.
  const failsafe = setTimeout(finish, 4000);
  resize();
  frame = requestAnimationFrame(draw);
  return { finish };
}
