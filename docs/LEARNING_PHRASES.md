# 单词与短语资源制作、接入和验收规范

这是新增学习内容的统一交接入口；配音细节以 [VOICE_STANDARD.md](VOICE_STANDARD.md) 和 `scripts/voice-profile.json` 为准。以下先保留现有实现说明，再给出后续制作流程。

首批静态短语：green doll、blue ball、red car、red train、red bike、purple teddy。

- 内容源：`src/learningPhrases.js`。各自拥有文字、图片、完整双语与中英文短读；`relatedWordIds` 只关联现有单词。
- 选择：`src/contentSelection.js`。每轮一个短语，其余沿用单词主题；保留角色原有内容名额与重复次数。短语优先少出现的，避开最近出现；单词与关联短语双向互斥，短语之间允许共享词。准备失败换回现有单词。
- 接触记录：本地 `rainbow-content-exposure-v1`，每轮每项实际生成一次记一次；退出准备不记，不表示掌握。存储不可用时安全退回本次近期记录和随机选择。
- 小花园：单词 / 小短语切换；保留原有分类和按需读音。不增加模式或问答操作。
- 图片：`public/images/learning-phrases/`；基于项目已有单词 SVG 制作对应配色，保留原图，红车和红自行车复用原绘图的副本。
- 音频：`public/audio/learning-phrases/`，`review/` 英文、`zh/` 中文、根目录主动双语四段。英文 Kokoro-82M / af_heart / 0.92；中文 Tingting / 210。来源与 SHA256 见 voice-manifest.json。

生成仅使用 scripts/build-natural-phrases.py 和 voice-profile.json：

```sh
python3 scripts/build-natural-phrases.py --kind learning-phrases --dry-run
python3 scripts/build-natural-phrases.py --kind zh-learning-phrases --dry-run
uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py --kind learning-phrases
python3 scripts/build-natural-phrases.py --kind zh-learning-phrases
```

修改已有短语时必须 `--only <id> --force`。不移动或重录既有单词、角色问候。

## 动作短语（2026-11-17）
新增 bounce the ball／拍球、move the train／移动小火车、move the car／移动小汽车、ride the bike／骑自行车。沿用每轮一个短语、十项轮换和关联单词双向去重。

可选 `motion: {src, frames:16, duration:2}` 指向无声 SVG 横向逐帧图。`scripts/build-action-illustrations.py` 生成项目原创矢量封面和动作图，手拍球、手移动玩具与坐姿踩踏分别表达动作，无第三方素材依赖。内容展示与发音、碰撞计分独立。

泡泡由有效游戏时间驱动纹理帧；学习卡按可见时间播放，关闭后取消绘制；小花园和词签仍显示静态封面。暂停/后台冻结，减少动态效果及动作加载失败显示封面；不增加观看或模仿任务。四组配音仅定向生成，沿用已认可的英文与中文标准。


## 后续制作流程

### 1. 先写内容卡，再生成资源

每个新增单词或短语在交付记录中填写以下字段；不能只给一句英文就直接批量生成。

```text
ID：小写连字符，与现有内容不重名
类型：单词 / 静态短语 / 动作短语
英文与中文：画面和配音实际表达的同一含义
关联单词：现有规范 ID；新词先加入词库再关联
静态画面：主体、颜色、姿态、视角、构图、需排除的歧义
动作说明：谁对什么做什么；起始→关键动作→结束→循环衔接
表现选择及理由：一张图能否解释核心含义
资源来源：原创生成脚本或生成描述、参考资产及许可
验收：技术检查、浏览器检查、试听、真机检查各自的结论与证据
```

例如 `blue ball` 的重点是蓝色和球，静态即可；`bounce the ball` 的重点是手拍球与球触地回弹，需要动画，不能仅把球上下漂浮当作完整动作。`ride the bike` 必须画出骑乘与踩踏，只有自行车或车轮旋转不够。

### 2. 动静态选择规则

| 内容含义 | 默认表现 | 检查要点 |
|---|---|---|
| 物体、颜色、形状、数量、明确姿态或表情 | 静态图片 | 缩小后能认出主体及描述的特征，如 blue ball、happy |
| 位移、操作、身体动作，单帧会丢失核心含义 | 静态封面 + 无声动作图 | 主体、受作用物、关键过程清楚，如 move the train、ride the bike |
| 单帧含义有歧义，或动作过于复杂 | 先重写内容卡、简化构图和动作 | 不用无关晃动冒充动作；不能识别就不交付为完成 |

是否有动词不是唯一判断依据：根据要教的含义选择。不要为所有词加动画，也不要只根据文件扩展名判断动静态。动画必须有可独立理解的静态封面，供词库、词签、加载失败和减少动态效果时使用。

统一画面语言：幼儿绘本风、圆润造型、柔和配色、主体居中、留出裁切边距、透明背景、无文字或水印；保持封面与动作图的主体、颜色、比例一致。优先沿用项目相应类别的已验收素材。单词插画参考 [WORD_ARTWORK_V2.md](WORD_ARTWORK_V2.md)；动作矢量参考现有四组，使用可复现代码，避免每帧重新随机生成导致角色变形。

### 3. 每条内容的资源清单

