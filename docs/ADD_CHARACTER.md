# 添加游戏角色

目前新朋友无需事先解锁即可选择；营地点亮表示曾经成功解救，不限制游玩。接入新角色时检查以下整条链路：

1. **角色与玩法**：在 `src/config.js` 注册唯一 ID、名称、目标能量、GLB 文件名、角色简介和结算文案，并加入 `PLAYABLE_ANIMALS`。在 `src/animalPlayStyles.js` 设置泡泡运动、尺寸、提示和特殊泡泡出现点；首泡静止，所有泡泡一次触碰即破。
2. **模型与骨架**：用 Three.js 建模并在 `src/rescueAnimal.js` 注册工厂及模型缩放。模型必须包含 `Head`、`Torso`、`Eyes`、`Eye_L/R`、`Ear_L/R`、`Arm_L/R`、`Leg_L/R`、`Bow`、`Tail`，以及可隐藏的 `Happy_Mouth`；为表情补充 `src/animalExpressions.js` 的尺寸配置。导出 GLB 与首页透明预览，避免覆盖其他角色：`node scripts/build-rabbit.mjs <asset-name>`；运行 `scripts/render-previews.mjs <id>` 前先启动 `npm run dev:local`（必要时配置 `PREVIEW_BASE`、`PLAYWRIGHT_MODULE` 和 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`）。
3. **动作和反馈**：检查受困、获得能量、眼神、眨眼、解救、暂停和重置；在 `src/happyPerformance.js` 添加至少两个适配骨架的招牌演出。`src/audioManager.js` 接入合适的短音效，声音必须走音效总线；本次三位先复用已有合成音色。英语短句可在 `src/animalPhrases.js` 从现有已验收录音中选用；新建配音前遵循 `docs/VOICE_STANDARD.md`。
4. **界面与记录**：首页 `index.html` 加入选项和头像、更新随机选取的数量；`src/campManager.js` 加入营地条目（UI 使用同一列表），并检查结算图标、角色主题与窄屏布局。`src/sceneManager.js` 可配置角色配色。验证随机也能选中新角色，并确保旧存档仍可读取。
5. **验收**：验证 GLB 和预览文件存在，独立角色从选择、泡泡命中、解救、演出到返回的全流程，以及 iPad 横竖屏和摄像头/模拟模式；更新涉及角色数量的旧测试与文档。在隔离副本执行 `npm test`，再做 Pages 子路径构建、浏览器截图及真机体验。最后检查部署状态，不能把 Git 推送成功当作发布成功。
