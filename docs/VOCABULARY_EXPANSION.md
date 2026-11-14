# 词库扩充：课程照片与熟悉的事物

词库从47扩充到75个规范词条，新增28词。教师课程照片中已有的 red、blue、circle 沿用原词条并追加 `classroom-next-lesson` 来源，不重复计数。

- 形状：star、heart、oval。
- 颜色：pink、white、black、brown。
- 教室：eraser、ruler、schoolbag、scissors。
- 玩具与游乐：puzzle、balloon、slide、swing。
- 动物朋友：rabbit、duck、frog、sheep；不将这些额外动物记作绘本原文。
- 身体部位：face、eye、ear、mouth、nose、hair，图中标示对应位置。
- 课程复习：weather、one、happy，以及原有 red、blue、circle。

图片为 `scripts/build-expanded-word-art.mjs` 创建的可编辑SVG，每张复用到词库、泡泡、详细卡。此前重新设计的 circle 和 orange 属于独立维护素材，`scripts/refresh-word-art.mjs` 不再覆盖它们。

所有新词按照 `docs/VOICE_STANDARD.md` 用项目自然英文声线与 Tingting 中文制作：每词包括英文短读、中文短读和完整中英四段音频。素材路径沿用 `/audio/words/review/`、`/audio/words/zh/` 和 `/audio/words/`，制作记录及SHA256记录在 `docs/voice-manifest.json`。更新词库后用 `node scripts/sync-word-manifest.mjs` 同步公开清单。

分类入口随词库扩展并可在手机横向滑动；同一局保留同一词卡，游戏抽词优先避开最近五局的词或同一概念；保留已有中英文自动播报开关、配对节奏和主动点读。词库、图片与音频分别验证，浏览器对新词进行实际点读和泡泡命中。音频参数与解码检查不能替代家长实际听感验收。