| 资源 | 单词 | 短语 |
|---|---|---|
| 内容登记 | 在合适的 vocabulary 内容源登记，经 `src/wordsConfig.js` 合并去重 | `src/learningPhrases.js`，含中英文、ID、`relatedWordIds` |
| 静态图（必需） | 沿用类别路径；`image` / `itemImage` / `bubbleImage` 指向正确素材 | `public/images/learning-phrases/{id}.svg` |
| 英文短读（必需） | `public/audio/words/review/{id}.mp3` | `public/audio/learning-phrases/review/{id}.mp3` |
| 中文短读（必需） | `public/audio/words/zh/{id}.mp3` | `public/audio/learning-phrases/zh/{id}.mp3` |
| 主动完整双语（必需） | `public/audio/words/{id}.mp3` | `public/audio/learning-phrases/{id}.mp3` |
| 动作图（按语义需要） | 当前标准单词默认静态；扩展动作需补相应接入及测试 | `public/images/learning-phrases/{id}-motion.svg`，登记 `motion` |
| 来源与检查记录（必需） | 配音清单、图片来源、生成命令、验收记录 | 同左；动画额外保留生成脚本和动作说明 |

完整双语顺序为中文→英文→中文→英文，仅供主动学习按钮使用。单词的近义/复数别名先通过现有合并逻辑处理，不另建重复音频。短语拥有独立资源，不能把关联单词录音拼起来代替整句自然朗读。

现有动作规范为16帧横向 SVG 图集、每格256×256、总宽4096、循环2秒；`motion: {src, frames:16, duration:2}`。不能嵌入脚本、外部资源、自动 SVG 动画或音轨。泡泡动画走有效游戏时间，学习卡走已有可清理绘制逻辑；不得自行新增永久计时器。

注意：`scripts/build-action-illustrations.py` 当前仅生成写在脚本中的四个动作，并非输入任意短语即可产出新动画的通用生成器；新增动作需要实现对应绘图分支和生成列表，再检查旧文件无意外变化。静态颜色短语也需要制作对应插画，没有现成的一键语义生成器。`src/learningPhrases.js` 的动作 ID 列表需要同步更新，只有添加图片文件不会自动启用动画。

### 4. 定向生成命令

先把以下示例的 `blue-ball` 换成已经登记的新短语 ID。先运行两条 dry-run，确认只涉及该 ID；正式命令分别生成完整双语+英文短读、中文短读：

```sh
python3 scripts/build-natural-phrases.py --kind learning-phrases --only blue-ball --dry-run
python3 scripts/build-natural-phrases.py --kind zh-learning-phrases --only blue-ball --dry-run
uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py --kind learning-phrases --only blue-ball
python3 scripts/build-natural-phrases.py --kind zh-learning-phrases --only blue-ball
```

新增单词按相同步骤，将两种 kind 换为 `words` / `zh-words`，ID 换成该单词，最后运行 `node scripts/sync-word-manifest.mjs`。英文固定 Kokoro-82M / af_heart / 0.92，中文短读及学习卡固定 Tingting / 210；不得将动物结束语专用中文声线套用到学习短语。

已有文件默认保留。修改文本时，两种生成命令都先定向 dry-run，再加 `--only <id> --force`，完整双语和两个短读一起核对。仅音量偏低先保留原发音做定向增益处理，流程见配音规范第7节；不能整库重录。

生成后执行 `python3 scripts/audit-voice-volume.py` 做全库只读检查，查看 `output/audio-audit/plan.json` 的低音量、静音和解码结果；不要无审查运行全库 `--repair`。峰值兜底不能代替发音和听感试听，短语不能套用单个单词的总时长限制，不能为了达标加速或截掉词尾。`docs/voice-manifest.json` 由生成器维护，核对文本、参数、路径及实际 SHA256。

### 5. 游戏接入与验收门槛

1. 登记后检查统一内容查询、小花园切换、词签、主动学习卡和实际泡泡均使用新资源，子路径部署的 URL 正确。保留每轮一个短语及关联单词双向避让；不要为增加内容改玩法门槛。
2. 运行 `node test/qa_v41_learning_phrases.mjs` 与 `node test/qa_v42_action_phrases.mjs`。这些测试目前含6/4/10等批次数量断言；扩容时按新范围维护覆盖，保留逐项资源检查、轮换覆盖、双向冲突、加载失败静态回退等行为断言，不能只删除旧数量断言而不补新内容覆盖。
3. 运行完整 `npm test`、`VITE_BASE_PATH=/camGame/ npm run build` 和 `git diff --check`。测试使用隔离副本，或保护既有 QA 报告，不能把运行时间戳混进内容提交。
4. 遵循 develop-web-game 的动作—观察流程，在指定浏览器实际打开新卡、点读英文及完整双语、生成并碰破新泡泡：一次触碰计一分，重听不计分；检查最终截图。动画至少检查循环首尾、封面一致、暂停冻结/继续推进、减少动态效果、加载失败回退、关闭卡片后绘制释放。
5. 检查切后台停音并暂停、返回不自动播放、主动继续恢复；慢加载和失败时换卡、分类、关闭可用，旧请求不补播；最后泡泡的读词/词签结束后才进入庆祝告别。图片、动画和语音独立，不能等待音频才允许碰泡泡。
6. 用 iPad 11英寸横竖屏尺寸检查实际泡泡与学习卡中的主体辨识度、裁切、按钮和碰撞目标。桌面尺寸模拟与真机体验分开记录；不能声称模拟已覆盖 iPad 音频中断或儿童理解能力。
7. 交付列出 ID、全部资源、生成命令、来源、测试与截图证据；试听和真机未做就明确写待验。保留已验收旧资源，不提交模型、环境、临时 WAV。

这些规则可固定声线、资源格式、接入方式和验收门槛，不能保证任何智能体仅靠一句提示就自动产出同等画面与主观听感。新内容必须对照现有样例完成上述验收，尚未实现任意短语的一键全流程生成。
