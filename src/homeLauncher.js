// Inspired by mfcheer.github.io's Canvas star-dust reveal; no media or game state.
const COLORS = ['#ed849c', '#edac54', '#d3b844', '#66b89b', '#63aeda', '#a28acb'];

export const LAUNCHER_CANDIDATE_TIPS = [
  '🐰 小兔正在系好小跑鞋…',
  '👑 雪王正在把甜筒火炬点亮…',
  '🏎️ 闪电麦昆正在热身发动引擎…',
  '🚒 汪汪队阿奇正在检查巡逻装备…',
  '🦖 三角龙嘟嘟正大口嚼着青草…',
  '✈️ 超级飞侠乐迪正在确认飞行航线…',
  '🚂 托马斯小火车鸣响了快乐汽笛…',
  '🚜 小挖掘机挖出了七彩糖果…',
  '🚌 小巴士太友正在接小伙伴上车…',
  '🐱 橘猫咪伸了个大大的懒腰…',
  '🐻 泰迪熊抱紧了满满的蜂蜜罐…',
  '🌈 彩虹精灵正在汇聚七色光芒…'
];

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
  // 21 款动物预览图
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
  { url: 'models/maiqi-preview.png?v=20261116r1', weight: 60, label: '麦奇预览图' },
  { url: 'models/bicycle-preview.png', weight: 40, label: '自行车预览图' },
  { url: 'models/snowking-preview.png', weight: 40, label: '雪王预览图' }
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
      const itemWeight = item.weight || 1;
      let itemCompletedWeight = 0;
      try {
        const res = await fetch(fullUrl, { signal, priority: 'high' });
        if (res.ok) {
          const contentLength = Number(res.headers?.get?.('content-length')) || 0;
          if (res.body?.getReader) {
            const reader = res.body.getReader();
            let receivedBytes = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value && contentLength > 0) {
                receivedBytes += value.length;
                const ratio = Math.min(1, receivedBytes / contentLength);
                const currentChunkWeight = itemWeight * ratio;
                const delta = currentChunkWeight - itemCompletedWeight;
                if (delta > 0) {
                  itemCompletedWeight = currentChunkWeight;
                  loadedWeight += delta;
                  notify(loadedWeight / totalWeight);
                }
              }
            }
          } else if (res.arrayBuffer) {
            await res.arrayBuffer();
          }
        }
      } catch (err) {
        if (err?.name === 'AbortError') break;
      }
      const remainingDelta = itemWeight - itemCompletedWeight;
      if (remainingDelta > 0) {
        loadedWeight += remainingDelta;
        notify(loadedWeight / totalWeight);
      }
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

  const selectedTip = options.tip || LAUNCHER_CANDIDATE_TIPS[Math.floor(Math.random() * LAUNCHER_CANDIDATE_TIPS.length)];
  const readyText = options.readyText || '彩虹伙伴已就绪 100%';

  const overlay = document.createElement('section');
  overlay.id = 'home-launcher';
  overlay.setAttribute('aria-label', '欢迎来到彩虹小队');
  overlay.innerHTML = `<canvas aria-hidden="true"></canvas>
    <div class="launcher-copy">
      <img class="launcher-logo" src="${import.meta.env.BASE_URL}icons/icon-192.png?v=20261115r2" alt="" />
      <h2>彩虹小队 · 森林大解救</h2>
      <p class="launcher-subtitle">森林朋友，在等你一起出发 ✨</p>
    </div>
    <div class="launcher-progress-container" role="progressbar" aria-label="彩虹小队加载进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="launcher-progress-track">
        <div class="launcher-progress-bar" style="width: 0%"></div>
      </div>
      <div class="launcher-progress-text">${selectedTip} 0%</div>
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
  let isHotStart = Boolean(options.isHotStart || isMockEnvironment);
  let targetProgress = isHotStart ? 1 : 0;
  let displayProgress = 0;
  let rainbowGather = 0;
  let isLoaded = isHotStart;
  let readyElapsed = null;
  let previousElapsed = 0;
  let pulseStartElapsed = null;
  const pulseDuration = 400;

  const fadeDuration = options.fadeDuration ?? 450;
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
      progressText.textContent = pct >= 100 ? readyText : `${selectedTip} ${pct}%`;
    }
    if (progressContainer && typeof progressContainer.setAttribute === 'function') {
      progressContainer.setAttribute('aria-valuenow', pct);
    }
  }

  function onDownloadProgress(ratio) {
    targetProgress = Math.max(targetProgress, ratio);
    if (targetProgress >= 1 && !isLoaded) {
      isLoaded = true;
      if (previousElapsed < 120) {
        isHotStart = true;
      }
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

    const dt = Math.max(0, elapsed - previousElapsed);
    previousElapsed = elapsed;

    const currentProgressDuration = options.progressDuration ?? (isHotStart ? 1200 : 2600);
    const holdDuration = options.readyHoldDuration ?? (isHotStart ? 600 : 650);

    const timedTarget = Math.min(targetProgress, elapsed / currentProgressDuration, 1);
    displayProgress = Math.min(timedTarget, displayProgress + dt / (isHotStart ? 300 : 600));

    const pct = displayProgress >= 1 ? 100 : Math.min(99, Math.floor(displayProgress * 100));
    updateProgressUI(pct);

    let release = 0;
    if (isLoaded && displayProgress >= 1 && readyElapsed == null) {
      readyElapsed = isHotStart ? Math.min(elapsed, currentProgressDuration) : elapsed;
      pulseStartElapsed = readyElapsed;
    }

    overlay.style.opacity = '1';
    if (readyElapsed != null) {
      const minDuration = options.minDuration ?? 0;
      const fadeStartElapsed = Math.max(minDuration - fadeDuration, readyElapsed + holdDuration);
      const targetFinishElapsed = fadeStartElapsed + fadeDuration;
      if (elapsed >= targetFinishElapsed) {
        finish();
        return;
      }
      if (elapsed >= fadeStartElapsed) {
        release = Math.min(1, (elapsed - fadeStartElapsed) / fadeDuration);
        overlay.style.opacity = String(Math.max(0, 1 - release));
      }
    }

    ctx.clearRect(0, 0, width, height);

    // 彩虹粒子独立柔和追随，带有阻尼惯性与平滑缓冲，脱离与进度条的机械同频卡顿。
    const gatherLag = displayProgress - rainbowGather;
    rainbowGather += gatherLag * (1 - Math.exp(-dt / (isHotStart ? 120 : 250)));
    const gather = rainbowGather;
    const ease = Math.pow(gather, 1.6);
    const unit = Math.min(width * .42, height * .39, 380);
    const cx = width / 2, cy = height / 2 + 50;

    // 1. 纯 Canvas 矢量彩虹实体底弧（避免 filter: blur，6 色同心圆弧，基础 Alpha 0.18，随聚拢率渐亮至 0.75）
    const baseArcAlpha = (0.18 + (0.75 - 0.18) * ease) * Math.min(1, elapsed / 250);
    ctx.save?.();
    if (ctx.lineCap !== undefined) ctx.lineCap = 'round';
    for (let b = 0; b < 6; b++) {
      const breath = Math.sin(elapsed / 1100 + b * 0.65);
      const r = unit * (1 - b * 0.055 + breath * 0.018 + release * 0.22);
      ctx.strokeStyle = COLORS[b];
      ctx.globalAlpha = baseArcAlpha;
      ctx.lineWidth = Math.max(4, unit * 0.054);
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2, false);
      ctx.stroke?.();
    }
    ctx.restore?.();

    // 2. 100% 单次脉冲光环（耗时 0.4s，淡金色柔和光环，半径扩至 1.25 倍，Alpha 从 0.5 淡出至 0）
    if (pulseStartElapsed != null) {
      const pulseElapsed = elapsed - pulseStartElapsed;
      if (pulseElapsed >= 0 && pulseElapsed <= pulseDuration) {
        const pulseRatio = pulseElapsed / pulseDuration;
        const pulseAlpha = 0.5 * (1 - pulseRatio);
        const startR = unit * 0.725;
        const endR = unit * 1.25;
        const pulseR = startR + (endR - startR) * Math.sin(pulseRatio * Math.PI / 2);
        ctx.save?.();
        ctx.strokeStyle = '#ffe082';
        ctx.globalAlpha = pulseAlpha;
        ctx.lineWidth = Math.max(3, unit * 0.024) * (1 - pulseRatio * 0.4);
        if (ctx.lineCap !== undefined) ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, Math.PI, Math.PI * 2, false);
        ctx.stroke?.();
        ctx.restore?.();
      }
    }

    // 3. 星尘彩虹微粒与 450ms 幕布舒展揭幕（粒子轻微上浮 vy < 0 与向两侧舒展初速度）
    for (const p of particles) {
      // 下载较慢时仍沿彩虹来回流动；各色错相呼吸，避免静止闪烁。
      const arc = p.arc + Math.sin(elapsed / 1700 + p.phase) * .14;
      const breath = Math.sin(elapsed / 1100 + p.band * .65);
      const r = unit * (1 - p.band * .055 + breath * .018 + release * .22);
      const tx = cx + Math.cos(arc) * r;
      const ty = cy - Math.sin(arc) * r;
      const drift = Math.sin(elapsed / 950 + p.phase) * 4;
      const sx = cx + Math.cos(p.angle) * width * p.radius;
      const sy = height / 2 + Math.sin(p.angle) * height * p.radius;

      // 幕布舒展：两翼向外展开，向上升腾拉开
      const spreadX = Math.cos(arc) * release * 45;
      const floatY = - release * (45 + p.size * 6);
      const x = sx + (tx - sx) * ease + drift + spreadX;
      const y = sy + (ty - sy) * ease + drift + floatY;

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
