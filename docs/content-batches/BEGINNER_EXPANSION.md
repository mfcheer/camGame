# 入门短语与对话扩充内容卡（2026-11-18）

用户已确认上一轮全部12条短语与5组对话。复用既有声音与绘本画风，不新增玩法门槛。

## 短语内容卡

每项独立静态SVG、完整中英中英、英文短读、中文短读。过程动作另有16帧/2秒无声图集；透明背景、主体居中留边、无文字。关联仅用已存在的单词ID，动作动词在完整短语中引入，本批不增加独立动词词条。

| ID | 英文／中文 | 关联词 | 静态构图／关键动作与选择理由 |
|---|---|---|---|
| red-apple | red apple／红苹果 | red, apple | 一个红苹果，绿叶不遮红色主体；静态颜色描述 |
| yellow-banana | yellow banana／黄香蕉 | yellow, banana | 一根黄香蕉，保留原有弯曲外形；静态 |
| yellow-duck | yellow duck／黄色的小鸭 | yellow, duck | 黄身橙嘴侧面小鸭，复用已验收图；静态 |
| red-heart | red heart／红色的爱心 | red, heart | 单一红色心形，无表情干扰；静态 |
| blue-circle | blue circle／蓝色的圆形 | blue, circle | 单一实心蓝圆，无球面阴影；静态 |
| two-cats | two cats／两只猫 | two, cat | 两只完整橘猫清晰分开、同等大小；静态数量 |
| two-balls | two balls／两个球 | two, ball | 两个相同皮球左右分开；静态数量 |
| three-apples | three apples／三个苹果 | three, apple | 三个同大红苹果三角布局且互不重叠；静态数量 |
| eat-an-apple | eat an apple／吃苹果 | apple | 侧面孩子举苹果到张开的嘴→接触咬一口→放下、咀嚼；封面留在咬苹果时刻，苹果缺口可见，循环低位重置；不能只晃苹果 |
| drink-water | drink water／喝水 | water | 侧面孩子把透明蓝水杯举至嘴→倾杯喝水→放下；水面与杯姿态一致，静态封面为杯口接嘴；不能只晃水杯 |
| kick-the-ball | kick the ball／踢球 | ball | 侧面全身孩子支撑腿落地、后摆脚→前踢接触球→球离脚滚出→低位重置；静态封面为脚接触球，不用手碰球 |
| hug-the-teddy | hug the teddy／抱抱泰迪熊 | teddy | 正面孩子与棕色泰迪，张开双臂→双手环住熊→轻收紧→放开；封面为环抱，无抛掷漂浮 |

来源：项目原创可复现 scripts/build-beginner-art.py；果蔬/鸭/熊复用 public/images/words/learning 中本项目已验收矢量并内嵌，不修改源图。猫狗以既有橘猫／棕狗辨识特征绘制词汇插画，不修改游戏角色模型或角色动作。

## 对话内容卡

所有问题和完整回答分别生成英文、中文、主动完整双语，游戏仍只读一次英文。每个选项独立静态图；观察题有独立题图。复用原有手势保护、每帧单选、首错提示／次错示范、12秒无回答退出、重听不计分和原有告别。7组按完整一轮依次出现，避免只在前两组循环；每组观察情境独立轮换两个答案。

