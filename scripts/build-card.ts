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
const instructions = `# DLNM P2 R2：浏览器全屏、样式与 YAML 初始化修订包

状态：P1 已由用户接受；本包 P2 待用户手动验收，P3～P5 尚未启动。
R1 的初值读取、全屏形态与样式未通过手验；本包修订这三项，不代表已在你的酒馆实测消失。开场应自动初始化，不需要补发聊天消息。
本次只构建、打包；测试、类型检查、lint、浏览器操作、真实酒馆运行与模型调用均未执行。
两位主角头像和宅邸 / 城市场景使用 CSS / SVG 几何占位图，界面持续标注；这不是正式角色美术，也未复制游戏素材。

## 文件与启动

- 导入文件：${name}.json；JSON SHA256：${hash}。
- 配套资源：项目 dist/${runtime}/ 下的 schema.js、state.js、state.css、state.html。ZIP 内保留 ${runtime}/ 目录；恢复时将此目录放回项目 dist/ 下，原有不同版本目录保持原样。
- 在 PowerShell 执行：Set-Location -LiteralPath '${root.replaceAll("'", "''")}'; npm run dev
- Vite 地址：${devOrigin}/。保持终端开启，停止时按 Ctrl+C；端口占用会直接报错，不会偷偷换端口。
- Vite 仅托管已构建的 dist 文件。修改源码后重新执行 npm run build，导入新生成的卡包；仅刷新旧卡仍使用原先固定版本。
- npm run pack 只组装已有构建产物；平常改源码应使用 npm run build。两者均不串联测试。

## 手动导入与检查

1. 先导出保留原卡与聊天；在专用对象操作，遇到同名卡或世界书先确认，勿直接覆盖原对象。卡名保持 DLNM-P1-香气链路，版本为 p2-nvl-r2；沿用名字是为了脚本识别目标，不代表拿旧 P1 包交付。
2. 用酒馆导入上述 JSON，导入并链接内嵌的 DLNM-P1-香气链路-世界书-R2，不覆盖旧世界书。世界书单独加 -R2，既避免覆盖冲突，也避免同名旧条目或旧初始化标记混入。本卡必要的角色正则与两项脚本需由你确认启用。旧原生变量探针保持停用，既有聊天不自动迁移。
3. 修订卡的独立新开场应自动得到初值，无需发送消息或调用模型。保留 [initvar] 条目的提示禁用状态：MVU 仍会读取它，禁用只是避免把初值当常驻提示。条目现在是 YAML，由原来同一份 19 字段初值生成，数值未变。运行脚本每次进入本卡都加载固定 MVU 入口，由上游唯一实例机制处理已有 MVU，而不是见到一个 Mvu 全局就跳过启动。新版开场继续带隐藏空更新块，界面仅在真实 stat_data 保存后显示人物数据。
   - 若显示“未绑定主世界书”：在酒馆链接导入的本卡世界书，保留已有对象，不靠启用 initvar 提示解决。
   - 若显示“字段未通过校验”：按提示字段核对实际数据与本卡 19 字段；保留原存档，不自动重置或塞入默认值。
   - 若找到 initvar 但仍无初值：核对 MVU 与 Schema 两项脚本的加载提示，点“重新读取”；保留完整的界面报错反馈。
   - 旧聊天的开场文字、待同步标记和已有数据不被本包自动迁移；新包 first_mes 只对新开场生效。
4. 点击“浏览器全屏阅读”，同步调用 Fullscreen API 的 requestFullscreen()，进入浏览器真正的全屏模式，而非仅铺满网页。浏览器要求由点击触发，所以加载时显示入口，不自动冒充全屏。人物栏和正文分开；界面仍由原消息 iframe 驱动，显示内容在宿主隔离层内，不移动 iframe、不复制聊天。R2 HTML 内封装本卡编译 CSS，全屏直接复制这份带唯一标记的样式，不再误取 Helper 的第一张外部样式表。
5. “面板模式”才使用旧版嵌入 chat 的布局；可手动切回浏览器全屏。“返回酒馆”或 Escape 退出本卡全屏并关闭阅读层；原生界面保留，在最新回复入口重新进入。新回复替换消息 iframe 时复用已进入的浏览器全屏；全页刷新后需再次点击。不支持该 API 或浏览器阻止时显示原因，由你选择面板模式。模式随本浏览器的聊天会话保存。原生输入框已有不同草稿时停止发送，不覆盖；斜杠命令留在原生输入框。
6. 用“前一轮 / 后一轮 / 历史 / 返回最新”核对正文与人物状态属于同一消息、当前分支；历史页停用发送，不修改游戏状态。输入草稿后切轮、切模式、刷新并核对草稿和阅读位置。
7. 如你选择体验真实生成：仅点击一次发送，核对只产生一条玩家消息；确认酒馆接收且文本一致后才清空相同草稿。若宏或扩展改写文本则保留草稿并提示自行核对；失败或超时不自动重发。停止按钮走酒馆原生停止；无效 MVU 更新阻止下一轮，修复和复杂异常留 P3。
8. 桌面及窄屏分别核对长文、人物栏、44px 按钮、焦点和 Escape；手机还需核对软键盘遮挡、窗口高度和退出操作。当前仅回环资源地址，窄屏模拟不算真实手机验收（见下节）。
9. 记录问题和实际结果，由你决定 P2 是否通过；确认之前不进入 P3。不为单独证明酒馆能回复而额外发模型请求。

卡内已携带：5 个世界书条目、3 条角色正则、2 项脚本入口。Schema 和界面代码按下列地址加载，初始字段由同一份 Schema 初值生成。
- Schema：${schemaUrl}
- 界面脚本：${stateUrl}
- 界面样式：${styleUrl}（同份编译 CSS 已封装进 HTML，避免额外样式请求和错误选表）
- HTML 入口：${htmlUrl}（独立打开只用于查看资源；实际 MVU 与消息身份需要酒馆助手的 iframe 上下文）。
- MVU 与注册组件继续使用源码中既有的固定提交 CDN 地址；本包不是全离线包。

## 地址与边界

- 地址集中在项目 delivery.config.mjs：devOrigin 管本机服务，assetBaseUrl 管卡包资源根地址，hostOrigins 管允许跨源加载的酒馆地址。
- 当前允许的酒馆来源：${hostOrigins.join('、')}。自定义端口需明确补入该配置后重启服务；保持精确来源列表。
- 当前仅监听电脑的 127.0.0.1；手机的同名地址指手机自身，手机/远程/HTTPS 酒馆加载本机 HTTP 资源尚未验收，本次未开放局域网。
- 远程仓库建好并取得发布许可后，再将 assetBaseUrl 指向实际可直接返回文件的版本化资源目录（不是仓库网页），保留 ${runtime}/ 等产物目录层级并重新打包。当前未创建仓库、提交、推送或部署。
- 现有 Schema、MVU 回滚、字段、组件身份及历史包保留；构建成功不等于真实加载或用户验收通过。
- 界面只以纯文本显示真实回复，Markdown 标记暂按原文本展示；不运行消息里的 HTML。只展示当前已选分支，换分支/编辑/重生成仍在酒馆原生界面完成。
- 草稿和阅读位置是当前浏览器会话记录，不是聊天存档；不跨设备同步。正文、分支、MVU 状态和存档仍由酒馆管理。
- 历史一次线性读取；全屏保持原生 chat 布局原样，仅手动选择面板模式才做可恢复的 CSS 隐藏。尚无长聊天性能证据；未引入虚拟列表或第二套聊天缓存。
- 运行适配按本机 SillyTavern 1.17.0 / 酒馆助手 4.11.0 源码制作；DOM、事件先后及手机布局仍待实用确认。群聊不在此原型范围。
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
