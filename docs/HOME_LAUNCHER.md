# 彩虹星尘开屏

## 设计

参考只读项目 `/Users/mfcheer/code/mfcheer.github.io/script.js` 中 `initHomeLauncher`：原生 Canvas 2D、多色微粒、短时聚拢后揭幕。针对幼儿游戏重新设计浅天空／奶油白背景、六色星尘彩虹拱、现有兔子应用图标、彩虹小队标题和简短邀请语。无新增角色、学习内容、录音或位图。

0–250ms 星尘渐显；0–1150ms 从四周缓缓聚成彩虹；1950–2400ms 整体淡出；自动露出原首页。不显示跳过按钮，键盘Escape仍可关闭。开屏期间首页inert防误触；关闭恢复原状态，必要时将焦点还给首页。每次打开和刷新页面均展示，不读取或写入sessionStorage；退出游戏回到首页不重演。

开场不启动摄像头、语音或新增音效；沿用原首页音乐策略。240颗粒子、DPR上限2，基于实际经过时间而非帧数。动画结束立即释放Canvas、帧请求、计时器和窗口监听。切后台/pagehide直接结束，回来不重播；开启减少动态直接展示首页，运行中切换也即时结束。无2D Canvas时不挂遮罩，绘制异常或帧请求停滞由4秒独立定时器兜底。不改浏览器返回行为。

入口 `src/homeLauncher.js`，在Game初始化前挂载；`render_game_to_text`的homeLauncher字段反映遮罩存在状态。

## 2026-11-21 验证

- 新增 `test/qa_v52_home_launcher.mjs` 5项：时序/淡出、DPR、子路径图标、跳过幂等、Escape、后台、pagehide、减少动态、Canvas不可用、存储拒绝、尺寸变化与失败兜底，均通过并加入npm test。
- 隔离副本完整npm test退出0；原工作区3份既有QA报告不参与写入。
- `VITE_BASE_PATH=/camGame/ npm run build`退出0，保留既有大包提示；`git diff --check`通过。
- 指定Browser实际自然播放结束约2413ms，回到START且首页inert=false；实际点击跳过立即移除遮罩。减少动态、Canvas失败和后台生命周期通过浏览器模拟验证；返回不重播。实际刷新也未重播。
- 使用同源子页面1194×834、834×1194布局；截图以0.8／0.57缩放完整显示在当前Browser视口。定格1200ms以便检查粒子和文字，非动画流畅度测量。最终横竖屏截图均已打开目检，标题、图标、彩虹和跳过按钮完整可见。
- 首页实际点击模拟体验进入PLAYING，使用合成鼠标事件通过原指尖碰撞得到1分，再实际暂停、退出回首页，无开屏重演或残留遮挡。没有修改得分或直接调用计分。
- 浏览器监听未捕获新增window error/unhandledrejection。调试后清空页面停音。

证据 `output/home-launcher/`：desktop.png、landscape.png、portrait.png、gameplay.png、npm-test.log。Browser验证遵循develop-web-game动作—观察流程；按会话要求使用指定Browser，没有另起技能脚本浏览器。真实iPad、Safari系统后台、低性能设备帧率及儿童观感仍待体验。本地未提交、未推送。

## 2026-11-21 按用户要求调整

移除右下跳过按钮及其样式、点击监听；取消同标签页只播放一次的存储限制。每次页面载入均播放约2.4秒，同一页面重复初始化不重复挂载。减少动态、后台清理、Escape与4秒失败兜底保留。原验收中的跳过与刷新不重播为历史行为，以本节为准。

本次验证：qa_v52五项、Pages子路径构建通过。指定Browser新页面与实际reload在旧版已播放标记为1时仍显示开屏，按钮不存在；自然播放结束恢复首页交互，未捕获新增页面异常。最终截图已打开检查，output/home-launcher-refresh/reload.png。未运行会写入既有QA报告的完整套件。真实iPad仍待体验。
