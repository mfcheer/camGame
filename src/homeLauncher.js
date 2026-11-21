// Inspired by mfcheer.github.io's Canvas star-dust reveal; no media or game state.
const COLORS = ['#ed849c', '#edac54', '#d3b844', '#66b89b', '#63aeda', '#a28acb'];

export const ESSENTIAL_RESOURCES = [
  // 摄像头 MediaPipe 追踪引擎组件
  { url: 'tracking-worker.js', weight: 10, label: '摄像头追踪引擎' },
  { url: 'vendor/vision_bundle.js', weight: 150, label: '视觉识别组件' },
  { url: 'wasm/vision_wasm_internal.wasm', weight: 14000, label: '视觉加速内核' },
  { url: 'wasm/vision_wasm_internal.js', weight: 330, label: '视觉运算脚本' },
  { url: 'models/hand_landmarker.task', weight: 7800, label: '食指指尖定位模型' },
  { url: 'models/pose_landmarker_lite.task', weight: 5800, label: '身体姿态识别模型' },
  // 首页视觉素材
  { url: 'icons/icon-192.png?v=20261115r2', weight: 30, label: '应用图标' },
  { url: 'models/forest-bunny.glb', weight: 1340, label: '初始伙伴模型' },
  // 20 款动物预览图
  { url: 'models/bunny-preview.png?v=20261114r2', weight: 50, label: '小兔预览图' },
  { url: 'models/cat-preview.png?v=20261114r2', weight: 70, label: '橘猫预览图' },
  { url: 'models/frog-preview.png?v=20261114r2', weight: 80, label: '青蛙预览图' },
  { url: 'models/dog-preview.png?v=20261114r2', weight: 65, label: '小狗预览图' },
  { url: 'models/dragon-preview.png?v=20261114r2', weight: 65, label: '飞龙预览图' },
  { url: 'models/goldenDragon-preview.png?v=20261114r2', weight: 50, label: '金龙预览图' },
  { url: 'models/mcqueen-preview.png?v=20261114r2', weight: 55, label: '麦昆预览图' },
  { url: 'models/wolf-preview.png?v=20261114r2', weight: 65, label: '灰太狼预览图' },
  { url: 'models/teddy-preview.png?v=20261114r2', weight: 65, label: '泰迪熊预览图' },
  { url: 'models/chase-preview.png?v=20261114r2', weight: 65, label: '阿奇预览图' },
  { url: 'models/jett-preview.png?v=20261115r1', weight: 50, label: '乐迪预览图' },
  { url: 'models/peppa-preview.png?v=20261114r2', weight: 50, label: '佩奇预览图' },
  { url: 'models/thomas-preview.png?v=20261114r2', weight: 60, label: '托马斯预览图' },
  { url: 'models/excavator-preview.png?v=20261114r1', weight: 55, label: '小铲预览图' },
  { url: 'models/tayo-preview.png?v=20261115r1', weight: 50, label: '太友预览图' },
  { url: 'models/triceratops-preview.png?v=20261115r1', weight: 60, label: '嘟嘟预览图' },
  { url: 'models/krashy-preview.png?v=20261116r1', weight: 55, label: '跳跳预览图' },
  { url: 'models/modelx-preview.png', weight: 40, label: 'Model X 预览图' },
  { url: 'models/airplane-preview.png', weight: 30, label: '小飞机预览图' },
  { url: 'models/maiqi-preview.png?v=20261116r1', weight: 60, label: '麦奇预览图' }
];

export function preloadEssentialResources({
  resources = ESSENTIAL_RESOURCES,
  onProgress,
  signal
} = {}) {
  const totalWeight = resources.reduce((acc, r) => acc + (r.weight || 1), 0);
  let loadedWeight = 0;

  const notify = (ratio) => {
    onProgress?.(Math.min(1, Math.max(0, ratio)));
  };

  notify(0);

  if (typeof fetch !== 'function') {
    notify(1);
    return Promise.resolve();
  }

  const concurrency = 4;
  let cursor = 0;

  const worker = async () => {
    while (cursor < resources.length) {
      if (signal?.aborted) break;
      const item = resources[cursor++];
      const fullUrl = `${import.meta.env.BASE_URL}${item.url.replace(/^\/+/, '')}`;
      try {
        const res = await fetch(fullUrl, { signal, priority: 'high' });
        if (res.ok) {
          if (res.body?.getReader) {
            const reader = res.body.getReader();
            while (true) {
              const { done } = await reader.read();
              if (done) break;
            }
          } else if (res.arrayBuffer) {
            await res.arrayBuffer();
          }
        }
      } catch (err) {
        if (err?.name === 'AbortError') break;
      }
      loadedWeight += (item.weight || 1);
      notify(loadedWeight / totalWeight);
    }
  };

  const pool = Array.from({ length: Math.min(concurrency, resources.length) }, () => worker());
  return Promise.all(pool).then(() => {
    notify(1);
  });
}

