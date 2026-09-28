# 命令行推送与动态前端

本项目参照 `E:\PersonalAI\archived\tavern_helper_template\tavern_sync.mjs` 的“本地内容覆盖酒馆”方式，直接调用现有 SillyTavern HTTP 接口。不复制模板的 Webpack、YAML 维护层、Socket.IO 服务或浏览器接收脚本，不增加依赖。

世界书按本地内容**整本覆盖**。没有内容差异检查、目标枚举、推送后回读、自动重试或备份目录。保留 HTTP 失败提示和酒馆自己的认证、CSRF 防护。这里的 HTTP 接口是酒馆自带的本机更新入口，不是模型 API，不产生模型请求。

## 1. 一次性接入

项目目录：`E:\PersonalAI\archived\SmallProjects\demon_lily_and_the_noir_maid`。

1. 保持酒馆运行。编辑 `E:\PersonalAI\archived\SmallProjects\demon_lily_and_the_noir_maid\delivery.config.mjs`：
   - `tavernOrigin`：默认 `http://127.0.0.1:8000`。
   - `characterFile`：**已经存在的角色 PNG 文件名**，默认 `DLNM-P1-香气链路.png`。重复导入过的卡可能带数字后缀，填要维护的那张卡的实际文件名；脚本直接使用它，不按显示名猜测。可从浏览器中该角色头像请求的 `file` 参数取得。
   - `assetBaseUrl`：保持当前 `http://127.0.0.1:5173/`。以后换资源服务器才调整。
2. 一个终端启动资源服务：

   ```powershell
   Set-Location -LiteralPath 'E:\PersonalAI\archived\SmallProjects\demon_lily_and_the_noir_maid'
   npm run dev
   ```

3. 另一个终端进入同一目录，首次推送：

   ```powershell
   npm run sync:push
   ```

   该命令先执行现有构建/装配，再更新现有角色。无需重新导入卡、另装同步接收脚本或开启 6620 端口。若酒馆里还没有该角色，先导入构建出的卡 JSON 一次；同步入口只更新现有卡，不自动创建重复卡。

4. 刷新酒馆页面，令它重新读取角色、世界书、正则和脚本。首次推送将旧前端入口替换为固定地址；之后每次重建前端都省去推送和导入。

可单次指定另一份现有角色文件：

```powershell
npm run sync:push -- --avatar '实际文件名.png'
```

有登录认证的酒馆需要已有登录会话；可在当前终端的 `TAVERN_COOKIE` 环境变量中传入 Cookie，脚本只在内存中使用，不打印或落盘。不要提交 Cookie。401/403 时处理登录与现有认证设置，保持 CSRF 防护开启；本轮没有读取你的登录资料。

## 2. 以后怎么更新

| 修改内容 | 命令 | 酒馆端 |
| --- | --- | --- |
| 人物设定、开场、世界书、正则、Helper 脚本或 Schema | `npm run sync:push` | 完成后刷新页面，不重复导入 |
| Vue 界面、样式、前端显示逻辑 | `npm run build` | 刷新页面或重新渲染消息，不推送卡 |
| 仅推送上次已经构建的内容 | `npm run sync -- push` | 使用当前 `artifacts/dlnm-sync.json`，不会自动编译源码 |

HTTP 顺序固定为：获取当前请求的 CSRF token → 覆盖指定世界书 → 更新指定角色文件。角色更新包括内嵌世界书、绑定书名、创作字段、完整正则数组和完整脚本数组；未指定的宿主字段保留。头像继续取同一 PNG 的图像，酒馆可能重新编码 PNG；聊天文件、swipe、MVU 消息变量不在推送目标中。修改开场只影响卡的开场定义，不重写已有聊天第 0 楼。

世界书先成功、卡更新后失败时会明确报告部分完成。修正文件名或连接后再次执行同一命令；不自动撤销，也不伪装成整体成功。推送期间避免在酒馆编辑同一张卡/书，结束后刷新，防止浏览器里的旧编辑内容再保存回去。

前端固定入口：`http://127.0.0.1:5173/live/state.html`。卡内仅留一个异步加载器，以 `no-store` 读取此 HTML，取出本卡样式与入口 JS，在**原酒馆助手消息 iframe** 内挂载；保留所在消息身份、Helper 全局接口和 `dlnm-nvl-style` 全屏样式来源。HTML 内指向同次构建的版本 JS，先生成完整资源再更新固定入口。已经打开的界面不会在输入、生成或全屏阅读中被强制换代；重新渲染/刷新后读取新版。这是异步资源加载，不是源码保存即生效的 HMR。

`npm run dev` 仍只服务 `dist`；卡文本留在 `artifacts`，不随资源服务公开。当前仅本机可达，手机的 `127.0.0.1` 指手机自己，局域网地址配置留到相应阶段。

## N4 更新注意

