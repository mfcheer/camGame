// Camera and AR must share the viewport crop before entering the photo frame.
export function photoComposition(videoW, videoH, viewportW, viewportH, frameW = 568, frameH = 520) {
  const cover = Math.max(viewportW / videoW, viewportH / videoH);
  const sw = viewportW / cover, sh = viewportH / cover;
  const fit = Math.min(frameW / viewportW, frameH / viewportH);
  return { sx: (videoW - sw) / 2, sy: (videoH - sh) / 2, sw, sh,
    dx: (frameW - viewportW * fit) / 2, dy: (frameH - viewportH * fit) / 2,
    dw: viewportW * fit, dh: viewportH * fit };
}

/**
 * 胜利抓拍拍立得合影生成器 (PolaroidManager)
 * 1. 抓取摄像头视频帧与 Three.js 3D 画布（包含头戴 3D 皇冠/花环及通关小动物）
 * 2. 合成经典白色拍立得相框、通关动物贴纸、日期时间戳与“森林英雄”复古印章
 * 3. 导出 PNG 支持一键本地下载与移动端长按保存
 */

export class PolaroidManager {
  /**
   * 生成拍立得合影画布
   */
  static generateCanvas({
    videoElement = null,
    webglCanvas = null,
    animalId = 'bunny',
    animalName = '小兔 萌萌',
    targetBubbles = 5,
    animalEmoji = '🐰',
    viewportWidth = webglCanvas?.width || 1280,
    viewportHeight = webglCanvas?.height || 720
  } = {}) {
    if (typeof document === 'undefined') {
      // Node 测试环境防崩回退
      return {
        toDataURL: () => 'data:image/png;base64,fakePolaroidData'
      };
    }

    const width = 640;
    const height = 760;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 1. 拍立得白色卡纸底板 (带圆角和微柔阴影)
    ctx.fillStyle = '#fbfbfa';
    ctx.beginPath();
    const r = 16;
    ctx.roundRect(0, 0, width, height, r);
    ctx.fill();

    // 浅灰边缘微线
    ctx.strokeStyle = '#e6e8eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. 照片视窗区域 (Top: 32px, Left: 36px, Width: 568px, Height: 520px)
    const px = 36;
    const py = 32;
    const pw = 568;
    const ph = 520;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 8);
    ctx.clip();

    // Retain the entire visible play area, including heads near the top edge.
    const grad = ctx.createLinearGradient(px, py, px, py + ph);
    grad.addColorStop(0, '#c7ecfc'); grad.addColorStop(1, '#b1edd0');
    ctx.fillStyle = grad; ctx.fillRect(px, py, pw, ph);
    const vw = videoElement?.videoWidth || viewportWidth;
    const vh = videoElement?.videoHeight || viewportHeight;
    const rect = photoComposition(vw, vh, viewportWidth, viewportHeight, pw, ph);
    if (videoElement?.videoWidth > 0 && !videoElement.paused) {
      ctx.save();
      try {
        ctx.translate(px + rect.dx + rect.dw, py + rect.dy);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, rect.dw, rect.dh);
      } catch (e) { console.warn('Camera frame unavailable for photo', e); }
      finally { ctx.restore(); }
    }
    if (webglCanvas?.width > 0) {
      try { ctx.drawImage(webglCanvas, px + rect.dx, py + rect.dy, rect.dw, rect.dh); }
      catch (e) { console.warn('AR frame unavailable for photo', e); }
    }

    // 照片内阴影边缘
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // 3. 通关小动物专属贴纸 (右下角斜贴可爱徽章)
    ctx.save();
    const stickerX = px + pw - 64;
    const stickerY = py + ph - 24;
    ctx.translate(stickerX, stickerY);
    ctx.rotate((-8 * Math.PI) / 180);

    // 白色贴纸底盘
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 贴纸 Emoji 图标与文字
    ctx.font = '36px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(animalEmoji, 0, -6);

    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillStyle = '#3a5a40';
    ctx.fillText(animalName.split(' ')[0] || '伙伴', 0, 24);
    ctx.restore();

    // 4. 拍立得底部白色空间 (手写体留念文字与日期)
    const textStartY = py + ph + 42;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 标题
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#2d3748';
    ctx.fillText(`与${animalName}的自由合影`, px + 8, textStartY, pw - 120);

    // 获救副标题与能量数
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText(`送出 ${targetBubbles} 份彩虹能量`, px + 8, textStartY + 36);
    ctx.fillText(`${dateStr} · 森林营地留念`, px + 8, textStartY + 62);

    // 5. “森林英雄”复古红色/金色双圈纪念印章
    ctx.save();
    const stampX = px + pw - 56;
    const stampY = textStartY + 36;
    ctx.translate(stampX, stampY);
    ctx.rotate((12 * Math.PI) / 180);

    const stampColor = '#e76f51';
    ctx.strokeStyle = stampColor;
    ctx.fillStyle = stampColor;
    ctx.lineWidth = 3;

    // 外圈
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈细虚线
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 印章文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText('FOREST', 0, -18);
    ctx.font = 'bold 15px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('森林英雄', 0, 0);
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillText('★ HERO ★', 0, 18);
    ctx.restore();

    return canvas;
  }

  static getDataUrl(options) {
    const canvas = this.generateCanvas(options);
    if (canvas && typeof canvas.toDataURL === 'function') {
      return canvas.toDataURL('image/png');
    }
    return '';
  }

  static downloadImage(dataUrl, animalName = '小动物') {
    if (!dataUrl || typeof document === 'undefined') return;
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.download = `彩虹小队-森林英雄合影-${animalName}-${dateStr}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
