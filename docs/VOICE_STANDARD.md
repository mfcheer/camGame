# 配音制作与验收规范

这是后续智能体和人工维护者的统一入口。2026-11-13用户明确认可当前动物短句的声音，并要求今后按同一流程生成。已有13条配音是验收基准；本次规范整理不重录它们。

## 1. 固定声线与输出

以 `scripts/voice-profile.json` 为唯一参数来源，不在新脚本里另写一份常量。

| 项目 | 标准 |
|---|---|
| 英文引擎 | 本地离线Kokoro-82M，Python kokoro 0.9.4 |
| 模型来源 | https://huggingface.co/hexgrad/Kokoro-82M，Apache-2.0；模型摘要见配置 |
| 语言/声线 | 美式英语 `a` / `af_heart` |
| 语速 | `0.92`，在合成时控制，播放时维持1倍速 |
| 原始采样 | 24kHz，单声道 |
| 首尾留白 | 100ms / 180ms，不裁掉辅音或词尾 |
| 发布编码 | MP3，44.1kHz，128kbps |
| 响度与峰值 | `loudnorm=I=-18:TP=-2:LRA=7`，开头15ms淡入 |
| 中文 | 词卡中文沿用Tingting、210字/分钟；英文使用上述自然声线 |

保持温和、清楚、自然的表达，不用升高播放音调的方法伪装幼儿声。不要擅自换成Samantha、浏览器实时朗读或其他音色，也不要批量重录用户已接受的素材。浏览器语音合成仅为运行时失败兜底。

## 2. 先维护文本

- 动物短句：`src/animalPhrases.js`；一句简短、语法正确、与动物/情境一致的英文，配独立中文。保留正常句首大写和问号/感叹号，让模型生成对应语调。
- 单词：从 `src/wordsConfig.js` 的词库条目取规范ID、小写英文和中文。先去重，再生成；复数别名不单独制作一套录音。
- 不向模型输入教学说明、日期、表情或旁白提示；声音读出的内容必须与卡片相符。
- 修改同ID的文本时，已有录音不能继续沿用：对该ID定向重建并更新清单。

## 3. 标准命令

需要Node、ffmpeg、Python 3.12与uv。首次生成会下载模型/依赖；它们只存在作者环境。`--dry-run`不需要模型或Python语音依赖，可以直接运行：

```sh
python3 scripts/build-natural-phrases.py --only hello-play --dry-run
python3 scripts/build-natural-phrases.py --kind words --only egg --dry-run
```

生成缺失的短句（将ID换为新条目）：

```sh
uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py --only hello-play
```

修改已有短句，定向重建：

```sh
uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py --only hello-play --force
```

生成新词的完整双语与英文复习音频：

```sh
uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py --kind words --only egg
node scripts/sync-word-manifest.mjs
```

词卡中文生成需要macOS的`/usr/bin/say`和已安装的Tingting。其他系统可先完成英文/文本工作，但不能偷偷换用另一声线或声称完成了未生成的中文素材。

默认保留所有已有文件；`--force`必须与`--only`一起使用，避免误覆盖整库。无参数时只补缺失短句。先核对dry-run计划，再执行生成。

## 4. 文件与记录

- 短句：`public/audio/phrases/natural/{id}.mp3`。
- 完整学习音频：`public/audio/words/{id}.mp3`，仅在主动点“听中文和英文”时播放，中文→英文→中文→英文。
- 少量自动英语/主动英文重听/首页点读：`public/audio/words/review/{id}.mp3`，英文一次。
- WAV与临时中文：`output/speech/`，忽略并且不发布。
- 制作清单：`docs/voice-manifest.json`，记录原文、声线配置、相对路径与实际文件SHA256。生成脚本更新清单；不要把历史系统录音错误标为自然语音。

本次只将既有13条自然短句登记到清单；当前47个单词的历史录音保持不变。后续新增/明确修改的英文使用新标准，整库升级应作为单独的用户需求处理。

## 5. 验收与交付

1. 对照原文检查发音、重音、漏词、截尾和突兀留白；具备音频试听能力时试听。无法试听时如实记录，不以“已解码”冒充听感验收。
2. 用ffprobe或浏览器确认文件可解码、采样率、时长和音轨；短句不能是静音或空文件，检查峰值不削波。
3. 在应用实际点读，验证新路径兼容GitHub Pages子目录、快速换词只播一条、重听不重复计分。
4. 默认自由玩无人声自动播报，图片泡泡保留。开启“自动听英语”后每轮最多1词，距所有上一段语音结束至少12秒有效游玩时间；繁忙跳过机会，不入队补播。对应词签显示至发音结束后650ms。反馈与450ms出泡不等语音，完整词卡与动物短句都由显式点击触发；后台/暂停恢复不自动重播。规则见`FLOW_LEARNING.md`。
5. 验证暂停、后台/前台、重开、退出：无残留声音、旧Promise不能推进新一轮、返回后可点继续恢复声效与最近待播句/词；失败有时限和恢复入口。
6. 执行相关专项、`npm test`和`VITE_BASE_PATH=/camGame/ npm run build`，检查最终浏览器画面。iPhone原生系统中断须区分实际真机与桌面模拟结论。
7. 交付说明列出新增/改动ID、命令/参数、素材路径、验证结论与未验证项。不要把模型放进网页或使用运行时云TTS；分享者无额外调用费用。