| ID／关联概念 | 问题中英文 | 回答中英文 | 情境、构图与判断 |
|---|---|---|---|
| identify／cat,dog | What is it?／这是什么？ | It's a cat.／这是一只猫。；It's a dog.／这是一只狗。 | 中央完整猫或狗；下方同风格各一只猫狗静态图。观察题，图决定正确答案；提示“看看上面的动物，再试一次” |
| color／red,blue,ball | What color is it?／它是什么颜色？ | It's red.／它是红色的。；It's blue.／它是蓝色的。 | 中央单色红球或蓝球，有轮廓阴影表示球；答案为纯红、纯蓝色块，不能多色干扰。观察题，提示看颜色 |
| count／one,two,ball | How many balls?／有几个球？ | One ball.／一个球。；Two balls.／两个球。 | 中央一个或两个清楚分开的同色球，答案亦为数量图，无阿拉伯数字代替实物。观察题，提示数球 |
| likes／apple,banana | What do you like?／你喜欢什么？ | I like apples.／我喜欢苹果。；I like bananas.／我喜欢香蕉。 | 两颗泡泡各为熟悉水果，无中央“正确”图；自由表达，任何选择都成立 |
| drinks／milk,water | What would you like?／你想要什么？ | Milk, please.／请给我牛奶。；Water, please.／请给我水。 | 两颗泡泡为白色牛奶盒及小杯／透明蓝水杯；自由选择，不判错，保持礼貌完整表达 |

新图都是静态即可表达的物体、颜色和数量，不加无关动画。旧心情、天气文本和录音不变。技术验收、截图与试听／真机结论待制作后填写；技术解码不能代替主观试听。

## 生成与验证记录

- 定向范围及入口：[生成记录](BEGINNER_EXPANSION_COMMANDS.json)。四种kind均先dry-run，再按对应新ID列表生成；不使用force。新增36份短语录音、45份对话录音，英文Kokoro-82M/af_heart/0.92，中文Tingting/210；完整双语为中→英→中→英。
- 新增28份SVG：12封面、4动作图集、12问答选项／题图。图片不依赖运行时服务，不新增人声通道或云密钥。
- 完整npm test、Pages子路径build、diff检查通过。qa_v41/v42扩至22条/8动作的完整轮换与资源／回退检查；qa_v46保留旧问答、告别及暂停行为；qa_v47新增4项批次与各题行为回归。
- 全库605份MP3只读审计：quiet0、invalid0。新增81份逐份解码、峰值8000以上且无削波、时长与清单SHA256核对通过；指定Browser中81份均HTTP正常并通过AudioContext解码。900份既有发布图片与录音哈希不变，没有覆盖已验收素材。
- 指定Browser按develop-web-game动作—观察方式验证，遵守会话指定界面，未另启shell浏览器客户端。实际词库点读drink water完成、hug the teddy主动完整双语完成且不计分；模拟指尖碰撞6次从0→6，包含喝水、红苹果、两只猫、踢球、吃苹果、抱泰迪，进入问答；原生鼠标从题目移入猫泡泡，选择后读It's a cat.；重听仍6分，后台中断重听并冻结，返回保持暂停，实际点击继续不自动重播，再自然中英告别到ESCAPED和结果页。
- 同源1194×834、834×1194视口检查并打开截图：颜色、数量、喜好、饮品题图与选项无裁切，动物全身可见，目标保持居中。数量两错提示／示范、喜好香蕉和饮品水通过模拟触屏或指尖选中。iframe内程序化开局不能当成可信音频解锁，尺寸测试使用原有音频8秒失败兜底开放答案；实际声音生命周期以上述主页面流程为证据。
- 四个新动作逐帧构图及首尾衔接已目检，实际泡泡暂停冻结／恢复推进、学习卡减少动态显示封面及加载失败保留封面已验证；自动套件覆盖八动作纹理同步失败静态回退。浏览器记录未出现新增window error/unhandledrejection。
- 证据在 `/Users/mfcheer/code/camGame/output/content-expansion/`：phrase-covers.png、action-keyframes.png、learning-card.png、dialogue-identify.png、color-landscape.png、count-portrait.png、likes-portrait.png、drinks-portrait.png，及browser-evidence.json、new-audio-check.json、hash-check.json、npm-test.log、build.log。
- 主观发音／听感、真实iPad摄像头手势及儿童理解能力仍待家长体验；解码、尺寸模拟与合成输入不记为真机或主观试听通过。三份既有QA时间戳JSON保留原样，不属于本批改动。未提交、未推送。
