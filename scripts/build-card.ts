import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCard } from '../src/card.ts';
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
const version = createHash('sha256').update(JSON.stringify([base.href, schemaBundle, stateBundle, stateCss])).digest('hex').slice(0, 12);
const runtime = `p2-${version}`;
const schemaUrl = new URL(`${runtime}/schema.js`, base).href;
const stateUrl = new URL(`${runtime}/state.js`, base).href;
const styleUrl = new URL(`${runtime}/state.css`, base).href;
const htmlUrl = new URL(`${runtime}/state.html`, base).href;
// Load into the existing Helper iframe so its message identity and APIs stay intact.
const attribute = (url: string) => url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const stateHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style id="dlnm-nvl-style">${stateCss.replace(/<\/style/gi, '<\\/style')}</style><style>html,body{margin:0;background:#111;color:#eee}#dlnm-state{min-height:44px}</style></head><body><div id="dlnm-state">正在加载 NVL 阅读界面…</div><script src="${attribute(stateUrl)}" onerror="document.getElementById('dlnm-state').textContent='阅读界面加载失败，请检查使用说明中的 Vite 服务与资源地址。'"></script></body></html>`;
const schemaScript = `void import(${JSON.stringify(schemaUrl)}).catch(error => console.error('[DLNM Schema] 资源加载失败，请检查 Vite 服务与资源地址', error));`;
const loaderScript = `// MVU 183d8ade; dedicated test card only. No model calls.
void (async () => {
  if (getCurrentCharacterName() !== 'DLNM-P1-香气链路') return;
  // Always start this card's pinned lifecycle; MVU's unique-script registry chooses the active instance.
  await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@183d8ade3b9a3369e824a55cb13b4ddf91aada50/artifact/bundle.js');
})().catch(error => console.error('[DLNM MVU] 加载失败', error));`;
const card = createCard({ schemaScript, loaderScript, stateHtml });
const content = JSON.stringify(card, null, 2) + '\n';
const hash = createHash('sha256').update(content).digest('hex');
const name = `dlnm-mvu-p2-dev-${hash.slice(0, 12)}`;
const instructions = `# DLNM 成品 A-R2：发送等待反馈修订

## 本次变化（2026-09-24）

你已反馈前一修订包的流式生成通过。本包只补发送后、首字前的等待阶段：点击发送立即展示本轮输入与“正在发送”；酒馆确认真实用户消息后显示实际收到的文本、“已发送，等待回复”和等待秒数。收到首段可见正文后，原位置接续既有流式显示，不额外创建真实空 AI 消息，也不提前更新人物变量。

发送确认前保留草稿；被宏/扩展改写时，展示酒馆实际文本并保留原草稿提示核对。15 秒未确认时显示“发送尚未确认”，不是断言发送失败。停止或生成结束仍未见正文时，保留本轮并明确提示返回酒馆核对，不自动重发。等待中可以回看历史，新回复不会抢走历史页；返回最新可继续查看等待或正文。

等待状态仅保存在既有浏览器会话 UI 记录中，前端实例换代时核对真实聊天再接续。重新生成留在原轮，等待时标注并保留旧正文；续写保持原页。人物状态仍来自已经保存的 MVU 数据。沿用 A-R1 的正则启动修复；本包的 A-R2 标签不指旧 P2-R2 05676741617c。

沿用下方完整卡交付方式，在专用副本导入本次新 JSON；已有 NA 世界书继续链接，无需再次导入同一世界书或安装酒馆助手。卡版本字段仍为 p2-nvl-na，以文件名哈希识别新包。旧卡固定引用旧资源，仅刷新旧卡或重启 Vite 仍会加载旧 JS。

状态：N0 合同已同步，N1/N2 已实现并构建；本包等待用户手验。变量问题沿用用户已确认正常的结论，不重做初始化和状态系统。
本阶段仍保留浏览器 Fullscreen API、旧面板及 CSS/SVG 标注占位图。轻前端、public 开发图、Illustration-Gremlin 接入和世界书扩充分别在 N3/N4/N5，尚未交付。
本轮未运行自动测试、类型检查、lint、浏览器、真实酒馆或模型调用；构建成功不是运行通过。

## 1. 文件和启动

- 导入卡：${resolve(root, `artifacts/${name}.json`)}
- 卡版本：${card.data.character_version}；JSON SHA256：${hash}
- 世界书：${card.data.character_book.name}（独立新名字，保留 R2 旧书）
- 配套资源：${resolve(root, `dist/${runtime}`)} 下的 schema.js、state.js、state.css、state.html。ZIP 保留 ${runtime}/ 目录；恢复时放回项目 dist/，保留其他版本目录。
- PowerShell 进入项目并启动 Vite：Set-Location -LiteralPath '${root.replaceAll("'", "''")}'; npm run dev
- 地址：${devOrigin}/。保持终端开启，结束时 Ctrl+C；端口占用会报错，不自动换端口。
- Vite 仅服务 dist 构建文件。改源码后 npm run build 再导入新卡包；刷新旧卡依然读旧固定资源。npm run pack 仅装配已有构建，二者均不串联测试。

## 2. 导入（先保留旧对象）

1. 导出备份旧卡与聊天。在专用副本导入本 JSON；遇到同名角色不要直接覆盖原卡。卡名仍为 DLNM-P1-香气链路，供既有脚本识别。
2. 已有 ${card.data.character_book.name} 时直接链接；尚未导入才导入本包内嵌世界书。它包含新增正文呈现约定，继续链接 R2 旧书就不会得到这条新指示。保留旧书，不批量修改历史聊天。
3. 确认本卡 3 条角色正则、2 项脚本启用；[initvar] 保持提示禁用。初值继续来自同一 19 字段 YAML，旧聊天和初始数值均不自动迁移。
4. 保持已有 MVU、Schema 及酒馆助手路径正常；没有新增独立安装包或依赖库。宿主需要已有的 SillyTavern.libs.showdown/DOMPurify。缺组件时给出说明并显示原文，不插入未经清理的 HTML。
5. 在最新回复点击“浏览器全屏阅读”。原生 Fullscreen API 要求点击；返回/Escape 退出。成品 A 暂留旧面板，待手验通过后的 N3 替换成轻前端。

## 3. 成品 A 手验清单

以下操作由你决定是否执行；代理本轮没有代发消息或操作宿主。

优先手验本次等待反馈（下列生成操作会沿用你当前的模型设置，由你执行）：

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| W1 发送到首字 | 在阅读页发送一句回应，观察首字前的等待 | 点击立即进入本轮；确认后显示等待秒数；首字在同一位置接上，仍为一次真实发送 |
| W2 等待与历史 | 等待时回看上一轮，再返回最新；首字到达时也可停在历史 | 历史不被抢走；返回最新仍有等待提示或实际正文；人物数据没有提前变动 |
| W3 停止与异常 | 首字前停止，或使用已出现的失败场景；核对酒馆实际消息 | 本轮保留并显示停止/尚无正文；未确认草稿保留；没有自动重发或假成功 |
| W4 非流式与实例交接 | 在你选择的非流式模式观察等待；流式时保持全屏等待到首字 | 前者等到完整回复后替换提示，后者前端换代不丢等待状态；不新增空 AI 消息 |
| W5 重生成/续写 | 从酒馆原生入口重生成或续写当前轮，再看阅读页 | 重生成仍是原轮，旧正文明确标注；新内容接入后替换；续写在原正文追加，无额外新轮 |

原 A1 流式已有你在上一包中的通过反馈；本修订尚待 W1～W5 和相关回归手验，不把上一包结果自动计为新包通过。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| A1 流式 | 保留当前模型设置，在流式模式发送一条普通回应 | 文字随生成出现，末段/末字保留，无重复；技术尾块和前端加载器不混入正文 |
| A2 非流式 | 在你选择的非流式设置再生成一轮 | 完成后正文自动刷新；MVU 保存后人物栏自动更新，无需“重新读取” |
| A3 全屏接管 | 保持全屏连续生成，再返回/Escape 后用原生输入生成并重新进入 | 新消息 iframe 接管后保持全屏与样式；退出界面期间仍能同步最新内容 |
| A4 历史/滚动 | 回看旧轮，或在最新长文中向上滚动；此时有新内容到达 | 不抢回最新/不强行滚到底；主动返回最新或滚到底后才继续跟随 |
| A5 草稿/停止 | 草稿未发送时切轮/切模式；生成中停止，或遇网络失败 | 已收正文和草稿保留，不自动重发；状态未确认时暂停下一轮；普通回复结束后正常同步 |
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
- 当前人物/背景仍为几何占位，public 原图未打包，未安装 Illustration-Gremlin。轻前端与正式图包不属于成品 A。
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
- HTML：${htmlUrl}（实际使用仍需要酒馆助手消息 iframe 上下文）
- MVU 和 Zod 注册沿用固定提交 CDN；本包不是全离线包。

地址由 ${resolve(root, 'delivery.config.mjs')} 管理，允许的酒馆来源：${hostOrigins.join('、')}。
当前仅监听电脑 127.0.0.1；手机同名地址指手机自己，本次未开放局域网。窄屏检查不等于真实手机资源可达。
没有创建远程仓库、Git 写入、部署或发布；新包和旧包分别保留。
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
console.log(`P2 package: artifacts/${name}.json\nGuide: artifacts/${name}.md\nRuntime: dist/${runtime}/\nSHA256 ${hash}\nTests not run; host loading and user acceptance pending.`);
