# 彩虹小队：智能体协作约定

## 开始工作

- 先查看 `git status --short` 和 `progress.md`，保留用户已有改动，尤其不要提交测试运行覆盖的既有QA报告。
- 网页游戏改动采用 develop-web-game 的实际浏览器验证流程；打开最终截图检查。计时、声音与后台恢复改动必须验证完整闭环，不能只看构建通过。

## 配音：用户已确认的长期标准

**涉及新建或修改语音素材时，先读 `docs/VOICE_STANDARD.md`，并使用 `scripts/voice-profile.json` 与 `scripts/build-natural-phrases.py`。**

- 用户已认可 Kokoro-82M / af_heart / 0.92 的英文效果；后续英文单词和短句默认沿用，不能退回系统Samantha朗读或随意改变音色、语速。
- 先 `--dry-run` 核对范围；已有录音默认保留。修改现有句子时使用 `--only <id> --force` 定向重建；不得整库覆盖已验收素材。
- 动物短句只播一遍英文；词卡首见为中文→英文→中文→英文，复习只读一次英文。中文沿用当前已接受的Tingting方案，未经明确需求不顺带替换整库。
- 只提交静态音频、生成脚本、配置和来源记录；不要提交模型、Python环境、临时WAV，不引入玩家端TTS服务或密钥。
- 旧 `build-storybook-audio.mjs` / `build-classroom-audio.mjs` / `build-review-audio.mjs` 是历史素材工具，不是新英文配音的标准入口。

## 音频与流程约束

- 正常流程等真实播报结束再留阅读/跟读时间。超时仅用于失败兜底；暂停、切后台、退出、新一轮必须使旧播报和异步回调失效。
- 手机切后台时暂停并停音；返回后保留进度，用户点“继续游戏”时同步解锁AudioContext。兼容 `suspended`、`interrupted`、`closed`；媒体加载、播放与恢复均不能无限等待。
- 重听不重复计分。指尖自动重听须限制重复触发，不能让抖动不断重置词卡计时；手动点击可明确重听。
- 不通过篡改history或禁用正常浏览器返回操作来锁定页面。
