# 当前进度与续接门

更新时间：2026-09-27（成品 B 基础验证通过，B-R1 布局修订交付）。此文件是唯一的进度入口。

## 1. 当前结论

- 保留成果：人物字段、初始值、成长规则、原作分层与素材边界继续有效。旧 P0 的 43 项检查含已废止协议，仅作历史证据，不代表 MVU Zod 路线已通过。
- 当前阶段：用户已接受 P1，并在 R2 之后明确反馈“变量方面已经没有问题了”。变量故障按用户反馈关闭，保留现有 MVU 初始化和保存链；这不代表完整 P3 异常恢复或全部前端已经验收。
- 当前许可：用户确认“按照 单列＋左图右状态 的方向改布局”；本轮限共享人物组件、头像尺寸、相关说明和检查源码、本地构建/打包。原图、24 字段、图片匹配、背景和宿主读写保持原样。继续省去同步差异检查、目标枚举、推送后回读和额外备份目录；自动测试/typecheck/lint/浏览器、宿主写操作、模型调用、安装和发布保持独立边界，本轮均未执行。
- 当前产品状态：成品 A（含 A-R2 `c0c12066f521`）保持用户已接受；用户明确反馈“成品B基础验证通过”，但头像留白仍待改善。B-R1 已构建：开发 `0b79b82a19c9`、Gremlin `d784cc468961`，当前活动入口为开发版，新布局待手验。已使用成品 B 的 24 字段聊天可继续使用，仅刷新前端；N4 以前旧聊天仍无迁移/重置/删除。基础通过不补造逐项验收记录，完整 P2/P3/P4/P5 及 N5 未据此通过。
- N4 前置同步：沿用现有 `npm run sync:push` 与固定 UI `http://127.0.0.1:5173/live/state.html`；默认角色文件仍是 `DLNM-P1-香气链路.png`。本轮未执行真实推送，当前本地构建和同步输入均为最终开发候选；前置阶段的独立证据保留在第4节历史记录。
- 蓝图：`single-blueprint`，深度 1，子蓝图 0，`runtimePersistentBlueprintBudget = 0`。
- 临时问题支线：发送后首字前缺少反馈的问题随 A-R2 用户阶段验收关闭，当前无活动问题支线；没有新建蓝图。A 启动正则修复沿用；旧浏览器/Blob 问题只保留证据，先前全局渲染选项不视为本次修改入口。

旧 P0 合同归档：输入为当时 DESIGN、原作对照、两张参考图路径与本机公开宿主源码；输出为机器字段、旧格式样例、来源分层及依赖/素材账目，结果见 3.3。字段、来源等成果保留，技术退出条件已由当前 BLUEPRINT 的 MVU Zod 合同取代，定向回补见第 4 节。旧 P0 当时未写宿主、创建测试聊天、调用模型或复制游戏素材。

先读 [总设计案](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/docs/DESIGN.md)，再读 [实施蓝图](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/docs/BLUEPRINT.md)。保持三者职责分离，不在这里重复全部字段和需求。

## 2. 最近确认及禁止回退的更正

- **2026-09-27 B-R1 最新更正：**取消宽区 2×2，宽窄区统一单列，每项左图右状态；原图保留，窄图栏、自然高度和更小内边距减少空白，不强行等高。轻前端与全屏共用修改；新布局待手验。
- **2026-09-27 N4 确认：**破坏改名并新增塞拉菲娜/狸猫，总计 24 字段；smile 移除“微”；四图全幅、头像不折叠；塞拉菲娜与狸猫省去数值条和 details；旧聊天不迁移。原宽2×2窄单列选择已由 B-R1 覆盖；完整实施记录见第4节。

- **2026-09-27 同步要求：**整本覆盖当前世界书；省去同步检查和额外文件备份，本地 Git 保存源码版本。前端使用固定地址异步加载，不再靠反复导入更新；已打开的界面在刷新或重渲染后更新，不强制打断输入/全屏。该要求不代表提前实施 N4 图片或 N5 内容。
- 玩家是诺雅；共用香气只是日常邀请，不是强制任务。
- 月光都市瑟雷妮亚首版重意境，不扩成街道百科。
- 重型同层前端托管聊天呈现；真实聊天与生成仍走酒馆。NVL，人物栏独立，桌面和手机同等重要。
- **2026-09-24 最新前端要求：**流式及非流式回复自动更新；正文支持 Markdown 与经清理的 `v-html`；保留浏览器 Fullscreen API，弃用旧面板模式，非全屏改为只显示扩宽“人物与状态”栏的轻前端，不显示场景图。
- **2026-09-27 N3 补充：**使用 Grid 布局；体力/魔力条常显，其余人物内容使用原生 `<details>` 默认折叠。操作入口与必要状态提示保持可见，轻前端与全屏复用人物栏。
- **2026-09-24 素材与内容要求：**项目 public 图片仅作开发占位；正式运行由用户自行安装 Illustration-Gremlin 并导入图包。完善世界观、人物索引与具体条目；允许模型在正文使用 `<span style="color: red">文字</span>` 染色。展示染色不等于获得新的游戏颜色，不改变既有变量合同。
- **2026-09-23 补充：前端固定 Vue 3 + TypeScript + Vite。** 已获项目内安装许可并锁定版本，见第 4 节；不新增独立站点或平行状态系统。
- “清洗”已更正为“洗涤”。莉莉希雅数值好感度取消，也没有隐藏替代。
- 感度上限 1000；欲求上限 100 且初始 0。其他初始值以总设计的唯一字段表为准，不按上限变化自动放大。
- 已有红、绿、蓝、橙四种颜色；初始界面不是重新失去四种颜色的空白档。
- **2026-09-23 最新纠正：变量系统固定 MVU Zod，不受模式影响。** 原生消息变量只是其宿主存储层，项目不再自建变量协议、结算器或平行状态源。
- **卡片须实际绑定世界书与正则。** 必要设定、变量规则、当前状态上下文和前端呈现均须有对应组件；无绑定的空壳卡回复不算上下文验证。
- **取消独立的“酒馆能生成”测试。** 复用宿主生成；验收的是最终前端、正文、MVU 状态、上下文与历史/分支是否一致。保存恢复和异常处理作为该产品链路的一部分保留。
- 异常处理已选 A：保留正文、草稿和上一份有效状态；暂停下一轮；主动修复或重生成后再继续，不自动发送草稿。

## 3. 已有证据与边界

### 3.1 前序文档创建检查（历史记录，非本轮工作树状态）

- 创建前目录无目标三文件，采用新增而非覆盖。
- 创建前 Git 状态仅有未跟踪的 `AGENTS.md`；保持原样，不纳入本次修改。
- 创建前 `AGENTS.md` SHA256：`9BCDF80618F6DF98670AFE27B7CA6908ABED4CCF2687CFE2C6FCCB98C10D8DB6`。
- 原作对照文件本次确认存在，大小 674,888 字节；本次没有重新解释全部原作。
- 文档一致性检查：本次内存运行的 Node 断言检查通过，共 70 项；覆盖 UTF-8、文内本地链接、11 行人物数值、6 阶段的合同要素、17 个唯一验收场景、四类证据及仅创建三文件的范围。检查未创建额外脚本或依赖。
- `AGENTS.md` 创建后哈希与上述基线一致；工作树只新增本次三份 docs 文档，原有未跟踪的 `AGENTS.md` 保持原状。
- 只读交叉核对：已完成。核心设计与技术路线一致；补明压力样本数量属于工程建议，且用户直接接受首版时不为流程强制制造修改。动态数值的变化档位保留前序已确认值。此核对不代替产品测试。

### 3.2 前序只读观察：不是本次运行验收

