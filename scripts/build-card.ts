import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCard } from '../src/card.ts';
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
  if (getCurrentCharacterName() !== 'DLNM-P1-香气链路') return;
  // Always start this card's pinned lifecycle; MVU's unique-script registry chooses the active instance.
  await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@183d8ade3b9a3369e824a55cb13b4ddf91aada50/artifact/bundle.js');
})().catch(error => console.error('[DLNM MVU] 加载失败', error));`;
const card = createCard({ schemaScript, loaderScript, stateHtml: createLiveLoader(liveHtmlUrl) });
const content = JSON.stringify(card, null, 2) + '\n';
const hash = createHash('sha256').update(content).digest('hex');
const name = `dlnm-mvu-p2-dev-${hash.slice(0, 12)}`;
const instructions = `# DLNM N4 · 成品 B-R1 布局修订

## 交付状态

用户已反馈成品 B 基础验证通过；B-R1 仅将人物区改成单列、左图右状态，收紧头像留白。原图、24 字段结构、图片匹配与背景规则保持原样。本修订只完成本地源码、构建和打包；自动测试、typecheck、lint、浏览器、真实酒馆和模型调用均未执行，新布局待用户手验。N5 世界书内容扩充保持后续。

- 卡版本：${card.data.character_version}；JSON SHA256：${hash}
- 本次图片来源：**${imageManifest.source === 'development' ? 'development：开发占位图' : 'gremlin：当前角色图包'}**
- 卡 JSON：${resolve(root, `artifacts/${name}.json`)}
- 配套资源：${resolve(root, `dist/${runtime}`)}，含 schema.js、state.js、state.css、state.html、image-manifest.json。
- 固定 UI：${liveHtmlUrl}；本次固定 HTML：${htmlUrl}
- 开发图仅在 dist/n4-images/，本次有 ${imageManifest.images.filter(image => image.path).length} 张按内容哈希命名的副本。原 public 保持原样；没有制作正式图包，交付 ZIP 不含这些临时图片。恢复本地开发图用同一项目的 npm run build。

## 启动与更新

1. 在项目根目录运行 npm run dev，保持 ${devOrigin}/ 可访问；Vite 只服务 dist，不公开项目源码或整个 public。
2. 从 N4 以前的版本升级时，Schema 和世界书属于破坏性升级：按 docs/SYNC.md 执行 npm run sync:push 后新建聊天，旧聊天不迁移/重置/删除。已使用成品 B 的 24 字段聊天升级 B-R1 时，只需第 4 步刷新前端，沿用现有聊天；本修订没有变量迁移。代理本轮没有执行推送。
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

背景仅映射宅邸起居室/起居室/客厅、宅邸外观/宅邸门外/宅邸正门、宅邸走廊/走廊/廊道。清晨/上午/午后用 day，夜间/深夜用 night，傍晚用 night 并明确提示暂无黄昏图。未映射地点（包括城市）显示缺图状态，不沿用上一地点图片。

## 成品 B 手验清单（基础验证已有用户反馈，B-R1 重点复核 B2）

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

现有 scripts/check-nvl.ts 已同步单列与左右栏检查，未运行；其他检查亦未执行。构建输出与源代码回读仅是离线证据，新布局的实际 CSS、宿主加载、窄屏与手机表现仍待手验。历史固定资源和成品包保留，不另建备份目录，不自动提交。
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
