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
    animalEmoji = '🐰'
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

    // A. 视频底图 (如有真实摄像头流，水平镜像渲染；如无流或模拟模式，渲染森林梦幻渐变)
    let hasDrawnVideo = false;
    if (videoElement && videoElement.videoWidth > 0 && !videoElement.paused) {
      try {
        ctx.save();
        ctx.translate(px + pw, py);
        ctx.scale(-1, 1);

        const vw = videoElement.videoWidth;
        const vh = videoElement.videoHeight;
        const vAspect = vw / vh;
        const fAspect = pw / ph;

        let dw, dh, dx, dy;
        if (vAspect > fAspect) {
          dh = ph;
          dw = ph * vAspect;
          dx = (pw - dw) / 2;
          dy = 0;
        } else {
          dw = pw;
          dh = pw / vAspect;
          dx = 0;
          dy = (ph - dh) / 2;
        }
        ctx.drawImage(videoElement, dx, dy, dw, dh);
        ctx.restore();
        hasDrawnVideo = true;
      } catch (e) {}
    }

    if (!hasDrawnVideo) {
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#c7ecfc');
      grad.addColorStop(0.55, '#e4fae8');
      grad.addColorStop(1, '#b1edd0');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // 绘制几抹柔和的森林阳光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(px + pw * 0.5, py + ph * 0.2, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    // B. 绘制 Three.js 3D WebGL 画布 (包含场景、小动物与头上 3D 皇冠/花环)
    if (webglCanvas && webglCanvas.width > 0) {
      try {
        const cw = webglCanvas.width;
        const ch = webglCanvas.height;
        const cAspect = cw / ch;
        const fAspect = pw / ph;

        let dw, dh, dx, dy;
        if (cAspect > fAspect) {
          dh = ph;
          dw = ph * cAspect;
          dx = px + (pw - dw) / 2;
          dy = py;
        } else {
          dw = pw;
          dh = pw / cAspect;
          dx = px;
          dy = py + (ph - dh) / 2;
        }
        ctx.drawImage(webglCanvas, dx, dy, dw, dh);
      } catch (e) {}
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
    ctx.fillText(`🎉 与${animalName}的自由合影`, px + 8, textStartY);

    // 获救副标题与能量数
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText(`送出 ${targetBubbles} 份彩虹能量 · ${dateStr} 森林营地留念`, px + 8, textStartY + 36);

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
