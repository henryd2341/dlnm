import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCard } from '../src/card.ts';
import { createLiveLoader } from './live-loader.mjs';
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
const version = createHash('sha256').update(JSON.stringify(['live-html-v1', base.href, schemaBundle, stateBundle, stateCss])).digest('hex').slice(0, 12);
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
const instructions = `# DLNM N3＋命令行同步与动态前端

## 本次变化（2026-09-27）

本包只实现 N3，成品 A（含 A-R2）沿用用户已验收记录。非全屏默认显示扩宽人物状态栏，使用 CSS Grid 随可用消息宽度自动并排或堆叠。诺雅体力、莉莉希雅魔力条常显；头像、技能、教养、人格、本能、颜色、外貌与状态来源放在原生 &lt;details&gt; 中，默认折叠，点击或键盘展开。缺少有效 MVU 数据时明确提示，不填假数值。

已删除旧面板入口及隐藏 chat/form 的样式；轻前端没有场景图、NVL 正文、历史导航或第二个输入框，原生正文与输入继续可用。浏览器全屏仍显示完整阅读页，并共用同一人物组件；返回/Escape 回到轻前端。轻前端显示最新回复的有效人物状态，全屏仍按阅读选择显示历史状态，历史选择和草稿保留。数据监听持续存在，不以打开全屏为前提。

旧会话 mode: panel 仅映射为轻前端，不自动申请全屏，不清空草稿、等待状态或阅读位置。新 iframe 接管时旧人物栏退役；全屏内流式正文、发送等待和 MVU 保存链保留。详情在同一界面的数据刷新中保持展开状态；切换轻前端/全屏或重建 iframe 后按默认折叠。

已有角色使用 npm run sync:push 更新：整本覆盖 NA 世界书，同时更新角色内容、正则与脚本。只在初次建立角色时使用导入 JSON；以后更新省去重复导入。卡版本字段仍为 p2-nvl-na，以文件名哈希识别新包。首次推送把旧卡的固定前端地址换成 ${liveHtmlUrl}，之后只修改前端时 npm run build，再刷新酒馆或重新渲染消息即可。已经打开的界面不会被强制中断或自动换代。

本包是 N3 检查点，不是完整成品 B：头像与全屏场景仍为标注几何占位，N4 public/Illustration-Gremlin 和 N5 世界书扩充尚未实施。本轮仅构建打包与源码回读，自动测试、类型检查、lint、浏览器、真实酒馆和模型调用均未执行；N3 等待用户手验。

## 1. 文件和启动

- 导入卡：${resolve(root, `artifacts/${name}.json`)}
- 卡版本：${card.data.character_version}；JSON SHA256：${hash}
- 世界书：${card.data.character_book.name}（独立新名字，保留 R2 旧书）
- 配套资源：${resolve(root, `dist/${runtime}`)} 下的 schema.js、state.js、state.css、state.html。ZIP 保留 ${runtime}/ 目录；恢复时放回项目 dist/，保留其他版本目录。
- PowerShell 进入项目并启动 Vite：Set-Location -LiteralPath '${root.replaceAll("'", "''")}'; npm run dev
- 地址：${devOrigin}/。保持终端开启，结束时 Ctrl+C；端口占用会报错，不自动换端口。
- Vite 仅服务 dist 构建文件。前端改动：npm run build；卡内容/世界书/Schema/脚本/正则改动：npm run sync:push（先构建，再推送）。npm run pack 仅装配已有构建；上述命令均不串联测试。HTML 用固定地址异步读取，内含同一构建的 CSS 与固定版本 JS，避免样式和逻辑混版。

## 2. 首次接入与日常同步

1. 已有卡：按 ${resolve(root, 'docs/SYNC.md')} 配置准确的角色文件名，运行 npm run sync:push；新装才导入本 JSON。卡名仍为 DLNM-P1-香气链路，供既有脚本识别。本地源码以 Git 备份，不另建备份目录；Git 不包含酒馆聊天存档。
2. 推送会整本覆盖并绑定 ${card.data.character_book.name}，按本地源码删除远端多余条目；这是明确选定的行为。若采用首次手动导入，仍需在酒馆导入并链接内嵌世界书。旧 R2 书和聊天消息保持原样。
3. 确认本卡 3 条角色正则、2 项脚本启用；[initvar] 保持提示禁用。初值继续来自同一 19 字段 YAML，旧聊天和初始数值均不自动迁移。
4. 保持已有 MVU、Schema 及酒馆助手路径正常；没有新增独立安装包或依赖库。宿主需要已有的 SillyTavern.libs.showdown/DOMPurify。缺组件时给出说明并显示原文，不插入未经清理的 HTML。
5. 最新回复默认出现人物状态轻前端；点击“浏览器全屏阅读”才请求浏览器全屏，返回/Escape 回到轻前端。全屏功能未开放的浏览器继续使用原生聊天和人物状态。

## 3. N3 手验与已验收功能回归

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| L1 默认轻前端 | 打开最新角色回复，不进入全屏 | 两条数值条常显，人物详情默认折叠；没有旧面板按钮、场景图、正文副本或第二发送框；原生正文/输入仍可用 |
| L2 折叠与窄屏 | 用鼠标及 Tab/Enter 切换两名人物详情，在窄容器或手机查看 | 原生详情可开合、焦点可见；Grid 自动重排且长字段换行，无横向挤出；同实例状态刷新不重置展开 |
| L3 全屏返回 | 反复进入全屏并点击返回或按 Escape | 真浏览器全屏正常开关，回到轻前端；没有遮挡、残留样式或重复人物栏 |
| L4 当前与历史 | 全屏选一条旧回复后退出；在原生界面生成，再进入全屏 | 轻前端显示最新有效状态并自动更新，全屏仍保留历史选择/阅读位置；草稿保持，无变量倒写 |
| L5 旧会话兼容 | 在保留旧草稿/历史选择的专用副本加载新包 | 旧 panel 会话进入轻前端，不触发自动全屏；草稿/阅读选择仍在；新旧 iframe 交接无第二栏 |
| L6 异常与等待 | 按实际出现的待同步、停止或缺状态场景观察 | 必要提示常显；已保存状态带来源，缺数据不伪装成 0/100；修复保存后可自动回读 |

下列 A/W 项为既有已验收功能的回归清单，不据此声明它们已在 N3 包逐项执行。

以下操作由你决定是否执行；代理本轮没有代发消息或操作宿主。

发送等待回归（下列生成操作沿用你当前的模型设置，由你执行）：

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| W1 发送到首字 | 在阅读页发送一句回应，观察首字前的等待 | 点击立即进入本轮；确认后显示等待秒数；首字在同一位置接上，仍为一次真实发送 |
| W2 等待与历史 | 等待时回看上一轮，再返回最新；首字到达时也可停在历史 | 历史不被抢走；返回最新仍有等待提示或实际正文；人物数据没有提前变动 |
| W3 停止与异常 | 首字前停止，或使用已出现的失败场景；核对酒馆实际消息 | 本轮保留并显示停止/尚无正文；未确认草稿保留；没有自动重发或假成功 |
| W4 非流式与实例交接 | 在你选择的非流式模式观察等待；流式时保持全屏等待到首字 | 前者等到完整回复后替换提示，后者前端换代不丢等待状态；不新增空 AI 消息 |
| W5 重生成/续写 | 从酒馆原生入口重生成或续写当前轮，再看阅读页 | 重生成仍是原轮，旧正文明确标注；新内容接入后替换；续写在原正文追加，无额外新轮 |

成品 A 与 A-R2 已获用户整体验收；N3 的 L1～L6 及相关回归仍待手验，不补造逐项运行记录。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| A1 流式 | 保留当前模型设置，在流式模式发送一条普通回应 | 文字随生成出现，末段/末字保留，无重复；技术尾块和前端加载器不混入正文 |
| A2 非流式 | 在你选择的非流式设置再生成一轮 | 完成后正文自动刷新；MVU 保存后人物栏自动更新，无需“重新读取” |
| A3 全屏接管 | 保持全屏连续生成，再返回/Escape 后用原生输入生成并重新进入 | 新消息 iframe 接管后保持全屏与样式；退出界面期间仍能同步最新内容 |
| A4 历史/滚动 | 回看旧轮，或在最新长文中向上滚动；此时有新内容到达 | 不抢回最新/不强行滚到底；主动返回最新或滚到底后才继续跟随 |
| A5 草稿/停止 | 草稿未发送时切轮/退出并重进全屏；生成中停止，或遇网络失败 | 已收正文和草稿保留，不自动重发；状态未确认时暂停下一轮；普通回复结束后正常同步 |
| A6 分支/聊天 | 用酒馆原生界面换 swipe、编辑回复、重生成或切聊天 | 正文和状态回到当前真实楼层/分支；旧流式任务不覆盖新对象，草稿按聊天隔离 |
| A7 Markdown/染色 | 在专用回复副本保留原 MVU 尾块，加入加粗、斜体、列表、引用、代码块、常规链接，以及 <span style="color: red">红色</span> 和 <span style="color: #9bc7ff">月光</span> | 实时与历史使用同一格式；代码中的标签保持字面；黑底可读；染色不改 noa.colors |
| A8 清理/窄屏 | 在专用副本检查半截技术块、未闭合 span、带事件属性的标签及脚本/iframe文本，再看窄屏/长代码 | 技术块被隐藏；脚本、事件和 iframe 不执行；仅 span color 被保留；代码滚动和长链接不撑破布局 |

请反馈未通过的编号、操作和实际表现。成品 A 通过后再继续 N3/N4；本包不宣称完整 P2/P3/P4/P5 验收。

## 4. 实现与边界

- 原生 STREAM_TOKEN_RECEIVED 是累计生成文本；续写只加一次既有前缀。临时正文按聊天、生成对象、消息及分支核对，用宿主浏览器帧合并刷新，不写聊天或 MVU。
- 生成结束事件早于部分 MVU 写回；人物状态暂留上一份有效值，目标 CHARACTER_MESSAGE_RENDERED 到来后自动回读精确楼层/分支。可回读不等于磁盘保存已验证，刷新/重开仍留手验。
- 退出阅读只释放显示层，不再卸掉消息监听；替换 iframe 或切聊天才退役旧监听与定时任务。宿主仍是消息、分支、生成和存档的唯一来源。
- Markdown 使用宿主现有 Showdown 的基本选项，不调用会再次执行角色正则的 messageFormatting/formatAsDisplayedMessage；可能与酒馆个性化格式细节略有差别。
- HTML 用宿主现有 DOMPurify 工厂的新实例处理，不改宿主全局 hooks。只保留基本排版和 http/https/mailto 链接；不保留图片、表单、脚本、iframe、事件属性或任意样式。
- 合法链接固定在新标签打开，并带 noopener/noreferrer；模型自带的 target/rel 被替换，不导航走酒馆页面或消息 iframe。
- span 只收不透明的命名色、#RGB/#RRGGBB、rgb()/hsl()，去掉 alpha、透明、var()/url() 等。过暗颜色为黑底阅读提亮；这是显示处理，不写回回复原文或颜色变量。
- 当前人物/背景仍为几何占位，public 原图未打包，未安装 Illustration-Gremlin。本包已包含轻前端，正式图包仍留 N4。
- 草稿和阅读位置只存当前浏览器会话；没有第二套聊天存档或跨设备同步。历史在事件稳定后线性读取，token 到来不重扫全部历史；长聊天性能尚未测量。
- 未发送或未获酒馆确认的草稿保留；只有酒馆已创建文本一致的真实用户消息，才清空那一份已提交草稿。停止/失败不自动重发，已经送出的行动仍在真实聊天中，之后输入的新草稿保持。
- 等待页是显示投影，负编号只用于前端选择，跳过消息与 MVU 读取接口；真实 pages 和聊天记录都不插入这张临时页。原生流式占位 ... 不被当作已收到正文，首个可见 token 或非流式真实正文才接管。
- 原生 GENERATION_AFTER_COMMANDS 早于 MESSAGE_SENT；结束事件也可能早于最终渲染及停止事件。等待计时从实际消息确认起算，结束后延迟回读；“尚未收到正文”是观察结果，不宣称已判定网络故障。等待记录和计时只服务本轮反馈，不构成任务队列或第二套聊天存档。
- 已补充可运行回归检查源码，但本轮未执行；浏览器清理、完整全屏交接、长聊天、真实手机、失败恢复仍待手验。

## 5. 资源和地址

卡内含 ${card.data.character_book.entries.length} 个世界书条目、3 条正则、2 项脚本。资源：
- Schema：${schemaUrl}
- 界面：${stateUrl}
- 样式：${styleUrl}（同份编译 CSS 已封装进 HTML）
- 固定 HTML 入口：${liveHtmlUrl}（实际使用仍需要酒馆助手消息 iframe 上下文）
- 本次 HTML 内容：${htmlUrl}；CSS 随 HTML 一起更新，卡里只保留小型异步加载器
- MVU 和 Zod 注册沿用固定提交 CDN；本包不是全离线包。

地址由 ${resolve(root, 'delivery.config.mjs')} 管理，允许的酒馆来源：${hostOrigins.join('、')}。
当前仅监听电脑 127.0.0.1；手机同名地址指手机自己，本次未开放局域网。窄屏检查不等于真实手机资源可达。
没有创建远程仓库、部署或发布；改前源码以本地 Git 提交 886753b 留存，新包和旧包分别保留。推送命令按用户要求没有内容差异检查、回读校验或自动备份。
`;
// Immutable checkpoints: allow identical re-packs, stop on any content collision.
const outputs = new Map([
  [`dist/${runtime}/schema.js`, schemaBundle],
  [`dist/${runtime}/state.js`, stateBundle],
  [`dist/${runtime}/state.css`, stateCss],
  [`dist/${runtime}/state.html`, stateHtml],
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
