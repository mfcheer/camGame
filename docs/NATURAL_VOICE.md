# 动物短句配音

后续制作统一遵循 [配音制作与验收规范](VOICE_STANDARD.md)，参数以 `scripts/voice-profile.json` 为准。当前页面保留首批素材背景。

13条短句更换为本地离线生成的Kokoro-82M神经语音，取代原来的macOS Samantha系统朗读。句子原文不变，采用af_heart美式英语声音，速度0.92；保持统一温和声线，不做夸张变调或模仿真人声线。

- 官方模型与授权：[hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)，Apache-2.0。
- 官方生成库：[hexgrad/kokoro](https://github.com/hexgrad/kokoro)，本次作者环境版本0.9.4。
- 输出：`public/audio/phrases/natural/{id}.mp3`，13个静态文件，44.1kHz/128kbps。
- 处理：开头100ms、末尾180ms缓冲；loudnorm -18 LUFS、-2dBTP；开头15ms淡入。语速控制在合成阶段完成，不在播放时强行拉伸或升降调。
- 原录音 `public/audio/phrases/{id}.mp3` 保留，词卡的单词录音保持原样。
- 生成代码：`scripts/build-natural-phrases.py`。维护命令：`uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py`。作者首次运行需下载模型与Python依赖，仓库和浏览器均不包含模型。
- 中间WAV、时长及参数记录：`output/speech/animal-phrases/`（本地验证产物，不发布）。

网页只读取已生成的MP3，不调用TTS云服务，不消耗玩家的API额度。首页玩法提示中标明合成配音。

## 节奏与重听

至少展示4秒；音频真正结束后保留1.8秒跟读，动物保持友好眼神。字幕提示从“听朋友说一句”变为“可以跟着说一说”；不评判发音、不要求孩子回答。结束时280ms淡出，之后出泡或戴帽子挥别。

“再听一次”重新播同句并重置阅读/跟读计时；旧播放结束不得推进流程。暂停会停止并隐藏，恢复完整重读；淡出中暂停也能恢复本句；退出、重开均取消旧回调。12秒仅作音频加载/播放异常兜底。

## 本轮验收

- 模拟模式横向wheel取消默认行为，竖向wheel、Ctrl/Meta缩放保持可用；退出模拟后不再拦截。保留浏览器显式返回按钮和快捷键，未使用history回退陷阱。macOS原生触控板/浏览器级手势仍需在实际设备复核，自动化只能验证页面事件的拦截。
- 首页入口打开47词的自定义面板，分类、图片、独立中英文行、英文点读、静音、连续换词停止旧音频、关闭停止播报。Tab焦点限制在面板，Escape返回，关闭恢复入口焦点；不打开摄像头、不计分。
- 四种尺寸复核首页/面板与纵向滚动：390×844、320×568、844×390、667×240。
- 实际开场短句、跟读、重听、退场→泡泡→词卡→动物互动→告别→戴帽子/挥别→结果闭环；保留手动拍照。