export function initHomeLauncher(options = {}) {
  const home = document.getElementById('start-screen');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!home || document.getElementById('home-launcher') || reduced.matches || document.hidden) return null;

  const overlay = document.createElement('section');
  overlay.id = 'home-launcher';
  overlay.setAttribute('aria-label', '欢迎来到彩虹小队');
  overlay.innerHTML = `<canvas aria-hidden="true"></canvas>
    <div class="launcher-copy">
      <img class="launcher-logo" src="${import.meta.env.BASE_URL}icons/icon-192.png?v=20261115r2" alt="" />
      <h2>彩虹小队 · 森林大解救</h2>
      <p class="launcher-subtitle">森林朋友，在等你一起出发 ✨</p>
    </div>
    <div class="launcher-progress-container" role="progressbar" aria-label="必要资源加载进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="launcher-progress-track">
        <div class="launcher-progress-bar" style="width: 0%"></div>
      </div>
      <div class="launcher-progress-text">正在准备必要资源… 0%</div>
    </div>`;
  const canvas = overlay.querySelector('canvas');
  let ctx;
  try { ctx = canvas.getContext('2d'); } catch (_) { return null; }
  if (!ctx) return null;

  const progressBar = overlay.querySelector('.launcher-progress-bar');
  const progressText = overlay.querySelector('.launcher-progress-text');
  const progressContainer = overlay.querySelector('.launcher-progress-container');

  let width = 0, height = 0, frame = null, start = null, disposed = false;
  const isMockEnvironment = typeof window !== 'undefined' && !window.location && !options.resourceLoader && !options.resources;
  let targetProgress = isMockEnvironment ? 1 : 0;
  let displayProgress = 0;
  let isLoaded = isMockEnvironment;
  let readyElapsed = null;
  let previousElapsed = 0;

  const minDuration = options.minDuration ?? 5500;
  const fadeDuration = options.fadeDuration ?? 900;
  const progressDuration = options.progressDuration ?? 4000;
  const readyHoldDuration = options.readyHoldDuration ?? 600;
  const failsafeDuration = options.failsafeDuration ?? 15000;
  const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;

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
    abortController?.abort();
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

  function updateProgressUI(pct) {
    if (progressBar && progressBar.style) progressBar.style.width = `${pct}%`;
    if (progressText) {
      progressText.textContent = pct >= 100 ? '必要资源已就绪 ✨ 100%' : `正在准备必要资源… ${pct}%`;
    }
    if (progressContainer && typeof progressContainer.setAttribute === 'function') {
      progressContainer.setAttribute('aria-valuenow', pct);
    }
  }

  function onDownloadProgress(ratio) {
    targetProgress = Math.max(targetProgress, ratio);
    if (targetProgress >= 1 && !isLoaded) {
      isLoaded = true;
    }
  }

  if (!isMockEnvironment || options.resourceLoader || options.resources) {
    const loaderPromise = options.resourceLoader
      ? options.resourceLoader({ onProgress: onDownloadProgress, signal: abortController?.signal })
      : preloadEssentialResources({
          resources: options.resources || ESSENTIAL_RESOURCES,
          onProgress: onDownloadProgress,
          signal: abortController?.signal
        });

    loaderPromise?.catch?.(() => {
      isLoaded = true;
      targetProgress = 1;
    });
  }

  function draw(now) {
    if (disposed) return;
    start ??= now;
    const elapsed = now - start;

    // 显示进度同时受真实下载与最短展示时间约束；晚到的资源也平滑追上。
    const dt = Math.max(0, elapsed - previousElapsed);
    previousElapsed = elapsed;
    const timedTarget = Math.min(targetProgress, elapsed / progressDuration, 1);
    displayProgress = Math.min(timedTarget, displayProgress + dt / 800);
    const pct = displayProgress >= 1 ? 100 : Math.min(99, Math.floor(displayProgress * 100));
    updateProgressUI(pct);

    if (isLoaded && displayProgress >= 1 && readyElapsed == null) {
      readyElapsed = elapsed;
    }
    overlay.style.opacity = '1';
    if (readyElapsed != null) {
      const fadeStartElapsed = Math.max(minDuration - fadeDuration, readyElapsed + readyHoldDuration);
      const targetFinishElapsed = fadeStartElapsed + fadeDuration;
      if (elapsed >= targetFinishElapsed) {
        finish();
        return;
      }
      if (elapsed >= fadeStartElapsed) {
        overlay.style.opacity = String((targetFinishElapsed - elapsed) / fadeDuration);
      }
    }

    ctx.clearRect(0, 0, width, height);
    const gather = Math.min(1, elapsed / 1150);
    const ease = 1 - Math.pow(1 - gather, 3);
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
        ctx.fillRect(x - 5, y - .6, 10, 1.2); ctx.fillRect(x - .6, y - .6, 1.2, 10);
      }
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  document.body.append(overlay);
  home.inert = true;
  overlay.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', finish);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onReduced);
  // Separate fallback: drawing errors or a stalled frame never leave a blocking layer.
  const failsafe = setTimeout(finish, failsafeDuration);
  resize();
  frame = requestAnimationFrame(draw);
  return { finish, overlay };
}