宿主入口：[本地 SillyTavern](http://127.0.0.1:8000/)。本任务前序观察到 SillyTavern 1.17.0 release（提交 aa50edcf4）、酒馆助手 4.8.7；另外存在 JS runner in SillyTavern 1.0.0，它与酒馆助手不是同一个组件。实施前复查实际版本，不把旧观察当成当前持续事实。

前序还观察到正则、Prompt Template 及酒馆助手渲染相关能力；没有验证 MVU 的实际运行状态，不从欢迎页推断其安装情况。新路线已固定 MVU Zod，实际版本/来源与加载状态仍需核实。

接口来源：

- [当前宿主主脚本](http://127.0.0.1:8000/script.js)
- [酒馆助手 bundle](http://127.0.0.1:8000/scripts/extensions/third-party/JS-Slash-Runner/dist/index.js)
- [酒馆助手源码映射](http://127.0.0.1:8000/scripts/extensions/third-party/JS-Slash-Runner/dist/index.js.map)

前序 bundle 文本 UTF-8 SHA256：`67588e21066daf5d1ef05862979a5c1b579c9b22e1916bfd6a5fef50b6b51145`。这是当时读取内容的指纹，不是持续监测或下载资产。

| 当时读到的接口行为 | 对实施的约束 |
| --- | --- |
| `variables.ts` 的消息变量按当前 swipe 保存，`chat_message.ts` 可读各分支数据 | 快照跟随真实消息和回复分支，不另外创造聊天数据库 |
| 消息编号是位置索引，删除或移动会改变含义 | 核对聊天、消息、分支和内容修订，不把一个数字当永久身份 |
| 默认读取“最新”与默认写入“最新”的过滤语义有差异 | 显式定位目标消息，不依赖隐含的最新值 |
| 合并变量视图在消息 iframe 中受所在楼层范围影响 | 同层壳若停留于早期楼层，应显式读目标回复，不把默认合并结果当全局当前状态 |
| `updateVariablesWith` 是读、改、写，未见事务或并发版本保护 | 本卡单一写入点，合并自己的命名空间，防止异步旧结果覆盖 |
| 保存函数有约 1 秒防抖 | Setter 返回与耐久保存分开；通过刷新和重开验收 |
| 宿主 `hideStopButton` 一处将 `chat.length` 作为生成结束参数，助手类型将其标作消息编号 | 不直接用事件参数定位回复；重读实际消息，不机械减一补丁 |
| 助手与酒馆生成事件是不同家族 | 核对实际生成路径和结束时机，重复事件只结算一次 |
| `injectPrompts` 接入扩展提示，支持撤销 | 能力存在只是源码证据；当前状态是否真正进入所选生成路径须 P1 验证 |
| 创建消息与触发生成不是同一动作；隐藏消息标志关联上下文 | 分清输入、生成、显示和模型上下文，不用隐藏消息代替 UI 性能治理 |

可定位的前序源码线索：源码映射中的 `src/function/variables.ts`、`src/function/chat_message.ts`、`src/function/event.ts`、`src/function/inject.ts`、`src/util/tavern.ts`；宿主脚本当时约 L3453～L3458。升级后重定位，不硬编码行号或依赖私有实现永远不变。

### 3.3 旧路线 P0 退出记录（技术协议部分已被最新纠正取代）

本轮变更只有现有三份 docs 文档，以及新增 [P0 合同检查](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/scripts/check-p0.mjs)。无新增蓝图、目录索引、框架、依赖或产品模块；原子结算、分支去重等运行逻辑尚未制作。

| P0 退出项 | 结果与证据 |
| --- | --- |
| 字段、初始值、范围、读写者 | 通过：DESIGN 第 6 节保留 11 个数值基线，追加机器路径；6.2 明确 8 个非数值字段及共同生命周期 |
| 正文/清单确定分离 | 通过：7.5 固定唯一尾部标记及 v1 JSON，3 份人工格式样例；重复、截断、尾随文本与损坏样例被拦截 |
| 空清单与缺失不同 | 通过：空数组保持原状态；缺块检查报错；不把缺失当无变化 |
| 边界处理 | 通过：12 个文内边界样例；上下界、变化档位、0 和长期负数；整轮异常不改基线、重复颜色去重另有检查 |
| 来源分层、素材与使用门 | 通过：8.1 登记原文行号/哈希、书内观点、同人选择与译文错配；头像/背景尚未选定，P2/P5 使用门明确 |
| 依赖版本 | 通过：8.2 记录 ST 1.17.0 aa50edcf4、助手 4.11.0、Node v24.16.0 与来源指纹；源码事实与真机未验项分开 |

自动检查（2026-09-22）：

- 在项目根目录运行 `node scripts/check-p0.mjs`：`P0 PASS: 43 contract checks; no host, persistence, or model acceptance implied.`。脚本直接读取 DESIGN 内的表格与样例，不引入测试框架、不访问网络、不写宿主。
- `node --check scripts/check-p0.mjs`：退出码 0。
- `git diff --check`：退出码 0；只有 Windows 行尾转换提示，无空白错误。这是只读检查，没有暂存、提交、分支或其他 Git 写操作。
- 三份文档的本地文件链接、UTF-8 替换字符检查通过；蓝图仍为 P0～P5 六阶段、T01～T17 十七个验收场景、持久蓝图预算 0。
- `AGENTS.md` SHA256 仍为 `9BCDF80618F6DF98670AFE27B7CA6908ABED4CCF2687CFE2C6FCCB98C10D8DB6`，未改规则文件。
- 项目暂无产品构建、类型检查或 lint 配置；本轮只执行实际存在的 Node 语法与合同检查，不称为产品构建通过。

独立只读核对：P0 合同满足退出条件；核对时发现 NEXT 仍夹带前序“只创建文档”的当前时态，本次已将其标为历史并更新当前进度。属于正常退出检查单，未开启问题支线或新增权威文件。

宿主复查只使用本机公开静态资源与 `/version` GET；没有读取真实聊天、角色配置、扩展设置或密钥。助手版本已变化，旧 4.8.7 记录只作历史。4.11.0 变量 API 没有 swipe_id 选项，按当前选中分支读写；P1 须用同步写入和写前身份核对，不把回读检查当作防串分支的替代。

### 3.4 验收状态

| 证据类别 | 当前状态 |
| --- | --- |
| 自动化测试 | **本轮未执行。** NVL 检查源码已同步单列/左右栏/自然图高断言；其他检查、typecheck/lint 同样未运行 |
| 本次构建/打包 | B-R1 开发 `0b79b82a19c9` 与 Gremlin `d784cc468961` 均 Vite/装配退出 0；两包各 10 项、包内文件与源工件字节一致，固定入口和同步输入均回读为开发版；不是宿主通过 |
| 源码阅读 / 浏览器 | 已读共享组件及两个调用者；独立只读审阅未发现确定缺陷；`git diff --check` 通过；**未运行浏览器或前端动态验证** |
| 真实宿主 | 本轮未访问宿主、推送、安装扩展、导图、改设置或调用模型 |
| 用户 | 成品 A 已接受；成品 B 基础验证通过来自用户直接反馈；B-R1 新布局等待手验，不补造 B1～B10 逐项通过记录 |

## 4. 下一目标与既有交付

### N4 · 成品 B-R1 单列左右布局（2026-09-27，新布局待手验）

- **范围与实现：**仅共享人物栏与普通头像 CSS。人物顺序不变，宽窄区均单列；每项左图右状态。左列 `min(32%, 7.5rem)`、右列可收缩换行，图片自然高度、`.25rem` 内边距，保留原比例，不裁素材；取消固定 14rem 高框和宽区双列。头像始终在 details 外，塞/狸保持精简。全屏背景的 sticky/cover 样式及人物栏内部滚动保留。
- **源码：**`src/CharacterStatus.vue`、`src/CardImage.vue`；`scripts/check-nvl.ts` 同步断言但未执行；DESIGN/BLUEPRINT 与 `scripts/build-card.ts` 的成品说明同步。原图、Schema、映射、图片加载、StateCard/NvlView 调用及全部宿主链路保持原样。
- **构建适配：**沿用项目根目录 `npm.cmd run build`（Vite Schema → UI → build-card）；输入既有源码和 delivery.config，写入 dist、内容哈希版本目录、artifacts 成品与固定入口，同名不同内容仍中止，旧工件保留。Gremlin 使用本次进程 `DLNM_IMAGE_SOURCE=gremlin`，之后默认开发构建恢复活动入口。无新构建层或依赖。
- **构建证据：**沙箱首次 Vite `spawn EPERM`，获准后重跑原命令成功；两来源均 Vite 8.3.0 与装配退出 0。ZIP 回读各 10 项且原工件字节一致，RESTORE 为 UTF-8；开发 live/sync 两个当前入口与开发工件一致。源码独立审阅未发现确定缺陷；自动测试/typecheck/lint/browser/宿主实测未执行。

| 来源 | ZIP / JSON | ZIP 字节 | ZIP SHA256 | 固定资源 |
| --- | --- | ---: | --- | --- |
| 开发占位 | [ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-0b79b82a19c9.zip) / [JSON](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-0b79b82a19c9.json) | 129,386 | `61172c839dc446e4592998b4cb21c10015b121541a037bd2d7e3f8fb2061e87f` | `dist/p2-e9db877f9519` |
| Gremlin | [ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-d784cc468961.zip) / [JSON](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-d784cc468961.json) | 125,784 | `9fbb8366a2eac946800afb639eda372d7f9db07085ab86f86b04b39ad0f5ef13` | `dist/p2-6dbd593cf2b3` |

- JSON 均 15,082 字节，开发 SHA256 `0b79b82a19c91e5390fa318a6b27e8da1a4ed9a41835db763e3825e2bee0dede`，Gremlin SHA256 `d784cc4689616f1de4979cc68897c866b3077f12f383dedc7d972baf0ba71e15`。卡内容版本保持 `p2-nvl-nb`，由上述哈希区分布局修订；变量与世界书语义保持。
- **更新方式：**已使用成品 B 的 24 字段聊天保持资源服务运行，刷新酒馆或重新渲染消息即可；这次纯展示修订无需同步或另开聊天。当前 `dist/live/state.html` 为开发版；仅换卡 JSON 不切图片来源。
- **下一道门：**[B-R1 手验说明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-0b79b82a19c9.md) 的 B2：宽区、320px 窄容器、全屏进出、详情展开、长字段、缺图说明与四人滚动；重点确认留白、比例、文字换行和横向溢出。用户接受新布局前留在 B 修订，不推进 N5。

### N4 · 原成品 B 交付记录（2026-09-27，保留历史）

以下是首次交付时的证据；用户之后已反馈基础验证通过，活动入口、布局与下一道门以以上 B-R1 记录为准。

- **确认依据：**用户完成两轮 grill-me 后明确“确认，开始实现”。本轮是原 N4 追加修订，不扩 N5；旧聊天退出兼容范围，仅省去迁移，没有删除、重置或修改宿主聊天。
- **变量合同：**`noa → noah`、`lilixia → lilicia`；`noah` 保留 11 字段并补 clothing=女仆服、expression=神态平静；`lilicia` 保留原五字段和初值；`seraphina` 仅 clothing=修女服，戴头纱 / expression=神态平静；`tanuki` 仅 expression=神态平静。`world` 保持三字段，合计 24 叶。Schema、颜色追加路径、YAML 初值、世界书规则、JSONPatch 示例与 UI 同步，既有数值上限/成长约定和 MVU 更新/保存生命周期保持。新增表情字段不强迫塞拉菲娜与狸猫每轮进入正文。
- **映射：**`src/images.ts` 是匹配和开发图片允许清单的单一来源。先衣服再该角色支持的有序表情；单字 includes，smile 固定“喜、欢、乐、笑”，已移除“微”。诺雅/莉莉希雅“睡、内”→`_underwear`，塞拉菲娜“纱、巾”→`_sisterveil`；狸猫省去衣服。目标图→同衣 default→无后缀 default→文字缺图状态，回退原因可见，不跨角色。
- **布局：**四角常显，宽容器 2×2（诺雅/莉莉希雅、塞拉菲娜/狸猫），窄容器单列。统一头像框/边距，object-fit:contain 保留全图；头像都在 details 外。诺雅与莉莉希雅保留两条数值条和详情折叠；塞拉菲娜与狸猫无数值条、无 details，少量字段直显。全屏侧栏相应扩宽，轻/全屏仍共用人物组件。
- **背景：**沿用已确认的起居室、宅邸外观、走廊三处日夜映射；傍晚暂用夜图并标注，城市/未映射地点显示缺图，不借用上一地点画面。轻前端仍无背景。图片只从已保存的当前/历史快照派生。
- **来源与生命周期：**新增 `CardImage.vue` 与 `image-loader.ts`；显式 `development/gremlin` 构建模式，正式不回退开发图。可选扩展有界等待；每次读取保留取消信号并复核聊天身份，切图/卸载取消迟到结果。图包更新后“重新读取状态与图片”重列清单和取 URL；无虚构图片变更事件、不持久化 Blob、不回收扩展共享 URL。
- **扩展来源证据：**只读核对 [Illustration-Gremlin API v1.4.0 固定提交](https://github.com/pokerface-1224/Illustration-Gremlin/blob/222150201c9cd3ab48435fc9b9221ed699d79e24/API.md)。使用宿主 `IllustrationGremlin.listImages(current)` 与返回条目的 `getImageUrl(character, relativePath)`，URL 归扩展缓存。扩展按清洗后的卡名隔离而非头像 ID，同名卡目录碰撞属于实际使用注意项。没有探测用户安装状态、配置扩展或导入图包。
- **资源边界：**Vite 保持 publicDir:false 和 dist-only 服务；仅复制 49 张人物图＋6 张背景图为内容哈希地址，共 33,698,248 字节，55 项 SHA256 构建产物回读一致。其余背景不复制，原图保持。两个交付 ZIP 都包含卡 JSON/说明、五项固定运行资源（含命名清单）、各自对应的 live/state.html、SYNC.md 与 RESTORE.txt；开发图片留本地 dist/n4-images，不混进正式图包或公开发布。
- **构建与源码证据：**首次默认构建在沙箱内 spawn EPERM；同命令获准在沙箱外成功。最终开发版与 Gremlin 版均完成两次 Vite 编译及卡装配，退出 0。两版 Schema 都为 88,437 字节；开发 state.js 为 200,658 字节、正式为 196,868 字节；正式清单 55 个逻辑名、0 个开发路径，正式 bundle 中开发 n4-images URL 为 0。卡 JSON 回读版本 `p2-nvl-nb`、6 世界书条目/3 正则/2 脚本；绑定仍为 NA 世界书，避免变更既有同步目标。独立只读审阅未留有证据的阻塞项；最终 git diff --check 无错误，不视为动态测试。
- **检查源码：**新增 `scripts/check-images.ts`，更新已有 Schema/bridge/card/NVL 检查以对应新字段、布局、匹配优先级、缺图/路径/取消边界；全部未运行。未执行测试、typecheck、lint、浏览器、宿主 POST、模型调用、安装、部署或发布。真实 CSS、解码、完整异步竞态、宿主/手机可达、持久化及用户验收仍开放。
- **保留范围：**改前 Git 基线 `59b6c36`（feat: content sync）；原有未跟踪 `tools/` 保持原样。未改 AGENTS、依赖/锁、原 public、历史工件、历史 P0/P1 探针或 MVU register；没有新备份目录、Git 提交或新蓝图。首次草稿包保留，但交付以表中最终哈希为准。

| 来源/格式 | 文件 | 字节 | SHA256 |
| --- | --- | ---: | --- |
| 开发占位 JSON | [dlnm-mvu-p2-dev-40f920a8197a.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-40f920a8197a.json) | 15,082 | `40f920a8197a16999b7b6dcb9cbab9f86a5b1d3c4a2e06d2b43d95122e602b59` |
| 开发占位 ZIP | [dlnm-mvu-p2-dev-40f920a8197a.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-40f920a8197a.zip) | 128,939 | `04ce8ed221bc404bcbb88c69e24ad23eb7ff45a3e8e811a9102a2246cc664026` |
| Gremlin JSON | [dlnm-mvu-p2-dev-7b53e4281153.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-7b53e4281153.json) | 15,082 | `7b53e42811530c6ddedc81dd40b0b006cfcbdbfb5cda4cadc6d683c124320b70` |
| Gremlin ZIP | [dlnm-mvu-p2-dev-7b53e4281153.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-7b53e4281153.zip) | 125,338 | `b5b8c1da90329f539c2ff70438c0359d8e8f348b4ca12b567ccc4a8f31b225b7` |

- 开发版说明与 B1～B10：[手验说明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-40f920a8197a.md)；固定资源 `E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-86cdd5b71dca`。
- Gremlin 版说明：[图包说明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-7b53e4281153.md)；固定资源 `E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-51e5ca8e99ab`。已生成不代表宿主可用。
- **当前活动入口：**最后一次构建恢复默认开发模式，`dist/live/state.html` 指向开发版，`artifacts/dlnm-sync.json` 等同开发卡 JSON。旧 JSON 也用同一 live 地址，单独换 JSON 不会切换图片来源；正式模式请按说明修改 imageSource 或在构建/推送时保持 `DLNM_IMAGE_SOURCE=gremlin`。
- **下一道门：**由用户选择同步后新建聊天，按交付说明 B1～B10 手验。先验证四角/初值/匹配，再验正式图包与历史切换；原 A/W 回归单独记录。成品 B 尚未 driver-accepted，不进入 N5，不把“开始实现”登记成 N3/N4 验收。

### N4 前置 · 命令行同步与固定前端入口（2026-09-27，历史实施记录）

- 使用说明：[SYNC.md](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/docs/SYNC.md)。使用现有 Vite 和 Node 标准库；没有引入依赖、复制模板工具链或部署接收服务。
- 参照实际模板 `E:\PersonalAI\archived\tavern_helper_template\tavern_sync.mjs` 的推送思路。本项目 [tavern_sync.mjs](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/tavern_sync.mjs) 直接调用原生 HTTP 接口，保留 personality/scenario/system_prompt 等完整卡字段更新能力，省去模板简化 Character 格式与头像上传流程。
- 精确来源：当前公开 `/version` 为 SillyTavern 1.17.0/release/`aa50edcf4`；已读取该提交的 `characters.js`、`worldinfo.js`、`util.js`、`server-main.js`。世界书整文件覆盖，角色字段合并中数组完整替换，头像继续取同一 PNG 图像，聊天文件不在目标中。字段映射取自当前宿主 `world-info.js:convertCharacterBook`。HTTP 成功仅是服务端回执，实际呈现和持久化仍留手验。
- 配置：[delivery.config.mjs](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/delivery.config.mjs) 增加本机酒馆地址和准确角色文件名。直接按该文件更新，不按显示名枚举猜测。前端服务配置、Schema、MVU 注册和状态生命周期均保持。
- `npm run sync:push` = 当前 Vite 构建/装配 + 本地 `tavern_sync.mjs push`。顺序是 CSRF 会话 → 整本覆盖 NA 世界书 → 更新角色；没有回读、自动重试或文件备份。第二步写入后第三步失败会报告部分完成，修正后重新执行。
- `npm run build` 现在额外发布 `dist/live/state.html` 和 `artifacts/dlnm-sync.json`。先生成固定版本资源，再原子替换固定 HTML；HTML 同时携带本版 CSS 与固定版本 JS。异步加载保留 Helper 消息 iframe 和全屏用的 `dlnm-nvl-style`；不建立嵌套 iframe、第二套状态源或全页跳转。
- 本次卡 JSON：[dlnm-mvu-p2-dev-1826bf9bb084.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-1826bf9bb084.json)，14,293 字节；SHA256 `1826bf9bb0841143d71a29b61bba8118cb09bc51ca777a4d965fe157a6dae866`。说明文件同名 `.md`，固定版本资源为 `dist/p2-446f5ae15d86/`，动态入口为 `dist/live/state.html`。
- 检查点 ZIP：[dlnm-mvu-p2-dev-1826bf9bb084.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-1826bf9bb084.zip)，包含卡 JSON、说明、SYNC 使用说明、固定资源目录和 live 目录。恢复资源时将两个资源目录放回 dist，不覆盖其他版本。这是交付包，不是额外源码备份。
- 本地 Git：本轮开工前工作树干净，原有提交 `886753b` 即改前源码备份；额外标签写入请求被拒绝，未换方式写入。当前源码变更未提交。Git 不保存外部酒馆聊天/设置；现有 `artifacts`/`dist` 忽略规则保持。
- 边界：未执行自动测试/typecheck/lint、浏览器、酒馆 POST 或模型调用；未改 AGENTS、依赖锁、原图、Schema、bridge、register 和宿主设置。N3 尚待手验，N4/N5 未启动。
- 下一步：使用正确的现有角色文件名首次推送并刷新；确认卡与整本世界书更新、固定地址前端可加载。此后纯界面更新只构建并刷新，不重复导入，也不必推卡。

### 4.0 前端优化与世界书完善：任务拆分（2026-09-24）

**目标：**真实回复自动、连续地出现在 NVL 中；支持 Markdown 和正文染色；非全屏提供轻量人物状态栏；接入可替换图片与地点映射；世界书从技术骨架补成有事实依据的世界观和人物资料。

**执行边界：**成品 A 已验收，N3/N4 已按本轮明确许可合并实现并构建成品 B 候选，尚待手验。N4 将旧 19 字段升级为 24 字段，其他 MVU 生命周期、消息/分支存储、原生生成和 YAML 初值单一来源保持。继续使用 Vite 开发地址；原图、旧成品和无关文件保持。不将构建/打包扩大为测试、宿主、安装或发布许可。

**与原阶段的关系：**UI 工作接续 P2；本次世界书完善是用户明确前移的原 P4 内容子项，不以 P3 尚未完整验收为由搁置，但也不标记 P3/P4 整体完成。DESIGN/BLUEPRINT 中“纯文本、面板模式、尚无项目图片”等旧合同由 N0 定向同步；同步前以本节最新用户纠正为准，不另建一套蓝图。

#### 计划形成时核对的起点（实施前源码事实，非成品 A 现状）

- [消息接入](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/nvl.ts) 目前订阅接收/编辑/结束事件，但没有原生流式 token 订阅；监听又绑在阅读模式 acquire/release 上。下一步要同时修复流式呈现与非流式自动收尾，别只加一个事件后保留生命周期断口。
- [阅读组件](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/NvlView.vue) 用文本插值显示回复，头像/场景仍为 CSS/SVG 占位。现有 `visibleBody` 只删完整变量块，流式半截块也要处理。
- [显示格式接口声明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/@types/function/displayed_message.d.ts) 表明 `formatAsDisplayedMessage` 会再次应用宏和角色正则；本卡 [显示正则](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/card.ts) 会在回复尾部插入前端。因此该接口不是可直接套上的 Markdown 渲染器，实施前需绕开前端插入规则并核对运行版本。
- [Vite 配置](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/vite.config.mjs) 是 `publicDir: false`，开发根为 dist；项目中存在 public 图片不等于当前 Vite 地址已经能加载它们。
- [public](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/public) 现有 69 张 PNG：背景 20 张（10 组日/夜）；人物目录 lilicia 20、noah 20、seraphina 4、tanuki 5。目录名只是素材线索，不自行推定角色身份、剧情事实或正式素材资格；目前未见城市场景图。
- [卡片内容](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/card-content.ts) 仍是 5 条世界书：初值、简短关系、状态投影、字段规则、更新格式。欠缺人物详细资料、世界设定与检索组织。
- 原作对照文件 [ManualTransFile.json](E:/ReinoAre/RJ01521464/ManualTransFile.json) 本轮确认存在，674,888 字节；事实提取仍需按 [DESIGN 第 8 节](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/docs/DESIGN.md) 的原文线索逐项复核，不把旧行号或文件名当设定正文。

#### 执行顺序与交付门

`N0 → N1 → N2 → 成品 A／用户手验 → N3 → 命令行同步与动态前端 → N4 → 成品 B／用户手验 → N5 → 成品 C／用户手验`

- A：消息实时显示、Markdown 与染色闭环。
- B：全屏＋轻前端、图片映射及 Illustration-Gremlin 接入。
- C：世界观/人物世界书与前端一致的完整修订卡。
- 每次手验未通过，停在对应小阶段修正；先打包再交用户，不在打包前擅自运行测试。N5 的原作只读整理可提前进行，但正式内容落盘仍按清单和来源边界处理。

#### N0 · 锁定本轮合同与素材命名（文档同步完成）

- **做什么：**定向同步 DESIGN/BLUEPRINT；把“全屏 NVL＋轻前端”“自动回复”“Markdown/染色”“开发占位与正式图包”写清，保留变量已解决的结论。整理最小地点/时间段/人物图片对照表和世界书条目提纲，避免 UI 与提示各用一套名称。
- **素材约定：**对照现有文件，确认 `living`、`hall_outside`、`rouka` 等实际画面后再确定中文地点；为日/夜图片明确 `world.period` 映射，清晨/傍晚等未有专图的时段保留明确选择，不假装已有专用素材。`world.location` 保留现有文本字段，用规范名及有限别名映射，不强行扩成新 Schema 枚举。
- **图包命名：**同一卡片中两位主角都属于同一图包作用域；public 下各目录的 `default.png`、`smile.png` 等会重名。图包使用 `noah__default.png`、`lilicia__default.png`、`bg__living_day.png` 等唯一逻辑名；只改图包副本/映射，原始 public 文件保持原名。
- **完成标准：**六项需求都有对应任务；记录缺图、未确定角色名/场景名，不造资料补齐；技术合同没有新增状态写入者、依赖库或部署路线。

#### N1 · 流式显示与回复自动同步（已实现，随成品 A 获用户阶段验收；对应需求 1）

- **主要范围：**[src/nvl.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/nvl.ts)、[src/NvlView.vue](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/NvlView.vue)、必要的入口生命周期。
- **先定位：**沿当前原生发送按钮追踪真实酒馆的流式/非流式事件与消息保存顺序；确认 token 载荷是完整文本还是增量、消息何时分配楼层。不要把只服务 Helper 自有生成接口的事件套到当前原生发送链，也不要把结束事件参数直接当可靠楼层号。
- **实施：**建立只负责显示的临时流式正文，按当前聊天、当前生成和回复分支隔离；随到随显示，并将高频刷新合并到浏览器帧，避免每个 token 重扫全部历史。生成完成自动回读真实回复；非流式完成也立即刷新；MVU 状态另等保存完成后自动更新，不要求点“重新读取”。
- **边界：**临时文本不写聊天或 MVU；生成期间人物状态保留上一份有效值并标明同步中。未闭合的 UpdateVariable/Analyze/JSONPatch 与前端占位片段不泄露到正文；停止、异常、切聊天、换分支时丢弃过期显示任务。阅读旧消息或主动上滚时不抢回最新，不覆盖草稿；最新阅读区才按用户滚动位置决定跟随。
- **保留回归要点：**流式边生成边出现；非流式无需手动重读；末段/末字不丢、不重复；停止/失败保留已收正文和草稿；新楼 iframe 替换后保持阅读与全屏接管；历史回看不被新流挤走，状态最终与真实所选楼层一致。阶段已由用户接受，逐项执行结果未另行提供。

#### N2 · Markdown、v-html 与模型染色约定（已实现，随成品 A 获用户阶段验收；对应需求 2、6）

- **主要范围：**阅读组件、消息显示转换，以及卡内容中的“正文呈现约定”。实时与历史正文共用一条转换路径。
- **显示管线：**剥离技术块 → 使用已核对的宿主 Markdown 能力 → HTML 清理 → `v-html`。先核对宿主现成解析器和清理器，复用可用实现；不手写 Markdown 解析器，也不未经确认增装依赖。避免再次套用本卡插入前端的显示正则；不嵌套新的 iframe/loader，不双重转义，不把渲染 HTML 写回原始回复。
- **保留能力：**段落、换行、加粗/斜体、列表、引用、代码块、常规链接，以及 `<span style="color: red">文字</span>`。在 ShadowRoot 内补齐这些元素的排版，处理长代码/链接和窄屏；流式遇到半截 Markdown/标签不破坏页面，完成后重渲染为最终格式。
- **HTML 边界：**`v-html` 只接收已清理的结果；span 仅保留经过颜色值校验的 `color`，不开放任意 style、事件属性、脚本、iframe、表单或可执行链接。代码块里的标签保留为字面文本；普通颜色文本不被二次清理抹掉。
- **模型指示：**明确允许在正文少量使用 Markdown 和闭合的染色 span，给出红色/其他合法颜色的正例；不要把整段正文包成 HTML 文档。染色只影响呈现，不修改 `noa.colors`、不自动触发奖励，不在 JSONPatch 技术块里插入 HTML，原有“唯一完整更新块”合同不变。
- **保留回归要点：**同一条实时/历史回复格式一致；染色可见且黑底可读；闭合/未闭合标签、引用和代码块呈现正确；含脚本/事件属性的文本不执行；技术块及前端入口不混入正文。阶段已由用户接受，逐项执行结果未另行提供。
- **成品 A：**构建并形成新版本卡 JSON、JS/CSS/HTML、说明和 ZIP；说明列出流式、非流式、历史、停止、Markdown、染色手验步骤与未测项。用户接受后继续 N3。

#### 成品 A 初次实施与交付记录（2026-09-24 18:06，后续启动手验失败，见 A-R1）

- **改前备份：**[n-a-backup-20260924-174233](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/n-a-backup-20260924-174233/) 保存当时的 src、docs、scripts；R2 和其他历史产物保持。
- **N0：**DESIGN 第 5 节与 BLUEPRINT P2 合同定向同步；实际查看 living/hall_outside/rouka 图，分别登记宅邸起居室、宅邸外观、宅邸走廊及有限别名。清晨/上午/午后用 day，夜间/深夜用 night，傍晚明确暂回退 night；城市图、配角目录身份与正式资源资格仍未确认。世界书内容提纲留在现有 DESIGN，第 N5 阶段再提取来源和制作。
- **N1：**原生累计 token 只更新内存显示页，用宿主 requestAnimationFrame 合并；继续回复只拼一次旧前缀。按当前聊天、生成对象、消息对象和 swipe 复核，切聊天/分支及退役取消旧任务。数据显示监听与全屏/面板显示清理分开；最新入口在未打开阅读时也保持监听。生成结束不等同状态保存，人物栏保留上一份有效状态，目标 `CHARACTER_MESSAGE_RENDERED` 之后重读精确消息变量；初始化和已有 MVU 写链未修改。
- **N1 接管/滚动：**Helper 同一楼层重绘会复用 DOM ID，故以每个实例独立对象作为显示接管令牌，旧实例先同步保存/退役，新实例再读会话记录；等待 MVU 前后核对 iframe 的 contentWindow。跟随最新的布尔值与阅读位置分别保留，换 iframe 后只有跟随模式滚到底，历史/上滚恢复原位。停止请求检查原生 boolean 返回值，不单凭 STOPPED 事件声称成功。
- **N2：**[message-display.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/message-display.ts) 统一处理实时/历史正文：剥技术块与本卡 loader，使用宿主 Showdown，独立 DOMPurify 实例白名单清理，再交 `v-html`。技术块即使错误包在围栏/行内代码中也被隐藏；普通 HTML 示例代码保持字面。只保留基本 Markdown 元素、http/https/mailto 链接、经过校验的 span color；过暗颜色作仅显示的提亮，单色缓存避免相同流式颜色反复测量。不执行角色显示正则，不新增依赖，不改宿主全局清理 hooks。
- **卡内容：**增加第 6 条“正文呈现约定”，明确染色不改 `noa.colors` 或奖励、不进入 JSONPatch。卡版本 `p2-nvl-na`；世界书独立命名 `DLNM-P1-香气链路-世界书-NA`，保留 R2。卡名、已有条目/正则/脚本 ID、19 字段初值和固定 MVU/Schema 路径不变；已有聊天不自动迁移。
- **草稿语义：**未发送或未确认草稿保持；只有收到相同文本的真实 `MESSAGE_SENT` 后，才清空那份已提交草稿。之后的新草稿不动，停止/失败不自动重发；已发送行动仍以真实聊天为准。

**本轮只读来源证据（不是运行验收）：**

- 本机 SillyTavern `aa50edcf4561301ec5ef916b247f0ec34d3ac4b9`，1.17.0：`public/script.js:3461-3818` 的累计 token/continue/最终渲染时序；`:5518-5530` 的停止返回值；`:6543-6684` 非流式写入后渲染。公开 `SillyTavern.libs` 提供 `showdown` 与 `DOMPurify`（`public/lib.js:83-120`）；`messageFormatting` 会执行角色正则，因此本卡未调用它。[上游固定源码](https://github.com/SillyTavern/SillyTavern/blob/aa50edcf4561301ec5ef916b247f0ec34d3ac4b9/public/script.js#L3461-L3818)。
- Helper 4.11.0 `fe6388985ffb8a3d9ac08d09b9dfb28423a5fc2b`：`src/function/variables.ts:56-125` 的显式消息读取只取指定楼层/当前 swipe，不继承前楼；iframe 默认合并视图与此不同。[固定源码](https://github.com/N0VI028/JS-Slash-Runner/blob/fe6388985ffb8a3d9ac08d09b9dfb28423a5fc2b/src/function/variables.ts#L56-L125)。
- 固定 MVU `183d8ade` 的 `update_variables.ts:1614-1725` 先发计算结束事件，再更新消息变量，最后 `refresh:'affected'` 触发目标渲染。代码只在真实数据回读后更新显示；可回读不证明磁盘防抖保存已经耐久完成。[固定源码](https://github.com/MagicalAstrogy/MagVarUpdate/blob/183d8ade3b9a3369e824a55cb13b4ddf91aada50/src/function/update_variables.ts#L1614-L1725)。
- 独立只读源码核对提出并已修正：同楼 iframe ID 重用导致双监听、技术代码围栏泄漏、跟随标志未跨实例传入导致末段停在上方、停止返回 false 的提示，以及普通链接默认导航走酒馆/消息 iframe。合法链接在净化阶段固定为新标签与 `noopener noreferrer`。最终只读回读未报告剩余高价值源码问题；源码审查通过不标为动态场景通过。

**最终交付：**

| 文件 | 大小 | SHA256 |
| --- | --- | --- |
| [导入卡 JSON](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-4b9dfe1807c9.json) | 32,581 字节 | `4b9dfe1807c93f8e43be0f7c0c1fb10677ed173367e89afe426a09a1821fcb76` |
| [导入与 A1～A8 手验说明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-4b9dfe1807c9.md) | 7,813 字节 | `5505fe22021f3c676e09d28cdddf42e034b72f27c6b9da0a31907cc028e20237f` |
| [成品 A ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-4b9dfe1807c9.zip) | 115,714 字节 | `9ebc868ef96776634b2a7234099f27e4d79b6812789589c2f32c2d34f3252aec` |

- 固定资源目录：[dist/p2-033c3a4c92a3](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-033c3a4c92a3/)：schema.js 88,322、state.js 185,666、state.css 14,946、state.html 15,521 字节。ZIP 目录回读含 JSON、说明及这四项资源；JSON 回读确认 6 世界书条目、3 正则、2 脚本及 NA 书名。
- 构建命令 `npm.cmd run build`：首次沙箱内 `spawn EPERM` 退出 1；经工具执行许可后同命令成功，源码修正后最终再次构建退出 0。只有 Vite 两次编译和现有 pack 装配，没有串联测试。中间构建的 `5cebec834d9a`、`9833bc47b3cc`、`af2acf9476d1` 包只作本轮过程产物，不是当前交付。
- 归档前确认新路径不存在，未使用覆盖选项。未启动 Vite、未导入宿主、未安装扩展、未调用模型、未做 Git 写操作或部署。自动测试、typecheck、lint、浏览器与真实手机均未执行；检查源码仅补充未运行。
- **当时下一道门：**用户手验 A1～A8；随后在启动入口失败，转下方 A-R1 修订。当前旧面板与几何占位是分阶段保留，非 N3/N4 已实现；P3/P4/P5 整体验收继续开放。

#### A-R1 · 修复“正在加载”停住（2026-09-24 18:21；后续用户反馈流式通过，见 A-R2）

- **用户证据：**最新截图显示开场白下已出现加载占位；用户确认世界书、助手脚本、角色正则已导入。随后 Console 给出 `Invalid regular expression ... Unmatched ')'`，与 `src/message-display.ts:20` 的 `RAW_CARD_LOADER` 及旧固定 state.js 完全对应。
- **原因与修正：**从上一条含前瞻的正则复制代码时，多保留了一个裸 `)`。这是前端 JS 自身的语法错误，不是酒馆角色正则导入错误；浏览器解析整个脚本失败，尚未执行 Vue 挂载。只删掉该多余字符，保留上一行前瞻的闭括号；未调整 document.write、Helper、入口时序、世界书内容、MVU 链或宿主设置。
- **范围与备份：**本次修改 `src/message-display.ts`、`scripts/check-message-display.ts`、`scripts/build-card.ts` 的交付说明与本 NEXT；备份为 [n-a-startup-fix-backup-20260924-181842](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/n-a-startup-fix-backup-20260924-181842/)。检查源码新增未包围栏的完整/截断 loader 两例，未运行。
- **源码与构建证据：**独立只读核对确认多余括号进入旧 bundle；本机静态资源 GET 为 200，仅证明可取回文件。修正后 `npm.cmd run build` 沙箱内因 `spawn EPERM` 退出 1，经工具许可重试退出 0；仅执行现有 Vite 两次编译与 pack，未串联测试。新 state.js 回读显示修正后的正则，大小 185,665 字节，比旧版少 1 字节；构建通过仍不标记浏览器通过。
- **路由/工具边界：**沿用 NEXT 的完整阶段卡包交付；TW `sillytavern-card-pipeline` 路由快照 2026-08-18，A0/A2/D1/D4。既有 package.json、Vite 与 build-card 源码确认输出只到 dist/artifacts，固定版本碰撞时停止；ZIP 先确认新路径不存在，再创建并回读目录，不覆盖旧包。未执行测试、typecheck、lint、浏览器、真实酒馆或模型调用；没有新依赖、Git 写操作、安装或部署。

| 当前修订交付 | 大小 | SHA256 |
| --- | --- | --- |
| [A-R1 导入卡 JSON](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-d6205cce596d.json) | 32,581 字节 | `d6205cce596d8ad95bed7005aee179f29aae64380adde25fc8834507801587a1` |
| [A-R1 说明](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-d6205cce596d.md) | 8,662 字节 | `1ffceb5260a5ca1df3851a32b3eb140a53b1381cd03736e7b8f44d3b99451ed2` |
| [A-R1 完整 ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-d6205cce596d.zip) | 116,117 字节 | `b72b82145c12a2e01ed1b797bebca47205d8c9b6b539c2c1181a026b2e6f47ca` |

- **固定资源：**[dist/p2-02bad7aab8ac](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-02bad7aab8ac/)；schema.js 88,322、state.js 185,665、state.css 14,946、state.html 15,521 字节。ZIP 含这四项、JSON 与说明。卡版本仍 `p2-nvl-na`、世界书仍 NA；以文件名哈希识别修订。
- **下一道门：**在专用副本导入 A-R1 JSON，已有 NA 世界书直接链接，无需再次导入相同世界书或安装助手。Vite 继续使用当前项目 dist；旧卡仍指向旧固定 JS，单独刷新旧卡不会切换修订。先在新卡最新消息确认阅读入口出现，无需发消息或调用模型；启动通过后继续 A1～A8。用户接受成品 A 后再进入 N3。

#### A-R2 · 发送后立即显示本轮与等待反馈（2026-09-24 19:19 交付，现已获用户阶段验收）

- **用户反馈与确认：**用户明确“流式生成测试通过”，但发送后要等 AI 响应才进入新一轮，延迟高时像卡住。方案已说明并获“按此方案修改”：点击后立即显示本轮；真实消息确认后计时；首字在同页继续；停止/失败保留；临时显示不写真实聊天或 MVU。此标签是成品 A 的第二次修订，不指旧 P2-R2 `05676741617c`。
- **已实施：**[src/nvl.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/nvl.ts) 保持真实助手页与既有 token 合帧路径，另派生一张只用于显示的 `-2` 待回复页。点击先保存显示状态，再触发同一原生发送按钮；`MESSAGE_SENT` 后绑定真实 userId/实际文本，文本一致才清相同草稿。等待前置状态、确认起点与停止状态跟随既有会话记录交接；不建立第二套聊天存档或生成队列。
- **同页交接：**等待页与用户消息后的第一条助手回复共用 `turn:userId:swipe` 阅读位置键；同用户后续助手页用真实消息 ID，避免串位置。首个可见正文到来才转为真实回复；原生 `...` 空占位不算正文。等候时回看历史保持当前位置，返回最新仍可见待回复或正文；旧 A-R1 阅读位置采用已有键作回读兼容。
- **失败与重生成：**等待计时从实际接收确认开始，不猜测进度百分比。15 秒仍未确认仅提示核对并保留草稿；生成结束后延迟回读，停止事件可升级停止提示；没有自动重发。重生成保留原轮与标明的旧正文、预设新 swipe 0 的位置键，续写沿原页；同条真实用户消息被后续扩展规范化时同步显示实际文本而非丢掉等待页。
- **界面与边界：**[src/NvlView.vue](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/NvlView.vue) 增加发送/等待秒数/停止/未确认/尚无正文提示、明确的历史与待回复项；秒表只在显示等待页时运行，离开或卸载即清理。负编号在人物读取、初始化诊断和 MVU 等待前被隔离；人物数据继续使用已保存快照。世界书、变量 19 字段、Schema/bridge/register、依赖、外观布局与图片路线均未修改，N3/N4/N5 保持待实施。
- **改前备份：**[n-a-waiting-backup-20260924-185930](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/n-a-waiting-backup-20260924-185930/)。本次落盘范围仅上述两个产品文件、[scripts/check-nvl.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/scripts/check-nvl.ts)、[scripts/build-card.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/scripts/build-card.ts) 的交付说明与本 NEXT。检查源码补充发送/确认/原生空占位、会话 JSON 回读、终态、首字位置键、重生成位置键与无宿主写操作护栏；全部未运行。

**证据与未验项：**

- 本机公开 `SillyTavern/public/script.js:4215-4238,4315-4371,5785-5830` 确认 `GENERATION_AFTER_COMMANDS` 早于真实用户消息与 `MESSAGE_SENT`，且确认文本已过用户正则/宏；`:3489,3542-3556,3780-3783,6643-6685` 确认流式 `...` 创建和最终消息事件分离；`:3453-3458,3715-3722,5518-5530` 确认 ENDED 可早于最终渲染及 STOPPED。只读源码证据不等于宿主动态通过。
- 独立只读核对已完成，发现并修正同一用户消息后置改写丢等待态、非零 swipe 重生成改键、历史数量语义三处边界；最后回读未发现新的功能缺陷。只执行源码阅读，没有由代理执行动态场景。
- TW 路由快照 2026-08-18：embedded-ui（A0/C1/C2/D7）与 card-pipeline（既有 A2/D1 工件合同），无新增设计候选或依赖。项目 package.json/Vite/build-card 源码确认构建只编译两次并装配 dist/artifacts；固定版本文件存在且内容不同即停止。
- `npm.cmd run build` 沙箱内首次 `spawn EPERM` 退出 1；工具许可后成功。源码核对修正后最终再次构建退出 0。`5c87e7119bf9` 为过程包，不是当前交付。没有执行自动测试、typecheck、lint、浏览器、真实酒馆或模型调用，也没有安装、Git 写操作、部署或发布。用户此前流式通过仅属于前一包，不把本修订自动标为通过。

| 当前交付 | 大小 | SHA256 |
| --- | --- | --- |
| [A-R2 导入卡 JSON](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-c0c12066f521.json) | 32,929 字节 | `c0c12066f5215adeb744b68464e23c7cbd0f74bc0e33c0f00fc48080e9d27d0e` |
| [A-R2 说明与 W1～W5 手验](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-c0c12066f521.md) | 11,300 字节 | `8717a4ac80fa31e5b6571ae20dd3564b9f16f12423a9bc5257b61931cbc075c4` |
| [A-R2 完整 ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-c0c12066f521.zip) | 119,331 字节 | `fe624698f02fad08db40c3d3301f7fd4b8f0ea6ec14441e6e51261c1162bfecc` |

- 固定目录：[dist/p2-a66103ffbf30](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-a66103ffbf30/)：schema.js 88,322、state.js 191,727、state.css 15,208、state.html 15,783 字节。归档前确认新路径不存在；ZIP 目录回读含四项资源及 JSON/说明。卡 JSON 回读仍为 `p2-nvl-na`、NA 世界书、6 条目/3 正则/2 脚本；以文件名哈希识别修订。Schema bundle SHA256 仍为 `c327c1c860035c68cd190525e8f0bcd466d43036190fd658b9b8e30f0b8b1fbf`。
- **用户验收记录（2026-09-24）：**本包交付后，用户直接确认“此阶段已验收，更新NEXT.md”。据此记录成品 A（含 A-R2）阶段已接受，关闭发送等待问题并释放 N3 前置门；这是用户验收记录，不是代理自动判定。A1～A8、W1～W5 保留为后续回归清单，不补造逐项测试、真实手机、保存恢复或异常覆盖证据。
- **当时的续接记录（2026-09-24）：**从 N3 开始，随后 N4 图片映射，再打包成品 B 交用户手验。该次只更新 NEXT；2026-09-27 的 N3 实施与当前停止点见下节，旧卡/旧包与固定资源保持。

#### N3 · 删除旧面板，非全屏改为轻前端（2026-09-27 已构建交付；待用户手验；对应需求 3）

- **主要范围：**入口组件、人物栏复用、全屏生命周期与模式存储。使用最小共享人物栏，避免两套字段展示逐渐不一致。
- **本轮布局决定：**CSS Grid 自适应列宽；两条数值条在详情外常显，头像/人物属性/状态来源放在原生 `<details>`，默认折叠，不实现自造折叠状态机。保留焦点样式、文字数值和原生 meter 语义。
- **轻前端：**仅显示扩宽的“人物与状态”栏，可附全屏入口和必要状态提示；不放场景图、NVL 正文、历史导航或第二个发送框。原生聊天正文和原生输入继续可见、可用，不再托管或隐藏整个 chat；宽度跟随可用消息区域，手机重新排布人物信息。
- **全屏：**保留浏览器 Fullscreen API，继续承载场景、正文、输入和历史；返回/Escape 回到轻前端。全屏/轻前端都自动更新人物状态，监听生命周期不再依赖“已进入全屏”才存在。
- **删除与兼容：**删除旧 panel 入口和隐藏 chat/form 的 CSS 路径；已有会话中的 `mode: panel` 仅迁为轻前端，保留草稿/阅读位置，其他旧会话字段按已有语义兼容，不清空聊天记录。
- **待手验：**不进入全屏也能看到宽人物栏；轻前端没有场景图且原生聊天可用；双端无横向挤出；反复全屏/退出无残留样式、重复监听或重复人物栏；用户原生发送后状态自动更新。

**本轮实施与证据：**

- 新增共享 [CharacterStatus.vue](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/CharacterStatus.vue)，原人物字段/颜色呈现从 NvlView 移入一处；`StateCard.vue` 与全屏 `NvlView.vue` 复用。体力、魔力使用原生 meter 并配文字数值；两位人物详情与状态来源共三个原生 details，默认折叠，保留键盘焦点。Grid 使用容器可用宽度自动排布，不加尺寸监听或依赖。
- `nvl.ts` 删除旧 panel 入口、隐藏 chat/form/其他楼层的 CSS、尺寸观察器；旧 `mode: panel` 只迁入 light。保留草稿、阅读选择、滚动位置、等待页、FullScreen 交接和数据监听；轻界面显示最新有效状态，全屏显示所选历史状态，退出时重读当前状态而不覆盖历史选择。旧 iframe 收到接管通知或不再是最新楼时停止呈现人物栏。
- 折叠状态由原生 DOM 管理，同实例的数据刷新保持；轻前端/全屏切换和 iframe 重建后默认折叠。未把展开状态写入 MVU；缺状态显示诊断，不伪造条数值。现有 MVU、世界书内容、19 字段、初始化、正文清理和素材原件保持原样。
- 可运行检查源码补到 [check-nvl.ts](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/scripts/check-nvl.ts)：轻/全屏状态目标、等待负编号、旧模式兼容、退役隐藏、删除宿主隐藏样式、两条 meter 在 details 外和共享组件。**未执行检查**；只读审查也不计为动态验证。
- 2026-09-27 执行 `npm.cmd run build`，沙箱初次 `spawn EPERM`；同一命令经沙箱外执行许可后退出 0，两次 Vite 编译及卡包生成完成。使用现有工具、输入为维护源码/配置，输出仅为 dist 顶层构建文件、新固定目录与 artifacts；不串联测试。说明中的 HTML 标签转义修订后执行 `npm.cmd run pack` 退出 0，卡与资源身份保持，首次草稿说明保留在备份目录。

| 交付 | 大小 | SHA256 |
| --- | --- | --- |
| [N3 导入卡](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-e287d9ad2d85.json) | 33,501 字节 | `e287d9ad2d85faaf100cd083fe6595cf30267a04721b7933415b8c7451d24a9a` |
| [N3 说明与 L1～L6 手验](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-e287d9ad2d85.md) | 12,597 字节 | `0b4dad592ec5bf662743c3b83ddf18e273c507b6bc966647c5a102cdc42cefea` |
| [N3 完整 ZIP](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-e287d9ad2d85.zip) | 119,826 字节 | `1b1a0159a154535e23dc4af573165addad657e28d2daafa77e87f6163cc059fc` |

- 固定资源目录：[dist/p2-973fa3d5dd48](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-973fa3d5dd48/)；schema.js 88,322、state.js 190,167、state.css 15,637、state.html 16,212 字节。JSON 回读：版本 `p2-nvl-na`、NA 世界书、6 条目/3 正则/2 脚本；Schema SHA256 仍为 `c327c1c860035c68cd190525e8f0bcd466d43036190fd658b9b8e30f0b8b1fbf`。ZIP 无覆盖创建，目录回读包含这四份固定资源与 JSON/说明。
- 写前备份：[n3-backup-20260927-165731](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/n3-backup-20260927-165731/)，包含涉及的既有源码、检查/打包脚本、三份文档和顶层构建输出；保留本轮开始时 NEXT 已有的未提交验收修改。AGENTS、依赖/锁文件、MVU 源码、原 public 和全部历史版本保持。
- **N3 当时停止点：**交用户手验 L1～L6 与相关 A/W 回归。自动测试、typecheck、lint、浏览器、真实酒馆、模型调用均未执行；Helper 自动高度、实际窄屏/手机、原生 details/meter 外观、Escape 与 iframe 接管仍待现场证据。N3 尚未写为用户接受，不自动进入 N4；N4 完成后再形成完整成品 B。 用户随后明确允许 N4；当前改以本轮成品 B 手验门为准。

#### N4 · 替换图像占位，接入地点映射与图包（成品 B 基础通过，B-R1 布局待手验）

- **主要范围：**素材映射、人物栏/全屏场景、[delivery.config.mjs](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/delivery.config.mjs)、Vite/打包器的最小资源处理及说明。
- **开发占位：**按已确认映射使用 public 中的图片替换当前几何占位。针对目前 Vite 只服务 dist 的结构，只把映射实际使用的图片送到限定开发资源目录，或增加明确受限的静态资源映射；不要把整个项目根暴露出来。界面和说明继续标注“开发占位图”，本地图片可见不代表正式图包接入完成。
- **映射：**以已保存的 `world.location + world.period` 选背景；四角色字段、单字词表、服装优先与回退规则以本轮 N4 记录及 DESIGN 为准，替代原“保持 19 字段、诺雅固定头像”的旧限制。历史页使用历史快照；异步迟到结果不覆盖已切走的画面，未映射地点显示缺图。
- **正式运行：**说明要求用户自行安装 [Illustration-Gremlin](https://github.com/pokerface-1224/Illustration-Gremlin) 并给当前角色卡导入图包；项目不代装扩展、不改宿主存储。开发 public 来源与正式图包来源明确区分，正式模式缺扩展/缺图时提示安装或补图，不悄悄依赖作者电脑的 public 地址。
- **接口路线：**在当前角色范围内等待/探测 `IllustrationGremlin`，列图后依据返回的角色与相对路径精确取图，不依赖跨角色占位符查找。用 N0 的唯一图名建立映射，不依赖重名自动编号；图片读取失败不阻断正文和人物数值。Blob URL 只作本次浏览器显示引用，不存进 MVU 或聊天；先核对扩展缓存/URL 所有权，再处理图包更新、刷新、切卡和卸载，避免全屏/轻前端一方释放仍被另一方使用的 URL。
- **图包边界：**交付命名清单与映射/导入说明；若制作图包则使用单独副本，原图不重命名、不就地覆盖。public 临时图片不默认进入正式卡包、远程仓库或公开发布；资源资格与用户自行准备图包的边界保持明确。
- **待手验：**日夜/地点映射、头像默认与已有表情映射、历史场景跟随、缺图提示；当前角色图包隔离；导入/更新/删除图片后重新取图；刷新不复用失效 blob URL；全屏/轻前端切换无串图。实际手机图片来源可达性另验，当前 127.0.0.1 不冒充手机可访问地址。
- **成品 B：**新版本卡与资源 ZIP、轻前端说明、开发占位声明、唯一文件名清单、扩展安装及图包导入说明；正式图包接入与 public 占位分别列出验收状态。用户接受后继续 N5。

#### N5 · 世界观、人物索引与具体世界书（待实施；依赖 N0、N2/N4 词汇合同；对应需求 5）

- **来源先行：**从现有原作对照与 DESIGN 的已确认决定提取本次需要的事实；先形成“来源片段 → 事实/观点 → 目标条目”的短对照，再写条目。区分原作事实、书内理论、译文疑点和本项目同人补充；留任结局、互相依偎、共用香气邀请、玩家是诺雅等已定选择保持。不是把整份翻译 JSON 塞进世界书，也不是另建大型资料库。
- **最小内容目录：**①续篇时代/起点和世界观总览；②人物索引及译名/别名；③诺雅与莉莉希雅分别的身份、外貌、性格、说话习惯、能力边界、关系与日常行为；④原作有依据且本段会出现的配角，先核实再收录；⑤宅邸及已用房间、月光都市瑟雷妮亚；⑥香气文化、魔力/色彩封印等必要设定，保留原文的不确定语气；⑦地点/人物检索索引与自然触发词。
- **激活方式：**短核心背景和当前关系保底进入上下文，细节按人物/地点/主题关键词或现有可靠条件激活。索引不是“罗列所有关键词然后递归点亮整本书”：分别配置递归、深度、优先级和预算，确保提到一个人能得到其详细资料，但不会把所有场景一并加载。先用少量有用条目，不用大批空占位条目凑完整。
- **与技术条目分开：**保留 YAML 初值、MVU 字段规则、已校验状态投影和更新格式；增加内容条目而非覆盖它们。继续携带 N2 的染色/Markdown 正文约定，地点规范名与 N4 映射一致；有设定但暂无图片的地点仍可叙事，不因缺素材限制故事。
- **维护方式：**优先在现有卡内容来源中小范围分层；篇幅确实妨碍维护时才拆成少量内容文件。保持单一装配来源、稳定条目身份、可追溯原文，不搬整套模板工程、不增自造 CoT 或额外模型更新通道。
- **待手验：**人物说话与关系有具体依据；城市/宅邸不再只剩技术指示；接受、推迟或改变香气邀请均能继续；查询某人物/地点时实际上下文能命中对应条目；称谓、地点与图像映射一致，技术状态仍可用。实际上下文/生成观察由用户手验，代理未获许可前不发模型请求。
- **成品 C：**完整修订卡、内嵌世界书、新版资源与 ZIP；附条目索引、事实来源短表、图包使用说明和各项待验记录。交付后等待用户接受，不自动推进完整 P3/P4/P5 或远程发布。

#### 续接入口与资料回执

- **成品 A 已接受，N3 检查点已交付待手验。** 当前包 `e287d9ad2d85`；N4 图片映射与完整成品 B 留待后续。变量问题已经用户确认，不回到 R1/R2 初始化故障排查。
- 本轮改动：DESIGN/BLUEPRINT 的 N0 合同、NVL 数据与显示生命周期、正文转换、正文世界书条目及打包说明/检查源码；AGENTS、Schema/bridge/register、依赖及锁文件、原始 public、历史版本目录和宿主均保持原样。构建只更新 dist 顶层输出并新增固定版本与卡包，不覆盖旧版本文件。
- 本轮技能：`consult-tavernweave-library`、`sillytavern-embedded-ui`、`sillytavern-api-reference`、`sillytavern-card-pipeline`、Ponytail。Library 快照 `2026-08-18`，读取 A0、C1/C2/C3、A2/D1 相关片段及打包工具适配合同；未采用目录候选、未新增依赖或工具层。N5 的 A3/原作事实提取仍待其阶段实施。
- 扩展资料只作接入依据：2026-09-24 只读核对 [官方 README](https://github.com/pokerface-1224/Illustration-Gremlin/blob/222150201c9cd3ab48435fc9b9221ed699d79e24/README.md) 与 [API.md](https://github.com/pokerface-1224/Illustration-Gremlin/blob/222150201c9cd3ab48435fc9b9221ed699d79e24/API.md)，提交 `222150201c9cd3ab48435fc9b9221ed699d79e24`。图包导入展平目录、同名自动编号；前端 API 限当前角色，列图/精确路径/缓存与 URL 生命周期需按用户实际安装版本再核对。本轮没有安装该扩展，也没有图包实测。

### 以下为 R2 及此前交付历史

变量缺失在下方属于当时的问题记录，已由本节顶部的最新用户反馈关闭；旧面板/纯文本要求已被 4.0 的新目标取代，保留记录而非继续执行。

### P2 R2 修复计划（2026-09-24）

- 用户明确“全屏”指浏览器 Fullscreen API；R1 的网页覆盖层不符合要求，且手验仍报告消息 0 缺初值、全屏样式丢失。R1 未通过。
- 先修复整条样式来源：现有代码拿 iframe 的第一张样式表，可能取到 Helper 自带 Font Awesome，而非本卡 state.css；改为打包内具有唯一标记的本卡编译 CSS，面板和全屏共用同一份样式内容。
- 全屏由用户点击同步调用 `requestFullscreen()`，监听 `fullscreenchange` 处理 Escape；保留明确选择的面板模式。避免异步加载耗掉点击手势；默认展示全屏入口，不伪装自动全屏。
- 初值继续追踪实际消费与保存，不把“接口存在”“多等几秒”当修复证据，不强塞默认值。缺少现场条件时保留明确诊断和待定位项。
- 保留旧卡、历史状态、版本产物及改前备份；本轮不运行测试、typecheck、lint、浏览器或真实宿主，只构建打包后交用户手验。

#### R2 实施证据与未确定项

- 写前备份：`artifacts/p2-r2-backup-20260924-161548/`；没有修改 AGENTS、锁文件、依赖或用户宿主配置。
- Fullscreen API：[MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) 明确需要用户手势，且 dialog 本身不作全屏目标。当前点击链在第一个 await 前请求宿主 documentElement 全屏；取得全屏后打开阅读 dialog，监听 [fullscreenchange](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event)。加载时只给入口，不自动称已全屏；Escape、返回、面板切换退出本卡全屏。消息 iframe 卸载后有 2 秒接管清理，后继入口接管会取消，未接管则退出，不留下无界空阅读层。
- 样式选择错误已修：R1 用 `querySelector('link[rel="stylesheet"]')`；本机 Helper bundle 自带前置 Font Awesome link（`dist/index.js` 约 503 行）。R2 将同份编译 CSS 放到 HTML 的 `style#dlnm-nvl-style`，全屏按唯一标记复制到 ShadowRoot，删除错误的首张 link 选择及重复网络样式等待。此为源码缺口定位，真实 CSS 应用仍留手验。
- initvar 改 YAML 两级映射和列表，由 `src/mvu/schema.ts` 的单份 initialState 生成；不是手写第二套状态，不改 19 字段初值。固定 MVU `variable_init.ts:277-307` 使用 YAML 解析器且支持 JSON；旧格式本身不是已确认故障根因。卡片导入文件仍是标准角色卡 JSON，只有初始化条目正文改为 YAML。
- 初始化入口修订：加载器不再因 Mvu 全局存在就跳过本卡固定 MVU；由上游 `util/script.ts` 的唯一实例机制选择运行者。Schema 等待窗口内允许旧 Mvu 先于固定版本出现，避免并行脚本启动时过早报版本错误。新开场通过 MVU 自身 `initInitvar/initCheck` 自动读取世界书并保存，不发聊天消息，不用界面默认值冒充状态。
- 本地 `@types/iframe/exported.mvu.d.ts:57` 留着旧拼写 `mag_variable_initiailized`；固定 MVU 源码 `variable_def.ts:177`、缓存 bundle 与固定 StageDog 注册源码均使用 `mag_variable_initialized`。保留按固定实现校验的版本门，不因旧声明删除检查；未覆盖用户类型文件。Vite 的 schema 库入口确实是 `src/mvu/register.ts`，不是未被引用的孤立模块。
- R2 世界书名 `DLNM-P1-香气链路-世界书-R2`，保留旧书，避免同名旧条目/已初始化书名混淆；卡名、条目 ID、正则 ID、两项脚本 ID 保持。宿主 `world-info.js:5480` 转换条目 comment，`importEmbeddedWorldInfo` 导入后才链接，因此内嵌书存在不等于已链接。
- 实际用户消息 0 未初始化的唯一宿主原因仍未取得运行证据：修订覆盖启动跳过、旧版本先出现、旧世界书混用这些源码路径，不声称 YAML 替换已经证明故障消失。即时诊断显示未绑定/旧书/空条目/初始化标记；15 秒结束后明确“自动初始化未完成”，不永久称“正在等待”，不让用户补发消息来触发初始化。
- 回归源码补充：`scripts/check-card.ts` 的 YAML 字段与 R2 书名；`scripts/check-nvl.ts` 的 Fullscreen API / CSS 标记 / 启动入口静态守卫。均未执行，静态守卫也不代替实际 Fullscreen、初始化与手机验收。
- Library：`sillytavern-api-reference` / `sillytavern-embedded-ui` / `sillytavern-card-pipeline`；读取 A0、C1、D1 和工具适配合同，快照 `2026-08-18`；候选设计未采用。

#### R2 成品与下一道门

- 构建：`npm.cmd run build` 首次沙箱内 `spawn EPERM` 退出 1；同命令经执行许可后退出 0。只执行两次 Vite 编译与 `npm run pack`，没有串联测试。
- 导入卡：[dlnm-mvu-p2-dev-05676741617c.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-05676741617c.json)，30,019 字节；SHA256 `05676741617c21284d444469ec1670de056bd79f1cbfbc29367ad5bfac9ac59e`。回读卡版本 `p2-nvl-r2`、世界书名带 `-R2`、初值正文为 YAML。
- 说明：[dlnm-mvu-p2-dev-05676741617c.md](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-05676741617c.md)，7,743 字节；SHA256 `493f60966dc0039cb74eea88031202216c4aced4097151511ee705e0ac5c2627`。
- 成品：[dlnm-mvu-p2-dev-05676741617c.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-05676741617c.zip)，110,911 字节；SHA256 `9e6f711fccb0de2f5ee4811090298c14465e1033051f35febec39b6ef24bffc0`。2026-09-24 16:28（Asia/Hong_Kong）确认目标不存在后新建归档，未使用覆盖选项；目录回读包含 JSON、说明和四项资源。
- 固定资源：[dist/p2-13dfe733d806](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-13dfe733d806)：`schema.js` 88,322、`state.js` 177,051、`state.css` 13,916、`state.html` 14,491 字节。CSS 随 HTML 封装导致 HTML/卡包增长，这是消除错误样式来源的有意取舍；原 CSS 文件仍保留用于资源检查。
- 独立源码阅读提出的 Fullscreen 待决请求/卸载竞态已定向修订：卸载依据本卡 root 标记安排清理，旧请求迟到成功也检查代次及有无接管者，缺接管者则退出。旧 @types 拼写与固定运行实现的差异以实际固定源码裁定，不冒充运行阻断。
- 本轮未执行测试、typecheck、lint、浏览器或真实酒馆操作，未调用模型。Vite 地址仍为 `http://127.0.0.1:5173/`；未启动服务、创建远程仓库、提交或部署。
- 下一道门：用户保留旧卡和聊天，按说明导入 R2 并链接其独立世界书；新开场应自动出现状态，无需补发消息。点击浏览器全屏，检查完整样式、Escape、面板切换和新回复接管。三项问题均待手验，初始化实际根因尚有上述现场证据缺口，P3 保持未启动。

### P2 手验回报与本次修复范围（2026-09-24）

- 用户报告：[initvar] 未产生可读 MVU 状态；期望全屏 NVL，当前侵入聊天面板的布局只适合作为非全屏选项。P2 未通过，继续本阶段修复。
- 修复计划：先沿固定版本 MVU 的初始化、存储与前端读取链定位，不靠强塞默认值掩盖故障；区分“MVU 接口出现”和“消息初值已落盘”，补足开场合同与刷新/诊断。全屏以宿主顶层独立阅读层呈现，默认不重排原 chat；保留明确选择的面板模式与返回酒馆。
- 红线：保留真实消息、历史状态、未提交工作和旧成品；不改宿主全局配置、不自动初始化已有剧情、不运行测试/类型检查/lint/浏览器或模型调用。只做源码定向修订、构建和打包，再交用户手验。
- 改前备份：`artifacts/p2-fix-backup-20260924-155126/`。自动检查只补充可运行源码，不执行；全屏/软键盘/状态落盘效果均保留手验门。

#### 定位依据、改动和边界

- 已证实的源码问题：旧 `useNvl` 等待 Mvu 全局后立即读消息，未监听 `VARIABLE_INITIALIZED`；MVU 在 `initGlobals` 发布全局之后才异步执行 `initInitvar/initCheck`，接口存在不等于消息初值已保存。初始化事件本身也在 `setChatMessages` 完成前发出。旧 UI 将这些失败和 Schema 错误全部压成一条泛化提示。
- 另一个确定缺口：本卡 `beginBatch` 要求每轮有一个完整更新块，但旧 `first_mes` 没有该块；如果 Schema 钩子已注册，初始解析也会被标待同步。本轮只给新开场补明确空更新，不改用户已有消息。
- `[initvar]` 的禁用提示属性本身正确：上游 `loadInitVarData` 按条目名称读取，不过滤该属性。没有把条目打开、没有复制默认状态写入旧聊天。你当前酒馆究竟处于未落盘、绑定缺失还是数据损坏，代理没有运行取证，因此不声称已经锁定唯一宿主原因。
- 修改 `src/mvu/bridge.ts` 的共用读取入口：仅略过已知 `$internal` 元数据，继续严格校验本卡字段；缺失状态和错误字段分别提示。`src/nvl.ts` 初始化及重读后最多等 15 秒，仅读取所选消息；超时以当前角色主世界书、[initvar] 条目和初始化标记补充诊断，不改状态。
- 全屏默认走宿主 `dialog` 顶层显示层，Vue Teleport 仅搬展示节点，原消息 iframe 保持原位；普通 div 的 ShadowRoot 隔离样式。原 chat 布局保持原样，只有用户选“面板模式”才使用旧版 CSS 托管。覆盖层跟随可见视口尺寸，提供返回、Escape 和焦点回收。
- 清理修复：新实例取得显示权时也取消旧实例尚在等待 CSS 的全屏挂载；每实例检查挂载代次，延迟结果失效后退出，延后删除只针对本实例 dialog。未新增第三个运行脚本、依赖或平行聊天存储。
- 上游只读依据：前序固定提交缓存 `C:/Users/18248/AppData/Local/Temp/mvu-source-183d8ade` 的 `src/function/{global/index,initvar/index,initvar/variable_init}.ts`；当前读取 bundle SHA256 为 `43e38e31c3f86734cdd38c6047d22e871a043abbc2af9116ee2c54438462db6a`，与前序记录一致。Zod 注册读取同级 `tavern-resource-f2f87def/util/mvu_zod.ts`。远程 raw 部分路径返回 404 / cache miss，GitHub 树 API 返回限流，未用新分支替换固定版本。
- 浏览器接口依据：[MDN showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) 的顶层 modal 与退出行为；[attachShadow 支持元素](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to) 指明隔离根放在 div 而非 dialog。这些是资料依据，不是本项目运行证据。
- 补充但未执行的回归源码：`scripts/check-card.ts` 的开场空更新合同；`scripts/check-mvu-bridge.ts` 的缺失初值、未知字段和 `$internal` 读取边界。没有运行测试、typecheck、lint、浏览器或宿主。

#### R1 成品与手验门

- 构建：`npm.cmd run build` 首次因沙箱 `spawn EPERM` 退出 1；经执行许可后原命令退出 0，依次编译 Schema、界面并组装卡包，没有串联测试。2026-09-24 16:05（Asia/Hong_Kong）完成新归档。
- 导入卡：[dlnm-mvu-p2-dev-9b20281be7b2.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-9b20281be7b2.json)，11,498 字节；SHA256 `9b20281be7b2523fbe50a3700205e8d744ef48977f1dc64ced2ad51ca7e4e282`。
- 手验说明：[dlnm-mvu-p2-dev-9b20281be7b2.md](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-9b20281be7b2.md)，6,876 字节；SHA256 `2659ea3f112d84e6cbf92951303da200d4f5d2d7809bcbb27e1d5158f5e2655b`。
- 成品包：[dlnm-mvu-p2-dev-9b20281be7b2.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-9b20281be7b2.zip)，100,065 字节；SHA256 `b1446f1ffb97dc24c942f467fc8d95c96a92cf2d73709ec367c4f1de6a4f0c21`。归档前确认路径不存在，未使用覆盖选项；回读目录含上述 JSON、说明和固定版本四项资源。
- 版本资源：[dist/p2-181ecc4123b7](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-181ecc4123b7)：`schema.js` 88,170 字节、`state.js` 174,650 字节、`state.css` 13,916 字节、`state.html` 618 字节。开发资源基址仍为 `http://127.0.0.1:5173/`；旧版本资源及旧卡包保留。
- 独立源码阅读：未发现新增阻断项；已核对异步挂载失效、ShadowRoot 宿主和焦点回收。跨文档 Teleport、真实 MVU 初始化与手机软键盘均未运行；构建和归档清单不代替这些证据。测试源码仅补充，测试、typecheck、lint、浏览器、宿主操作和模型调用均未执行。
- 下一道门：按说明先用修订卡独立新开场检查初值（零模型调用），再确认全屏/面板/返回与草稿；保留旧卡与旧聊天。P2 等用户手验，P3 继续停留未启动。

### 旧 P2 首包目标、范围和保留项（保留交付历史）

- 承接已获用户接受的 P1，制作桌面与手机共用的整轮阅读、独立人物栏、输入与历史导航；先标注占位素材，后续再替换。先构建打包，再手动验收。
- 新增 `src/NvlView.vue` 负责纯文本展示，`src/nvl.ts` 负责酒馆连接和界面会话记录；已有 `StateCard.vue` 作为入口。前端只读 MVU，复用 `readStateAt`，不新增游戏变量协议或聊天数据库。
- 保留 19 字段、MVU 回滚、5 个世界书条目、2 个脚本与全部既有组件 ID。仅第三条显示正则变为最新深度的 NVL 入口，后续回复无需模型额外输出占位符；提示清理正则不受该深度限制。
- 定向修改打包器与 Vite 的 CSS 产物设置，JS / CSS 同一版本目录；保持回环 Vite 地址，未建立远程仓库、开放局域网或部署。
- 原生消息只做可恢复的 CSS 显示隐藏，不改消息隐藏标记，不删除聊天。退出阅读/换聊天/销毁时移除本实例样式与监听；旧实例交出草稿写入权。发送只走酒馆现有按钮，确认真实玩家消息文本一致后清空相同草稿，超时或失败不自动重发。
- 草稿和滚动位置仅为当前浏览器会话 UI 记录。历史正文为纯文本，Markdown 标记暂按原文显示；分支切换、编辑和重生成仍走原生界面。长聊天一次线性读取；CSS 隐藏不是性能验证，复杂恢复和状态规则仍属 P3。
- 写前备份：[p2-backup-20260924-143357](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/p2-backup-20260924-143357)。保留原入口、装配/内容、构建器、Vite、三份文档与两份编译资源；历史 P1 固定版本目录和 JSON / ZIP 原样保留。

### 只读接入依据与未验范围

- 本机公开源码：SillyTavern 1.17.0，酒馆助手 4.11.0；读取文件与源码映射，没有请求真实聊天或设置。`public/scripts/st-context.js` 的 context 提供聊天、聊天 ID、在线状态与原生停止；原生 `generate('normal')` 和 Helper `generate(config)` 是不同接口，本界面没有混用。
- `public/script.js` 约 11046～11049 的发送按钮有原生 mutex；4316～4319 读取/清空输入框，4365～4371 创建玩家消息。界面复用按钮而非另外创建用户消息再调用生成；已有不同原生草稿时停止，不覆盖。
- 同文件约 6976～6990 中 `deactivateSendButtons` 写 `body.dataset.generating = 'true'`，`activateSendButtons` 删除它；这是已核对的当前实现细节，搭配生成事件使用，升级后仍需复查。生成结束载荷不作消息 ID 使用，重新读取真实消息。
- Helper `getIframeName()` 返回消息 iframe ID；`getChatMessages` 默认返回所选分支文本；状态用显式楼层读取，未复制 P1 的自动结算逻辑。MVU 结束后延后一次事件循环再读，真实事件时序未验。
- 本轮先前用户参考图只读查看，未复制为素材；占位图由 CSS / SVG 几何形状组成，不代表正式外观。Library 路由为 `sillytavern-embedded-ui`，读取 A0、C1/C2/C3/C12、D7 相关边界，快照 2026-08-18；API 以本机源码为准。
- 未执行：任何测试、typecheck、lint、浏览器预览、真实酒馆运行、模型调用、手机实机验证。当前回环地址只供本机使用，手机需后续明确可达资源地址；不把窄屏布局代码当成双端验收。

### P2 成品与下一道门

- 构建命令：`npm.cmd run build`，只运行两次 Vite 编译与打包器。首次沙箱执行遇 `spawn EPERM` 退出 1；经执行许可后同命令退出 0。Schema 87,776 字节，界面 JS 165,832 字节，CSS 13,876 字节，HTML 618 字节；构建成功不是类型检查、测试或宿主运行成功。
- 固定版本资源：[dist/p2-ce9d5306e254](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p2-ce9d5306e254)。版本指纹由资源根地址与 Schema / 界面 JS / CSS 共同生成；保留旧 P1 目录。
- 导入卡：[dlnm-mvu-p2-dev-044ac933e16b.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-044ac933e16b.json)，11,242 字节；SHA256 `044ac933e16b4cd750948768a398f6efa1c684adcfc4f9b34606616f5805566d`。
- 手动使用说明：[dlnm-mvu-p2-dev-044ac933e16b.md](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-044ac933e16b.md)，5,484 字节；SHA256 `35e725c4772f91a7007ece8c20196c042ec24afde4a0bb3b7f876a3ef16405d5`。
- 成品 ZIP：[dlnm-mvu-p2-dev-044ac933e16b.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p2-dev-044ac933e16b.zip)，95,619 字节；SHA256 `0e2517ce260b27f3f4226c690da973ac4f2f8b40c483f55cce332eb254de96a7`。2026-09-24 15:20（Asia/Hong_Kong）使用 PowerShell `Compress-Archive -LiteralPath` 生成，无覆盖选项；归档目录列出 JSON、说明与固定版本目录中的四项资源，共六个文件。这只证明封装内容，不是自动测试。
- 只读交叉阅读后已修正：未连接时托管/输入的禁用门、MVU 初始化失败清理、旧实例存储权、窄桌面头部断点、短视口滚动与人物栏限高。未增加依赖、状态管理库、图片下载或新的持久蓝图。
- 当前 Vite 服务未由代理启动，用户在项目根目录运行 `npm run dev` 后按说明手验。测试、类型检查、lint、浏览器/酒馆操作与模型调用均未执行。

当前停止点：P2 成品已交付，等待用户手动验收；重点是阅读布局、原生界面返回、正文/状态对应、草稿和历史导航。手机实机、软键盘及长期聊天性能尚无运行证据，当前回环资源地址也未开放给手机。P2 获明确接受前不进入 P3。

## 4.1 已验收的前序交付：局部架构整理、构建与打包

以下保留 P1 当时的实现与打包证据；其“待验”已由用户后续“已验收，可继续”更新为人工接受，旧测试和宿主许可没有因此自动延续。

### 2026-09-24 本轮工作合同

- 只做已批准的定向合并，不建立新权威蓝图：`src/card-content.ts` 承接世界书、创作文本和卡元数据；`src/card.ts` 保留组装、正则和脚本绑定。
- 保留 `src/mvu/*`、`StateCard.vue`、`state-entry.ts`、`@types`、`AGENTS.md`、锁文件和现有测试脚本；保留 19 字段、创作设定、MVU 回滚与组件 ID，不恢复原生变量路线。
- `delivery.config.mjs` 集中维护 `devOrigin=http://127.0.0.1:5173`、`assetBaseUrl=http://127.0.0.1:5173/` 和允许的本机酒馆 origins。获得远程仓库后再替换资源地址。
- `npm run dev` 只用 Vite 托管已构建的 `dist` 产物，没有源码热更新；修改源码后重新构建并导入新卡包，旧卡仍引用其原版本。`npm run build` 为两次 Vite 构建后打包；`npm run pack` 只固化已有构建产物并组装角色卡，不串联测试。
- `scripts/build-card.ts` 生成不可覆盖的 `dist/p1-<内容hash>/schema.js`、`state.js`、`state.html`；卡 JSON 在现有酒馆助手消息 iframe 内载入固定版本的 Vite 资源 URL，保持 MVU 上游固定提交，不新增跨源 iframe。
- 参考 `E:\PersonalAI\archived\tavern_helper_template` 时只取源码/产物分层和稳定资源地址载入思路；跳过 webpack、自动同步、CI、Pinia 双向状态写入和整套模板依赖，不覆盖冲突文件。

### 本轮实际交付（2026-09-24）

- 构建：项目根目录执行 `npm.cmd run build`，依次为 `vite build --mode schema`、`vite build`、`npm run pack`。首次沙箱执行因 Vite 子进程 `spawn EPERM` 退出 1；经执行许可后原命令退出 0。两份编译资源分别为 87,776 与 147,965 字节。这是构建事实，不是测试或运行通过。
- 版本资源：[dist/p1-38431e137790](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/dist/p1-38431e137790)，版本标识 `38431e137790` 来自资源基址与两份编译脚本的 SHA256 前 12 位；含 `schema.js`、`state.js`、`state.html`，已有不同版本保留。
- 开发卡：[dlnm-mvu-p1-dev-01627503ff8f.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p1-dev-01627503ff8f.json)，10,884 字节；SHA256 `01627503ff8f4aba91fac6137e83bb2d82c3d328303d36e88a3548411989db33`。
- 使用说明：[dlnm-mvu-p1-dev-01627503ff8f.md](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p1-dev-01627503ff8f.md)，3,364 字节；SHA256 `496f18c11ad31e1d2a6be765209ae312035187c941ef4394ff349c62a3c97c58`。
- 归档包：[dlnm-mvu-p1-dev-01627503ff8f.zip](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p1-dev-01627503ff8f.zip)，82,862 字节；SHA256 `46e5a8647e630273576943df10f67a4fff59e4aeedc0790030a0666cada54679`。2026-09-24 14:19（Asia/Hong_Kong）使用 PowerShell `Compress-Archive -LiteralPath` 归档上述 JSON、说明与固定版本资源目录，未使用覆盖选项。
- 本轮维护文件：新增 `delivery.config.mjs`、`src/card-content.ts`；定向修改 `package.json`、`vite.config.mjs`、`src/card.ts`、`scripts/build-card.ts` 与现有三份 docs。没有迁移模板构建器或增加依赖；`src/mvu/*`、界面组件、规则、类型声明、锁文件和测试脚本保持原文件。
- 改前备份：[architecture-backup-20260924-141149](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/architecture-backup-20260924-141149)，保留四份获准修改的源码/配置、三份文档及原三份 dist 文件。回退时只针对这些文件和本轮新增文件，保留其他未提交改动；历史成品原样留存。
- 独立源码阅读：未发现阻断问题；卡名、世界书绑定、5 条目、3 个正则 ID、2 个脚本 ID 保持一致。此项只读对照不计为自动测试或宿主验证。
- 明确未执行：自动测试、类型检查、lint、浏览器预览、真实酒馆导入/运行、模型调用。Vite 开发服务尚未启动；手动验收时在项目根目录执行 `npm run dev`。未创建远程仓库、提交、推送、部署或发布。

### 下一道门

当时已形成 JSON、说明和 ZIP 后交用户手动检查；用户随后明确接受，现已从此门进入 P2。该反馈不补造逐项宿主观测记录。

<details>
<summary>历史记录：2026-09-23 MVU Zod 回补与组件实施</summary>

### 2026-09-23 本轮回补记录

- 用户已明确允许仅在本项目安装并锁定 `zod`、Vue 3、TypeScript、Vite、`@vitejs/plugin-vue`、`vue-tsc`；不含全局安装或酒馆改动。
- 依赖读取临时支线 `P0-npm-metadata` 已关闭并返回 P0：首次默认镜像查询返回 `ENOTCACHED / only-if-cached`，改用命令级官方 registry、项目内缓存并取得网络执行许可后成功；没有改用户 npm 全局设置。
- 实装版本：Zod 4.6.5、Vue 3.5.43、TypeScript 5.9.3、Vite 8.3.0、plugin-vue 6.0.9、vue-tsc 3.3.11；`npm install` 退出 0，新增 46 个直接及传递包，版本记录在 package-lock.json。尚未以此代替类型检查与构建。
- 已确认上游 MVU Zod 存在与本卡合同相关的差异：逐命令校验会保留同轮合法项，而本卡要求失败整轮保留起点。已补最小前后钩子回滚检查，保留 MVU 原解析器；本地夹具覆盖混合成功/失败、缺块、非法结构、数值字符串和日次倒退，真实钩子执行仍待验。
- 当前本机酒馆入口未响应；本地组件制作继续，实际绑定、上下文拼装与运行验收仍保留真实宿主门。
- P0 退出检查点：DESIGN 7.5 已记固定提交、JSONPatch 方言/空更新/越界样例、初始化、Schema 与世界书/正则职责；19 字段严格 Schema 25 组本地回归通过。字段/素材基线保留。上游逐项提交问题分支已确认最小回滚接入点并关闭，回到 P1；no-op/完整异常路线留 P3，宿主加载仍待验。此检查点之后才制作 P1 卡组件和构建入口。

本轮本地交付：

- [字段 Schema](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/mvu/schema.ts)：19 字段，初值集中一份，严格拒绝未知/缺失/非法值；颜色先校验再去重。
- [MVU 接入](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/mvu/register.ts) 与 [边界检查/读取](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/mvu/bridge.ts)：真实注册组件调用、整轮临时回滚、只读状态宏、明确楼层/分支读取。`dlnm_sync` 仅是待同步标记，不是另一份游戏状态。
- [卡组件](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/card.ts)：5 个世界书条目（初始化禁用、4 个提示条目常驻）、3 条仅显示/仅提示的角色正则、2 个本卡脚本；Vue 只读入口见 [StateCard.vue](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/src/StateCard.vue)。HTML 用 UTF-8 Base64 无损包装避免酒馆替换 `$1` 等脚本内容；只在消息 iframe 初次解析时还原，没有远程前端资源或宿主 DOM 替换。
- 本地检查点：[dlnm-mvu-p1-dc121800542a.json](E:/PersonalAI/archived/SmallProjects/demon_lily_and_the_noir_maid/artifacts/dlnm-mvu-p1-dc121800542a.json)，SHA256 `dc121800542ac8cc57468fa6a87f19df4ea64b308cf7d647b651a4913d397405`。不是发布包，两个旧工件保留。
- 可重复命令：`npm test`（25+9+14 组）、`npm run typecheck`、`npm run build`。本机 Vite 沙箱内曾 `spawn EPERM`，相同本地构建经执行许可后退出 0；该临时构建支线已关闭。产物 schema 87.57 kB、state 147.95 kB；未额外安装 lint 工具，不声称有独立 lint 结果。
- 实际打包 HTML 在 `127.0.0.1:8139` 的短时本地预览可见“请在酒馆消息前端中查看，MVU 尚未就绪”和读取按钮，证明 Vue 编译代码与 Base64 还原实际执行。该预览无 MVU、无远程加载，验证完已关页并停止进程。
- 只读交叉核对发现并修复：颜色 append 指针、宏 JSON 花括号、HTML 中 `$` 的脚本破坏、日次倒退；四个输出样例现在逐个通过同一边界检查。AGENTS 哈希不变，用户 `@types/` 未修改；无新持久蓝图。

当前下一步（P1 尚未满足退出条件）：

1. 等真实酒馆入口可访问后，仅操作已授权专用测试卡与新独立空聊天；先停用该对象的退役脚本，再导入/链接世界书、允许本角色正则，核对两项脚本。旧聊天不自动初始化或迁移。
2. 用户已允许仅专用测试卡加载固定提交的 MVU 与 Schema 组件；加载地址见构建脚本和 register.ts。主提交固定不等于传递 CDN 依赖全固定，注册组件内部 `zod/v4/core/+esm` 无版本；远程加载、跨 Zod 实例、实际事件顺序仍须实测，不调整全局 Blob 设置。
3. 核对 19 初值、人工更新、同楼/分支读取及世界书实际拼装（含已校验状态宏）；只验证本卡上下文，不另发模型请求证明酒馆能生成。
4. 已知边界留在原 P3 检查单：上游合法 no-op 残余命令可能被保守判待同步；完整成长档位/颜色生命周期、发送暂停/主动修复、历史编辑/分支/中止/保存恢复尚未实现或验收。当前仅是 P1 接入组件，别把正则/Schema 静态检查当成完整状态系统。
5. P1 真机退出条件满足并更新 NEXT 后才进入 P2 最终前端；未推进布局、完整剧情、素材、部署或发布。

新 P1 的退出条件见现有 BLUEPRINT。本轮本地源码已实现，实际组件绑定、MVU 运行和最终前端仍未验；没有新增持久权威蓝图。

</details>

前序纠正核对（2026-09-23，早于本轮组件实施）：

- 仅更新现有三份权威文档；维护源码加退役标记，历史检查改为 `BASELINE / LEGACY`，移除旧打包器的文件写出分支。直接运行旧打包命令退出码 1，两份旧工件的哈希前后保持一致；`--check` 仍只做历史内存组装检查。
- 43 项旧合同/字段检查、23 组旧原生状态检查、源码语法和 `git diff --check` 通过；这些结果明确不计入 MVU Zod 或最终前端验收。
- 原酒馆测试页已不在当前浏览器会话，本次未重开或修改宿主；已导入旧卡及其原设置仍保留，未声称已在宿主禁用旧脚本。新版组件重新接入该专用卡前先停用旧探针，避免两套写入者并存。
- 全局渲染选项保持原值；没有安装、删除聊天、密钥操作、Git 写操作或新增模型调用。
- 独立只读核对确认三项纠正及退役标记一致；发现的两处旧 P0/P1 当前时态已修正。UTF-8、本地文档链接、六阶段/十七场景及零新增蓝图核对通过；AGENTS 哈希保持原值。

<details>
<summary>历史记录：旧 P1 原生变量探针与浏览器诊断，已停止</summary>

以下内容保留当时证据，旧实施步骤、打包入口及等待门均已被本节上方的新路线取代。

### 旧 P1 入口与停止点（历史）

P0 退出后先更新本文件，再进入以下入口检查；本轮没有越过入口直接制作完整视觉或 P3 状态系统。

1. **测试对象门：已确认。** 用户已允许专用测试卡 `DLNM-P1-香气链路` 及独立聊天，仅操作该对象；保留现有卡与聊天。导入、消息变量写入、刷新和重开已在问题中明确，正常测试消息由 P1 模型测试范围覆盖。
2. **模型调用门：已确认指定连接。** 用户指定已连接 `NIM APIs OpenSource` 的 `z-ai/glm-5.3-flash`，表示理论可无限调用，不可用则放弃。执行仍取最小必要次数；不更换模型、不改认证、不新增付费调用路径。实际调用次数与结果另记本节，不预填成功。
3. 两项范围满足相应操作需要后，按 BLUEPRINT 的 P1 合同制作最小消息桥接、一个状态样本与朴素检查界面；优先助手读写消息、宿主原生生成，不改用户全局配置。
4. P1 的候选正常链路为：显式创建一条 user 消息 → 注入本卡有效状态 → 宿主正常生成 → 重读真实选中回复 → 完整且非中止后整轮结算 → 回读并刷新/重开验证。每一步先检查测试对象、上下文和能力；创建消息与生成失败分开处理，重试不重复创建输入。
5. 真机必须分别留证：真实输入和回复、下一次生成实际收到状态、选中分支一致、重复通知无重复结算、刷新重开后恢复。静态源码和人工 JSON 夹具均不代替这些结果。
6. P1 未通过前不进入 P2；P2 的布局选择、P4 内容反馈和 P5 最终验收仍由用户确认，不自动填为通过。

入口合同保持 BLUEPRINT 原 P1：输入为本轮 P0 与获准测试对象；输出为真实输入/回复、最小状态和恢复证据；仅改最小桥接/卡片状态代码与本地测试；失败留在 P1。素材尚未选定不是绕行到 P2 的理由。

### P1 当前实施边界与工具适配

- 本阶段仅测试 `noa.stamina`，使用 `scope:p1-probe` 标记；不是 P3 完整状态，也不是最终故事卡。原生聊天界面暂保留，新增朴素检查面板，不提前实现 NVL 视觉。
- 维护源码：`src/p1-state.mjs`（纯解析/计算/幂等）、`src/p1-host.js`（限定测试对象的宿主读写与面板）。本卡自己的脚本没有远程 import；助手 4.11.0 的脚本 iframe 壳含其既有远程 log.js，属已安装宿主行为，不伪称整个宿主离线。
- 只读检查：项目根目录执行 `node scripts/check-p1.mjs`、`node --check src/p1-host.js`、`node scripts/build-p1.mjs --check`；最后一个只在内存组装与语法核对，不写输出。
- 本地检查点打包：`node scripts/build-p1.mjs`，输入上述两个维护文件，输出仅为 `artifacts/dlnm-p1-<内容哈希前12位>.json`。文件不存在才写入；已有同名文件必须内容一致，保留每个旧工件。回读验证 JSON 与脚本内容，不自动导入、安装、发布或调用模型。
- 实际导入与聊天保存通过酒馆自己的入口执行，由宿主管理并写入其角色/聊天数据；本项目不直接修改宿主文件，只操作获准的专用对象。卡脚本的自身 enabled 与酒馆助手的“当前角色脚本”开关分别核验，只开启本专用卡的必要执行范围。
- 模型前置核对已观察到选中配置 `NIM APIs OpenSource`、模型 `z-ai/glm-5.3-flash`。新浏览器最初显示“无连接”，点击现有“连接”后显示“有效的”；未读取或填写密钥，尚未据此宣称真实生成成功。

续接时先读取本文件和用户随后给出的测试授权，再从 P1 接续。若授权仍缺失，维持本入口；不重复 P0、不创建第二套蓝图、不自动消耗模型额度。

### P1 本次实测记录（进行中）

- 已通过酒馆界面导入 `artifacts/dlnm-p1-308a1bcbe20f.json`，跳过标签导入，只选中新专用测试卡和其独立开场聊天；启用该卡的角色脚本。尚未初始化状态、尚未调用模型。
- 临时问题 `P1-script-mount`：`persistent:false`，`returnTo:P1`，状态 `blocked-confirmed/closed`，已回父步骤等待兼容性门。触发证据：当前卡角色脚本开关为开，DOM 出现 `TH-script--DLNM-P1-香气链路--dlnm-p1-scent-v1` blob iframe，但等待后父页面仍无 `#dlnm-p1-panel`，error 日志为空；原地编辑与刷新重开复现。没有扩为新蓝图。
- 最小诊断：挂载异常补上本卡专属错误日志；测试卡身份确认后即可显示读取失败，而不是吞掉开场读取异常。修订源码再打包，仅更新本测试卡脚本。
- 检查点修订：`artifacts/dlnm-p1-a12a8d388665.json`，20,240 字节，SHA256 `a12a8d38866565af86b45f6b7ad91ad47f7094b538c9a159ca8f51e3f799d71f`；旧工件保留。通过助手“编辑脚本”原地更新同 ID 的内容，未用会生成新 UUID 的脚本导入入口。此为调试更新，不冒充新工件整卡重导入验收。
- 根因隔离：临时回环 HTTP 诊断页（`127.0.0.1:8139`，零外部脚本）同时运行普通 inline、隐藏 Blob module、隐藏 srcdoc module；Codex 内置浏览器实际显示 **inline PASS / blob pending / srcdoc PASS**，后续再次读取结果相同。同一脚本内容只改变 iframe 载入方式，故故障已定位为该浏览器的 Blob 框架执行层；其更底层原因未查证。已连接浏览器只有此内置浏览器。
- 源码交叉核对：助手 `src/panel/Render.vue` 的“启用 Blob URL 渲染”（控件 `TH-render-use-blob-url`）对应 `GlobalSettings.render.use_blob_url`；`Script.vue` 将它用于所有全局/预设/角色脚本，消息前端也共用。单脚本 schema 没有同名选项。因此原测试对象许可不足以覆盖此全局设置修改，已单独询问是否临时关闭并在测试后恢复；当前尚未切换。
- 2026-09-23 再运行 `check-p0`（43）、`check-p1`（23）、`node --check src/p1-host.js`、`build-p1 --check` 与 `git diff --check` 均成功。无新增依赖，无安装、Git 写操作、密钥操作或模型调用。
- 当前停止门：用户答复前保留全局设置原值，不初始化消息状态、不写消息变量、不调用模型；获准后先记录原值，再临时关闭该选项，仅继续本测试卡的 P1。测试成功或失败均恢复并复核原值；指定模型不可用时按用户要求结束调用尝试，不换模型。
- 隔离诊断页已关闭，临时 HTTP 进程已终止；酒馆专用测试页保留作续接。独立只读核对确认 P1 未虚报通过，并修正了“通过宿主 UI 保存仍会写入宿主管理数据”的表述。没有活动问题支线，返回 P1 的全局兼容设置许可门。

</details>

## 5. 工作方式与资料回执

- 2026-09-27 B-R1：用户明确确认单列＋左图右状态后实施，写前回读目标、原图/变量/匹配红线及构建交手验边界；Library 路由 `sillytavern-embedded-ui` / `sillytavern-card-pipeline`，快照 `2026-08-18`，读取 A0、C2/D7 与 A2/D1/D4 入口，复用既有组件/构建合同，无目录候选或新增依赖。宿主与窄屏视觉证据仍待本修订手验。

- 2026-09-27 N4：写前目标/红线/验收经两轮 grill-me 收口并获实施确认。Library 路由 media-live2d-runtime、embedded-ui、card-pipeline，快照2026-08-18；采用A0、E3/E4媒体生命周期、C2/D7共享容器布局、A2/D1/D4装配与资源边界；候选目录未采用。实际Gremlin签名/缓存以固定官方提交为准，宿主和人工验收分开；新增图片检查只留源码，没有执行。

- 2026-09-27 N3：Library 路由 `sillytavern-embedded-ui` 与 `sillytavern-card-pipeline`，快照 `2026-08-18`；采用 A0 目标/红线/验收、C2/C3/D7 的共享只读人物栏与容器布局原则、D1 固定资源和已有打包器适配合同。目录候选未采用，无新增依赖或第二状态源。目标与禁测边界写前回读，构建/包内容回读与宿主/用户验收分开；后两者仍待本包证据。
- 2026-09-24 阶段验收登记：仅更新本 NEXT，依据用户直接验收表述记录成品 A／A-R2 已接受、下一段 N3；JSON 哈希回读与既有交付一致。Library 路由 `sillytavern-card-pipeline`，快照 `2026-08-18`，采用 A0 与验收证据分层规则；没有重新打包、自动测试或宿主操作，既有检查缺口如实保留。
- 2026-09-24 P2 R1：Library 路由 `sillytavern-api-reference`、`sillytavern-embedded-ui`、`sillytavern-card-pipeline`，快照 `2026-08-18`；读取 A0、B1、C1、D1 与打包工具适配边界，候选目录未采用。精确初始化顺序以固定提交源码为准；用户的本轮禁测要求优先于一般检查流程。
- 2026-09-24 按用户批准范围定向合并源码、构建配置与 DESIGN/BLUEPRINT/NEXT；写前读取 TavernWeave A0 并按“目标／红线／验收”收口：目标是局部架构整理与打包交接，红线是不续用旧测试/宿主许可、不覆盖冲突文件、不新建权威蓝图，阶段包交用户手动检查。
- 参考模板仅采用源码/产物分层与稳定资源地址载入思路；webpack、自动同步、CI、Pinia 双向状态写入及全套依赖明确跳过。原文已备份到 `artifacts/architecture-backup-20260924-141149/docs/`，该目录只用于回滚，不是新的设计或进度权威。
- 本轮 Library 路由为 `code-quality-workflow` 和 `sillytavern-card-pipeline`，快照 `2026-08-18`；读取 A0、A2、D1、D4 的相关入口，采用组件边界与固定版本资源交付原则。没有采用目录候选，也没有因此获得远程发布或宿主操作许可。

以下为 2026-09-22～23 的历史资料回执，不代表本轮操作或当前许可：

- 技术栈补充本轮仅同步现有三份权威文档，未创建脚手架、安装依赖或推进阶段。Library 路由为 `orchestrate-project-blueprint`，读取 A0，快照 `2026-08-18`；路由候选未采用。保留工作区已有 `@types/` 及其他文件。
- 前序脑暴记录过 Soul 三席镜头；本轮走普通执行与只读核对，未触发 Soul 切换或持久设置。
- 本轮通过偏好管理器只读查询 Codex 客户端规则，结果 unset；没有推断、写入或更改用户挡位。
- 工程主路由：`orchestrate-project-blueprint`；写前读取 `consult-tavernweave-library` 与 A0；P0 字段/原作分层参考 `tavern-card-builder`，接口核对使用 `sillytavern-api-reference`。
- Library 快照 `2026-08-18`，路由为上述三个工程技能；实际采用 ST-A0 的目标/红线/验收、ST-A2 的卡与脚本边界、ST-A6 的显示/提示区别、ST-B1 原生变量存储区别、ST-C10 的真实消息与草稿生命周期、ST-C1 的 iframe/事件能力区分。版本敏感结论以本机 4.11.0 源码为准，不照搬指南旧版本。
- 路由候选未采用；没有增加 CRDT、状态库、文档站或测试框架。没有新建持久权威蓝图；临时问题支线无活动项。
- 本轮目标是把用户三项纠正同步到既有 DESIGN/BLUEPRINT/NEXT，并停止错误路线；红线为保持数值/故事/视觉选择与独立许可门。验收为现行合同一致、旧探针不再默认输出、旧测试明确标为历史；不把本次文档修正当作产品完成。
- 本次 Library 路由 `tavern-card-builder`，快照 `2026-08-18`；读取 A0、A3/A6 的组件职责，以及 `variable-systems.md` 的 MVU/Schema、更新模式及上下文区分。候选 Zod 文档条目仅为路由结果，没有据此确定安装版本；精确 API 和真实启用证据留待技术基线回补。
