# 幼儿园绘本词汇导入

来源：用户提供的《Toys》（Anthony Curran）与《Two》（Torran Anderson）两个12页PDF。逐页查看实际画面，正文采用印刷书页3–10；两PDF含重复拼版页，已合并同词来源，忽略裁剪区外的文字层。只导入正文核心词和书名主题词。

现有21词保留，新增18词，总计39个规范词条。全部小写，复数归入单数，别名可查同一对象与音频；原书拼写与PDF/印刷页码记录在 src/storybookVocabulary.js。词库数据通过 mergeVocabulary 合并，重复导入不会增加词条或覆盖已有素材。

| 绘本 | 原书词形 | 游戏词条 | 中文 | 印刷页 |
|---|---|---|---|---|
| Toys | Toys | toy | 玩具 | 封面 |
| Toys | blocks | block | 积木 | 3 |
| Toys | bear | bear | 玩具熊 | 4 |
| Toys | paint | paint | 颜料 | 5 |
| Toys | drum | drum | 鼓 | 6 |
| Toys | plane | plane | 飞机 | 7 |
| Toys | wagon | wagon | 小拉车 | 8 |
| Toys | kite | kite | 风筝 | 9 |
| Toys | robot | robot | 机器人 | 10 |
| Two | Two | two | 二 | 封面/3–10 |
| Two | bees | bee | 蜜蜂 | 3 |
| Two | fish | fish | 鱼 | 4 |
| Two | birds | bird | 鸟 | 5 |
| Two | cats | cat | 猫 | 6 |
| Two | dogs | dog | 狗 | 7 |
| Two | cows | cow | 奶牛 | 8 |
| Two | horses | horse | 马 | 9 |
| Two | kids | kid | 小孩 | 10 |

bear 在本书中指玩具熊，复用已有 teddy 插画；保留两个不同英文词条的读音，但四词小主题同一轮只选其中一个。cat/dog 复用现有猫狗角色的预览图；现有3D动物选择功能与单词词库各自独立。

## 素材与生成记录

- 新矢量：public/images/words/learning/{toy,block,paint,drum,plane,wagon,kite,robot,two}.svg；沿用原词图的原生SVG形式，源脚本 scripts/build-storybook-vectors.mjs。
- 新位图：public/images/words/learning/{bee,fish,bird,cow,horse,kid}.webp，640px、透明背景。使用内置 image_gen 生成并逐张检查，再导出WebP；[完整提示词与输出路径](storybook-image-prompts.json)。原始生成图保留在作者环境的 Codex generated_images，项目直接消费以上工作区资源。
- 六张位图均为单一、易辨认主体的柔和立体幼儿插画，无文字、无场景、透明背景。玩具图沿用已有矢量体系，猫狗和熊复用已有图像。
- 完整音频 public/audio/words/{id}.mp3：Tingting中文→Samantha英文，重复两遍；复习音频 public/audio/words/review/{id}.mp3 只读一次英文。源脚本 scripts/build-storybook-audio.mjs，只补缺失文件，保留已有音频。
- 维护顺序：node scripts/build-storybook-vectors.mjs；在macOS且有ffmpeg时 node scripts/build-storybook-audio.mjs；最后 node scripts/sync-word-manifest.mjs。
- public/images/words/words-manifest.json 与运行时词库同步，包含39个唯一词条、图片、音频、别名和来源。

## 游戏体验与验收

沿用现有泡泡图片、小写英文/中文分行卡片、重听按钮、首次完整播报、同轮复现英文短读。Toys词并入玩具主题；Two词组成绘本主题，仍每轮选择4词、先看完再重复。

本轮新增11项专项，覆盖来源页码、大小写/复数/标点归一、重复导入、资源完整性、主题选词、原词形碰泡/短读、预加载、同图避重和公共清单同步。完整测试及浏览器验证结论记录在 progress.md；截图与读音时长在 output/playwright/v27/。PDF逐页渲染与提取文本仅保留在本地 output/pdf/word-import/。
