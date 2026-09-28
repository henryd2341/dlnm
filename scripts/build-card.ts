import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCard } from '../src/card.ts';
import { cardName } from '../src/card-content.ts';
import { createLiveLoader } from './live-loader.mjs';
import { expressionRules } from '../src/images.ts';
import { assetBaseUrl, devOrigin, hostOrigins } from '../delivery.config.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = new URL(assetBaseUrl);
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || !base.pathname.endsWith('/')) {
  throw Error('assetBaseUrl requires an HTTP(S) directory URL ending in /, without credentials, query or fragment');
}
const schemaBundle = readFileSync(resolve(root, 'dist/schema.js'), 'utf8');
const stateBundle = readFileSync(resolve(root, 'dist/state.js'), 'utf8');
const stateCss = readFileSync(resolve(root, 'dist/state.css'), 'utf8');
if (!schemaBundle.trim() || !stateBundle.trim() || !stateCss.trim()) throw Error('Build outputs are empty; run npm run build first');
const imageManifestText = readFileSync(resolve(root, 'dist/image-manifest.json'), 'utf8');
const imageManifest = JSON.parse(imageManifestText) as { source: 'development' | 'gremlin'; images: { name: string; source: string; path?: string; sha256?: string; bytes?: number }[] };
const version = createHash('sha256').update(JSON.stringify(['live-html-n4', base.href, schemaBundle, stateBundle, stateCss, imageManifestText])).digest('hex').slice(0, 12);
const runtime = `p2-${version}`;
const schemaUrl = new URL(`${runtime}/schema.js`, base).href;
const stateUrl = new URL(`${runtime}/state.js`, base).href;
const styleUrl = new URL(`${runtime}/state.css`, base).href;
const htmlUrl = new URL(`${runtime}/state.html`, base).href;
const liveHtmlUrl = new URL('live/state.html', base).href;
// Load into the existing Helper iframe so its message identity and APIs stay intact.
const attribute = (url: string) => url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const stateHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style id="dlnm-nvl-style">${stateCss.replace(/<\/style/gi, '<\\/style')}</style><style>html,body{margin:0;background:#111;color:#eee}#dlnm-state{min-height:44px}</style></head><body><div id="dlnm-state">正在加载 NVL 阅读界面…</div><script data-dlnm-entry src="${attribute(stateUrl)}" onerror="document.getElementById('dlnm-state').textContent='阅读界面加载失败，请检查使用说明中的 Vite 服务与资源地址。'"></script></body></html>`;
const schemaScript = `void import(${JSON.stringify(schemaUrl)}).catch(error => console.error('[DLNM Schema] 资源加载失败，请检查 Vite 服务与资源地址', error));`;
const loaderScript = `// MVU 183d8ade; dedicated test card only. No model calls.
void (async () => {
  if (getCurrentCharacterName() !== ${JSON.stringify(cardName)}) return;
  // Always start this card's pinned lifecycle; MVU's unique-script registry chooses the active instance.
  await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@183d8ade3b9a3369e824a55cb13b4ddf91aada50/artifact/bundle.js');
})().catch(error => console.error('[DLNM MVU] 加载失败', error));`;
const card = createCard({ schemaScript, loaderScript, stateHtml: createLiveLoader(liveHtmlUrl) });
const content = JSON.stringify(card, null, 2) + '\n';
const hash = createHash('sha256').update(content).digest('hex');
const name = `dlnm-mvu-p2-dev-${hash.slice(0, 12)}`;
const instructions = `# DLNM N5 · 成品 C 内容候选

## 交付状态

N5 接入世界书与开场：11 条叙事条目覆盖关系与称谓索引、四名人物、两类地点和四类主题，原有 5 条技术条目保留，共 16 条。正文采用用户最新修订，诺雅、莉莉希雅、塞拉菲娜各有 12、12、10 段分类中文语料，诺雅仍由玩家决定。此说明随本地装配生成，宿主与用户验收另行记录。原图、24 字段、图片映射及 B-R1 单列左右布局保持；前端、Schema 注册与 MVU 加载器统一读取当前卡名。自动测试、typecheck、lint、浏览器和模型调用未由打包器执行。

- 卡版本：${card.data.character_version}；JSON SHA256：${hash}
- 本次图片来源：**${imageManifest.source === 'development' ? 'development：开发占位图' : 'gremlin：当前角色图包'}**
- 卡 JSON：${resolve(root, `artifacts/${name}.json`)}
- 配套资源：${resolve(root, `dist/${runtime}`)}，含 schema.js、state.js、state.css、state.html、image-manifest.json。
- 固定 UI：${liveHtmlUrl}；本次固定 HTML：${htmlUrl}
- 开发图仅在 dist/n4-images/，本次有 ${imageManifest.images.filter(image => image.path).length} 张按内容哈希命名的副本。原 public 保持原样；没有制作正式图包，交付 ZIP 不含这些临时图片。恢复本地开发图用同一项目的 npm run build。

## 启动与更新

1. 在项目根目录运行 npm run dev，保持 ${devOrigin}/ 可访问；Vite 只服务 dist，不公开项目源码或整个 public。
2. N5 是内容更新：获准后按 docs/SYNC.md 执行 npm run sync:push，更新世界书与开场；仅刷新前端不会更新内容。已有 N4/B-R1 的 24 字段聊天可继续使用，旧消息及其第 0 楼保持原样；要体验新版开场请另开新聊天。从 N4 以前的旧结构升级仍需新建聊天，旧聊天不迁移/重置/删除。打包器本身没有推送能力。
3. 初次建立角色才导入 JSON；已有卡用命令行同步。主世界书仍是 ${card.data.character_book.name}，按用户既定要求整本覆盖。保留 3 正则、2 脚本及 MVU 固定版本；[initvar] 提示禁用是正常设置。
4. 纯前端以后 npm run build，再刷新酒馆或重新渲染消息。已打开的前端不强制中断。构建覆盖 dist/live/state.html 与 artifacts/dlnm-sync.json，历史固定目录保留。
5. 重新读取状态与图片会重新列当前图包并获取 URL；导入、更新、删除图片后点击它。每次进入轻前端/全屏也重新取图。图片失败不阻断正文或人物数值。

## 图片来源与正式图包

delivery.config.mjs 的 imageSource 当前默认 development，环境变量 DLNM_IMAGE_SOURCE 可为某次构建覆盖为 gremlin。正式使用时把该配置设为 gremlin，再构建/同步；也可在同一 PowerShell 窗口执行 $env:DLNM_IMAGE_SOURCE='gremlin' 后执行 npm run sync:push。后续构建同样保持此来源选择，避免下一次构建恢复开发模式。

正式模式请自行安装 [Illustration-Gremlin](https://github.com/pokerface-1224/Illustration-Gremlin)，为**当前整张 DLNM 卡**导入图包；四个人物都放在该卡图包中，用下面的唯一文件名区分，不是分别切换到四张角色卡。使用自备图片的副本整理名字，原图保留。

- 诺雅示例：noah__blush_underwear.png；狸猫示例：tanuki__smile.png。
- 缺扩展、OPFS 不可用或缺图会提示；正式分支完全不读取开发占位 URL。
- listImages(current) 返回哪条 character/relativePath，就用该条精确取图。重名逻辑图提示修正，不借用其他目录或角色的 default。
- 扩展按清洗后的**卡名**隔离，不是头像 ID；两张同名或清洗后同名的卡可能共享图包，使用时避免此类同名。
- Blob URL 由扩展缓存和回收。本卡不将 URL 写入 MVU、聊天或会话，不在卸载时释放扩展共享 URL。图包修改会使旧 URL 失效，重新读取即可。
- 本次源代码核对为 API v1.4.0 / commit 222150201c9cd3ab48435fc9b9221ed699d79e24；宿主安装、同源 iframe 和 OPFS 实际表现待手验。[固定 API 文档](https://github.com/pokerface-1224/Illustration-Gremlin/blob/222150201c9cd3ab48435fc9b9221ed699d79e24/API.md)
- 未安装扩展、导入图包、创建远程仓库或发布。手机上的 127.0.0.1 是手机自身，本包未开放局域网，窄屏不等于手机网络可达。

### 唯一图片名清单（${imageManifest.images.length} 项）

清单也随资源提供 image-manifest.json；source 是开发参照，不代表正式素材资格。实际只引用四人 49 图和三处地点 6 图，其余背景不复制、不映射。

| 唯一文件名 | 开发参照 |
| --- | --- |
${imageManifest.images.map(image => `| ${image.name} | public/${image.source} |`).join('\n')}

## 规则与初值

- noah 保留原 11 字段，新增 clothing=女仆服、expression=神态平静；lilicia 保留原五字段和初值（居家便服／神态放松）。
- seraphina 只有 clothing=修女服，戴头纱、expression=神态平静；tanuki 只有 expression=神态平静。新文本沿用 1～120 字符范围。
- 服装先匹配：诺雅/莉莉希雅含睡或内用 _underwear；塞拉菲娜含纱或巾用 _sisterveil；否则无后缀，狸猫省去服装判断。
- 表情在该角色支持的规则中按下面顺序取第一个单字命中。smile 已移除微；微笑命中笑，微怒回 default。纯 includes 会把不喜欢匹配到 smile，因此变量直接描述当前状态，不混否定句或换装历史。
- 图片逐级取目标表情＋服装、同衣 default、无后缀 default；全缺时文字占位。未知表情本就取 default；塞拉菲娜只有 default/smile，狸猫只有 default/sad/smile/surprised/worried。

| 优先级 | 表情 | 单字命中 |
| --- | --- | --- |
${expressionRules.map(([expression, keys], index) => `| ${index + 1} | ${expression} | ${[...keys].join('、')} |`).join('\n')}

宽窄区均按诺雅、莉莉希雅、塞拉菲娜、狸猫单列排列；每项左图右状态。左图栏取卡片内容宽度的 32%，上限 7.5rem；图片按原比例自然高度显示，内边距 .25rem，保留全图，不强行等高。四张头像均在 details 外。诺雅体力、莉莉希雅魔力常显；两人其他字段可折叠。塞拉菲娜与狸猫没有数值条或 details，少量字段直接显示。人物状态来源保留独立折叠入口；全屏人物栏沿用内部滚动。

全屏页头使用内嵌月牙 SVG，状态栏与正文共用细窄暗色滚动条；背景是正文滚动容器的同级图层，尺寸跟随阅读视口，正文和状态各自滚动。宽度 ≤1000px 时，标题独占一行，场景信息及图标操作区依次排在下方；人物状态默认收起，点阅读区左侧中部的右箭头展开，点侧栏左箭头、遮罩或按 Esc 关闭。图标保留操作名称提示和 44px 触控区。桌面状态栏常显，正文阅读位置与流式跟随保持。真实滚动、手机展开/收起、键盘焦点与横竖屏切换待手验。本轮纯展示更新使用固定 UI 地址，已完成 C 内容同步的角色只需刷新页面或重新渲染消息。

月亮图标：[Font Awesome Free 6.7.2 Moon](https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/solid/moon.svg)，Copyright 2024 Fonticons, Inc.，图标采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；SVG 路径保持官方版本，沿用界面颜色。授权归属同时内嵌于 SVG metadata，运行时使用本地资源，省去图标字体和额外联网加载。

背景仅映射宅邸起居室/起居室/客厅、宅邸外观/宅邸门外/宅邸正门、宅邸走廊/走廊/廊道。清晨/上午/午后用 day，夜间/深夜用 night，傍晚用 night 并明确提示暂无黄昏图。未映射地点（包括城市）显示缺图状态，不沿用上一地点图片。

## N5 世界书与来源

- 卡名为“${card.data.name}”，绑定世界书为“${card.data.character_book.name}”；两者与维护源码一致。同步目标 PNG 文件名仍由 delivery.config.mjs 单独指定，显示名变化不会自动重命名该文件。
- ID 0 为禁用的 YAML 初值；ID 2～5 为原有状态投影、字段、输出与正文合同；ID 1 为常驻关系及索引；ID 6～15 按关键词激活。
- 叙事条目扫描最近 4 条消息，采用不区分大小写的片段匹配，触发概率 100%，禁止条目间递归激活；不扫描人物描述或场景字段来点亮细节。
- 所有条目仍受宿主世界书预算影响，未改用户全局设置、未强制越过预算。关键词命中不等于最终进入提示；请检查实际上下文和截断情况。长时间只用代词或没有主题词时，条件条目可能不命中，常驻索引只提供简要身份。
- 来源与审阅文稿留在 ${resolve(root, 'docs/N5-世界书草稿.md')}，运行源码是 ${resolve(root, 'src/card-content.ts')}；角色卡不读取 Markdown 文档，来源表、哈希与审批文字不进入叙事条目。

| ID | 条目 | 触发 |
| --- | --- | --- |
${card.data.character_book.entries.map(entry => `| ${entry.id} | ${entry.comment} | ${!entry.enabled ? '禁用，仅初始化读取' : entry.constant ? '常驻' : entry.keys.join('、')} |`).join('\n')}

设定整理依据用户本地日文对照 ManualTransFile.json，674,888 字节，SHA256：5D4E0725FEC2421FA3BE62E895FF6FB93DA1055E3655332AA338984F7500686E。该对照的中文值存在错译与顺移，日文键优先。三人的 34 段语料另依据用户提供的 scenario/*.ks 脚本，以角色标记核对说话者和分支后翻译为简体中文；逐段行号见来源文稿第七节。下表保留设定整理的定位摘要，完整 19 项对照见文稿。

| 条目 | 原文定位 | 采用边界 |
| --- | --- | --- |
| 关系与香气（1、12） | L1694～1770、5381～5397 | 留任分支；铃兰已赠、未来同行已有回应、共用香气未找到；明确恋人与续篇首日起点为项目选择 |
| 诺雅（6） | L408～412、955～956、1092～1096、1680～1748、2727～2751、3435～3451 | 修道院出身与成长；当前四色取已有设计；内侧发色只对应进展片段 |
| 莉莉希雅（7） | L325～398、680～714、782～785、3445～3447、4433～4465、4525～4527、4578～4605 | 人魔混血与魅魔自述并存；能力有限度，不补全知或隐藏创伤 |
| 塞拉菲娜／狸猫（8、9） | L299～322、569～599、917～918、1646～1704、3439、4622～4640 | 主教、老师与旧识；部分发言依语境推定；狸猫真实身份未定，L320～322 观察者未定 |
| 城市与宅邸（10、11） | L843～855、886～901、1042～1112、3453～3468、3503～3513 | 城市“只有女性”不推及全世界；起源保留书内传说；无完整地图 |
| 香气／色彩（12、13） | L861～901、920～939、1126～1128、1169～1187、2683～2689 | 理论和个人经历分开；气味或文字染色不自动发放颜色 |
| 魔族／神圣术（14、15） | L905～918、958～1003、1229～1262 | 书内学说、礼俗及宗教历史，不推成莉莉希雅个人的完整生理规律 |

## 成品 C 待手验

| 编号 | 操作 | 预期 |
| --- | --- | --- |
| C1 | 获准同步后核对卡片绑定与世界书，再新建聊天 | 绑定 ${card.data.character_book.name}，含 16 条；出现新版起居室开场；24 字段初始化和前端仍工作 |
| C2 | 分别谈及诺雅、莉莉希雅、塞拉菲娜、狸猫并查看实际提示 | 命中对应人物资料，前三人含分类中文语料；单个名字不通过索引递归加载整本书 |
| C3 | 分别谈及瑟雷妮亚、庭院、香气、色视、魔族、神圣术 | 对应地点／主题命中；书内观点与原作／续篇分层，无预算遗漏关键条目 |
| C4 | 接受、推迟、改变香气计划各体验一次 | 延续已答应的未来约定，今天仍可商量；不代写诺雅的决定，不强制奖励或出行 |
| C5 | 在原有 24 字段聊天继续，再回看旧消息与分支 | 旧开场、变量和历史保持；当前内容更新不重写旧消息，技术更新协议与状态显示有效 |

这些场景只是手验清单，打包器没有调用模型、打开浏览器、推送或记录用户接受。

## 成品 B 回归清单（既有基础反馈保留，不代替本包手验）

| 编号 | 操作 | 预期 |
| --- | --- | --- |
| B1 | 同步后新建聊天 | 自动初始化五个顶层分组及 24 字段，四角可见；旧聊天无自动迁移/重置 |
| B2 | 宽消息区、320px 窄容器、全屏/退出；展开详情、查看长字段与缺图提示 | 始终单列左图右状态，头像留白收紧、比例完整，无横向溢出；狸猫按自身比例显示；塞/狸没有数值条与details；诺/莉折叠不藏头像；全屏人物栏可滚动看全四人 |
| B3 | 用变量编辑器在当前副本保存睡衣＋羞涩微笑、微怒、疲惫微笑 | 分别显示 blush_underwear、default、tired_smile；这是建议手验，代理未写宿主变量 |
| B4 | 塞拉菲娜戴头纱/长发披散，狸猫忧虑/笑容 | 头纱服装正确切换；狸猫只按表情，无衣服后缀 |
| B5 | 三地点、日夜、傍晚、未映射地点 | 对应背景/明确黄昏回退/缺图提示；轻前端始终无背景 |
| B6 | 回看不同状态历史、切swipe、快速切聊天 | 图片来自所选已保存状态；旧异步返回不覆盖新画面；没有额外变量写回 |
| B7 | 切gremlin构建，同步后缺扩展/缺图观察，再自行安装导图 | 缺失有提示且不读本机public；按当前卡唯一文件名取图 |
| B8 | 缺目标表情、缺同衣default、全部缺图 | 依次按同角色规则回退并提示；正文、数值保持可用 |
| B9 | 更新/删除/重新导入图包后重新读取，刷新与反复全屏 | 新图片可见，过期Blob不复用，不主动revoke破坏另一视图 |
| B10 | 按已有A/W清单回归流式、非流式、等待、停止、Markdown/染色 | 原已验收链路保留；单独记录本包实际运行证据 |

现有检查脚本仍含旧卡名、旧世界书名及旧文稿结构断言，后续运行前需按确认后的结构维护；本次打包未执行测试、typecheck 或 lint。构建输出与源码回读属于离线证据，宿主上下文、预算、实际剧情与手机表现仍待手验。历史固定资源和成品包保留，不另建备份目录，不自动提交。
`;
// Immutable checkpoints: allow identical re-packs, stop on any content collision.
const outputs = new Map([
  [`dist/${runtime}/schema.js`, schemaBundle],
  [`dist/${runtime}/state.js`, stateBundle],
  [`dist/${runtime}/state.css`, stateCss],
  [`dist/${runtime}/state.html`, stateHtml],
  [`dist/${runtime}/image-manifest.json`, imageManifestText],
  [`artifacts/${name}.md`, instructions],
  [`artifacts/${name}.json`, content],
]);
for (const [relative, value] of outputs) {
  const path = resolve(root, relative);
  if (existsSync(path) && readFileSync(path, 'utf8') !== value) throw Error(`同名工件内容不同，保留现有文件：${path}`);
}
for (const [relative, value] of outputs) {
  const path = resolve(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) writeFileSync(path, value, { flag: 'wx' });
}
// Publish the complete HTML only after its immutable JS/CSS exist. Card text stays outside dist.
for (const [relative, value] of [['dist/live/state.html', stateHtml], ['artifacts/dlnm-sync.json', content]]) {
  const path = resolve(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}
console.log(`P2 package: artifacts/${name}.json\nGuide: artifacts/${name}.md\nRuntime: dist/${runtime}/\nLive UI: ${liveHtmlUrl}\nSync input: artifacts/dlnm-sync.json\nSHA256 ${hash}\nTests not run; host loading and user acceptance pending.`);
