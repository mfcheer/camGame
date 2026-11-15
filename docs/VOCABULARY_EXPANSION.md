# 课程词库扩充

截至 2026-11-15，游戏有 126 个去重词条。本轮在原有 110 词之上增加 16 词，保留现有游戏模式、抽词和播报规则。

| 主题 | 本轮新增 | 图片设计 |
| --- | --- | --- |
| 身体部位 | head、arm、leg、finger | 用人物局部与明确指向表现部位，避免与 face、hand 混淆 |
| 数字 | three、four、five | 大数字加对应的 3、4、5 个圆点；词库「数数乐园」也收录原有 one、two |
| 动物 | chick、butterfly、turtle | 独立主体与鲜明轮廓，便于小朋友一眼辨认 |
| 水果 | orange、lemon | 真实水果形态；`orange-fruit` 是橙子 ID，原 `orange` 仍表示橙色 |
| 教室 | paper | 一张清楚的纸张 |
| 颜色 | gray | 灰色颜料样本，避免与形状卡混淆；`grey` 作为查找别名 |
| 玩具 | bubble | 单个彩色泡泡 |
| 生活 | sunny | 明亮太阳和晴朗天空 |

新插图存放在 `public/images/words/learning/`。13 张主体插图是透明背景 WebP，数字卡使用可编辑 SVG，均复用于词库、泡泡及详细词卡。图片优先表达单一概念，不在画内添加英文或中文。

每个新词按 [配音规范](VOICE_STANDARD.md) 制作 3 份离线 MP3：`/audio/words/{id}.mp3` 是中文→英文→中文→英文，`/audio/words/review/{id}.mp3` 是英文一次，`/audio/words/zh/{id}.mp3` 是中文一次。英文沿用 Kokoro `af_heart`，中文沿用 Tingting；素材记录在 `docs/voice-manifest.json`。生成后运行 `node scripts/sync-word-manifest.mjs` 同步公开清单。

历史批次来源见 `src/expandedVocabulary.js`、`src/fruitsVocabulary.js`、`src/drinksVocabulary.js`、`src/complementaryVocabulary.js` 和 [绘本导入说明](STORYBOOK_VOCABULARY.md)。本轮词条在 `src/nextVocabulary.js`；没有把新词误记成绘本或老师照片来源。
