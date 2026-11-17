# 本期小短语

新增 green doll、blue ball、red car、red train、red bike、purple teddy。

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