- 当前 Schema 是 `world/noah/lilicia/seraphina/tanuki` 共 24 字段。此次涉及 Schema/世界书，执行 `npm run sync:push` 后新建聊天；只刷新前端还未更新卡内旧 Schema。旧聊天不迁移、重置或删除。
- `delivery.config.mjs` 的 `imageSource` 明确选择 `development` 或 `gremlin`。默认开发来源只服务55张选用的哈希副本；正式来源只读用户自行安装的 Illustration-Gremlin 当前卡图包，绝不回退 public。
- 若用环境变量覆盖，在同一 PowerShell 中先 `$env:DLNM_IMAGE_SOURCE='gremlin'`，然后执行构建或推送；以后每次构建同样保持该选择。长期使用可直接改配置。运行前端显示每张图的来源。
- 导入、更新或删除图包后点击“重新读取状态与图片”。实际 API 没有公开图片变更事件；本卡省去额外轮询或猜测事件，不释放扩展拥有的共享 Blob URL。
- 完整唯一名称清单、来源切换和 B1～B10 手验见 NEXT.md 的 N4 交付记录。本轮仅本地构建打包，没有真实推送或安装。

### N5 内容更新补充

N5 于 2026-09-28 构建为成品 C 开发图候选，随后继续迭代全屏界面；当前版本、JSON 指纹和资源目录统一见 NEXT.md。`artifacts/dlnm-sync.json` 与固定前端均随最近一次构建更新。已完成 C 内容同步的角色可直接刷新／重渲染加载月牙、统一滚动条、独立背景和窄屏折叠左侧栏，本轮代理未执行宿主推送。卡显示名为“魔族大小姐与女仆的30天·续”，绑定书名为“DLNM-世界书”，共 16 条（5 条技术、11 条叙事），含 34 段中文语料；最新 JSON 同时保留用户自行整理的世界书 XML 包裹，后者进入宿主仍需内容同步。`characterFile` 仍是既有 PNG 文件名，显示名变化与头像文件名分开处理；构建期间保持该配置原值。

固定前端入口现已更新，前端、Schema 注册和 MVU 加载器统一识别上述新卡名。旧宿主卡在内容同步前刷新时会受到身份检查限制；实际继续使用新版需完成卡片和世界书同步，单独刷新前端只更新资源。后续获准时可用 `npm run sync -- push` 推送这次已构建的内容，或用 `npm run sync:push` 重新构建后推送；本轮两个命令均未执行。已有 N4 的 24 字段聊天保留原消息及变量，新开场用于新聊天；改名后的实际绑定、初始化、条目命中与宿主预算仍待手验，证据见 NEXT。

## 3. 本地 Git 备份

- 前置同步阶段改动前工作树干净，当时提交 `886753b`（`feat: light weighted plain status`）作为基线。额外标签写入请求未获执行，没有创建新标签或备份目录。
- 后续用本地 Git 提交维护源码版本；构建产物仍按项目现有规则忽略。Git 保存的是已提交源码，未提交改动和酒馆聊天存档不自动获得备份。
- 回滚时恢复选定 Git 版本的源码再构建、推送。回退到接入同步前的版本时，该版本尚无本命令，需要使用它原有的打包/导入流程。
- `live` 地址始终指向最近一次构建；旧 JSON 使用同一动态入口，不等于冻结旧前端。恢复旧前端应恢复相应源码再构建，而不是只换一个旧 JSON 文件。

## 4. 来源与验收边界

- 模板参考：`E:\PersonalAI\archived\tavern_helper_template\tavern_sync.mjs`，本地模板提交 `4a9344276d925a83e32726c58b9b05debdf4a8ad`；本项目脚本是适配实现，不是上游原文件。
- 2026-09-27 只读 GET `/version`：宿主 SillyTavern 1.17.0 / release / `aa50edcf4`。对应提交的 [角色字段合并接口](https://github.com/SillyTavern/SillyTavern/blob/aa50edcf4/src/endpoints/characters.js)、[deepMerge 数组替换语义](https://github.com/SillyTavern/SillyTavern/blob/aa50edcf4/src/util.js)、[整本世界书写入](https://github.com/SillyTavern/SillyTavern/blob/aa50edcf4/src/endpoints/worldinfo.js)、[CSRF 会话机制](https://github.com/SillyTavern/SillyTavern/blob/aa50edcf4/src/server-main.js) 已只读核对。
- 世界书转换依据实际宿主的 `public/scripts/world-info.js` 中 `convertCharacterBook`。没有改动宿主源码、设置或认证。
- 构建只证明本地编译和装配。首次推送、登录模式、资源异步执行、浏览器全屏、刷新后持久化仍待真实酒馆手验；代理本轮没有执行 POST、浏览器或模型操作。
- `npm run check:sync` 是另行提供的可选本地检查，只使用内存请求替身，不接触酒馆；默认构建/推送不调用它，本轮按要求不运行测试、类型检查或 lint。
- Library 路由：`sillytavern-card-pipeline`，快照 `2026-08-18`，采用 A0/A2/D1/D4 的对应边界；未采用设计候选。N5 当前已本地构建，宿主同步与手验仍待执行，最新证据见 NEXT.md。
