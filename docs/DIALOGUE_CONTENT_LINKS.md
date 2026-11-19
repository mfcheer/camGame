# 解救后选题关联（2026-11-20）

本次只调整选题，复用全部图片、录音、角色动作和问答流程。出泡、计分、轮长、自动读词均沿用现状。关联依据是 BubbleManager.roundSeenWords 中本轮已碰破的内容，不使用准备池、首页浏览或角色身份。

## 内容卡与对应表

| 碰破内容ID | 问题（中／英） | 回答与情境 | 静态题图／理由 |
| --- | --- | --- | --- |
| cat、dog | 这是什么？／What is it? | 猫／It's a cat.；狗／It's a dog.，按对应动物观察 | 原猫／狗图，匹配触发内容 |
| blue-ball | 它是什么颜色？／What color is it? | 红／It's red.；蓝／It's blue.，正确为蓝 | 原蓝球图，不能从其他蓝色物体推断 |
| two-balls | 有几个球？／How many balls? | 一个球／One ball.；两个球／Two balls.，正确为两个 | 原双球图，不从两只猫推断 |
| apple、banana、red-apple、yellow-banana、three-apples、eat-an-apple | 你喜欢什么？／What do you like? | 苹果／I like apples.；香蕉／I like bananas.，两者均接受 | 无题图，原水果回答图；只是表达喜好 |
| water、milk、drink-water | 你想要什么？／What would you like? | 牛奶／Milk, please.；水／Water, please.，两者均接受 | 无题图，原饮品回答图 |
| happy | 你今天感觉怎么样？／How are you today? | 开心／I'm happy.；难过／I'm sad.，两者均接受 | 无题图，保留安静回应难过，不替孩子决定心情 |
| sunny | 今天天气怎么样？／How’s the weather today? | 晴天／It's sunny.；下雨／It's rainy.，正确为晴 | 原晴天图，明确为游戏里的天气 |

不新增过程性动作或资源。声音仍使用现有完整英文问题和答案短读，主动完整双语资源保持现状。观察题提示一次、第二次示范正确答案，无回答12秒有效时间退出；其余声音及暂停标准见 DIALOGUE_PRACTICE.md。

## 选择和生命周期

- 排除上一题型，按本次打开游戏以来问得最少的候选题型优先，相同次数随机；一个题型多个匹配场景时随机选其中一个，重复碰破不增加权重。
- 无关联候选按独立游标继续原七组轮换，并跳过上一题型；关联题不移动兜底游标。观察题仍维护独立场景轮换，关联时用明确匹配场景。
- 题目开始时一次性确定。暂停、后台、恢复、重听不重新选题、不自动重播。
- 只在完整新题开始时计入选题次数。重开和退出使用现有 roundSeenWords 清理；新轮不携带旧内容。选题统计仅内存，不写学习掌握率。
- 证据输出到 output/dialogue-link/；浏览器尺寸模拟不替代真实iPad、真实摄像头或儿童理解测试。

## 验证记录

2026-11-20：qa_v50新增7项专项，验证精确映射、排除误配、候选计数和随机、连续避重与独立兜底、暂停重听固定、Game传入碰破集合快照及现有新轮清理；qa_v46/47与完整npm test通过。Pages子路径生产构建通过，保留既有大包提示；三份既有QA报告运行前后逐字节保留。无图片、音频、生成配置修改。

遵守会话指定Browser界面，采用develop-web-game动作—观察流程，没有另起技能脚本浏览器。实际点击模拟入口，使用模拟指尖真实碰撞完成自然出泡0→6（pinwheel、two-balls、robot），选中count且正确为two-balls。第二轮为可复现检查，在首泡后将后续队列指定为blue-ball，仍使用碰撞完整0→6；选中color且正确为blue。默认静音状态先验证选择；通过实际声音按钮解除静音，主动重听问题、实际点击blue后回答播放完成，随后正常时间完成中文→英文告别、ESCAPED和结果页。声音生命周期记录仅为技术播放验证，不声称主观听感已验收。

调用实际后台/前台生命周期模拟中断，advanceTime推进20秒后仍暂停且题型、正确答案、有效计时不变；实际继续按钮恢复不重选。重开后碰破集合为空、对话关闭。数量题两次错误进入提示并示范正确答案。1194×834和834×1194同源子文档为真实CSS视口、缩放展示，布局检查中直接提供two-balls碰破集合并调用结算以隔离题图验证，不作为真实计分闭环；两张最终截图已打开目检，图片、答案和角色全身无裁切。主页面无新增window error/unhandledrejection。最终切空白页停音。

证据：output/dialogue-link/browser-evidence.json、color-linked.png、count-landscape.png、count-portrait.png、npm-test.log。真实iPad摄像头/系统切后台及儿童理解待用户体验。本地未提交、未推送。
