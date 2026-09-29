# 魔族大小姐与女仆的30天·续

面向 SillyTavern 的同人角色卡。玩家扮演诺雅，与莉莉希雅继续共同生活；卡内包含世界书、MVU Zod 状态、人物状态栏和全屏阅读界面。

## 下载与使用

首次成功部署后可使用：

- [角色卡 JSON](https://henryd2341.github.io/dlnm/dlnm.json)
- [发布资源页](https://henryd2341.github.io/dlnm/)
- [图片命名清单](https://henryd2341.github.io/dlnm/image-manifest.json)
- [Actions 构建记录](https://github.com/henryd2341/dlnm/actions)：打开成功的构建，在 Artifacts 下载 `dlnm-gremlin` ZIP。

1. 在 SillyTavern 安装并启用酒馆助手（Tavern Helper / JS-Slash-Runner）。前序开发使用 SillyTavern 1.17.0 与酒馆助手 4.11.0，其他版本需自行验证。
2. 世界书含 EJS 模板片段，需要启用兼容的提示词模板扩展（Prompt Template）；仅安装角色卡不代表模板已生效。
3. 导入 JSON，检查角色绑定世界书 `DLNM-世界书`，允许角色自带的 3 条正则和 3 个助手脚本执行。`[initvar]` 初值条目默认禁用，保持此设置。
4. 安装 [Illustration-Gremlin](https://github.com/pokerface-1224/Illustration-Gremlin)，为当前整张角色卡导入自己的图片包，文件名按图片清单整理。
5. 新建聊天，确认初始状态出现，再尝试进入全屏阅读。网页资源页只是下载入口，完整界面依赖 SillyTavern 宿主。

本卡已包含世界书、正则、Schema 注册代码与 MVU 加载脚本；无需另装本地 Zod。MVU 运行组件及其 Schema 工具仍从固定版本的第三方 CDN 加载，因此需要联网。扩展安装、用户图包及真实宿主效果不由构建过程代办。

第 3 个助手脚本“DLNM · 仅保留最新楼层”使用原生 JS，在脚本加载时移除聊天区域中非最新楼层的页面元素；切换聊天文件时重载自身。它只操作页面，不删除聊天记录或 MVU 数据，也不持续监听每条新消息；尚未找到最新楼层时保持页面原样。需要查看完整原生楼层时，停用该脚本后重新打开聊天。

## Gremlin 图片

默认只使用 Gremlin 当前角色图包，缺少扩展或图片时显示提示，正文和人物数值继续保留；此模式不读取本项目的开发占位图片。

- 四个人物和场景图片均放在**同一张卡的图包**中，不是分别建立四张角色卡。
- 共 55 个逻辑文件名：49 张人物图、6 张场景图。例如 `noah__blush_underwear.png`、`tanuki__smile.png`、`bg__living_day.png`。完整名称以 `image-manifest.json` 的 `images[].name` 为准；其中 `source` 仅为开发参照。
- 使用唯一文件名，避免同一图包出现多个同名逻辑图片。Gremlin 按卡名隔离图包，应避免重复卡名。
- 导图、更新或删除图片后，点击界面的“重新读取状态与图片”。本项目不分发开发图片，也不自动安装或配置扩展。

## 构建与检查

需要 Node.js 24 与 npm。在仓库根目录执行：

```sh
npm ci
npm run release
```

`release` 顺序执行类型检查、现有测试、Vite Schema/UI 构建、JSON 打包及发布产物检查。任一步失败都会停止。当前没有单独的 ESLint 配置；类型检查和测试不冒充 lint。

| 输出 | 用途 |
| --- | --- |
| `artifacts/dlnm-gremlin.json` | 可导入的 Gremlin 角色卡 |
| `artifacts/dlnm-sync.json` | 本地同步工具的固定输入 |
| `dist/` | 本次构建资源；本地还可能保留旧版本目录 |
| `artifacts/release/` | 经明确清单选出的 Pages/ZIP 内容，含卡 JSON、README 和运行资源 |

发布只上传 `artifacts/release/`，省去本地旧版本目录、开发图片、测试、原作参考资料和内部文档。发布检查会拒绝额外文件。构建会覆盖当前固定名称产物，原有带版本目录的历史成品保持原样。

需要本地 ZIP 时，Windows PowerShell 在仓库根目录执行：

```powershell
Compress-Archive -Path artifacts/release/* -DestinationPath artifacts/dlnm-gremlin.zip -Force
```

## GitHub Pages 自动部署

本项目独立部署在 `dlnm` 仓库；现有 `henryd2341.github.io` 主站保持原样。主站参考实现是 README/Jekyll 的分支发布，本项目则需要 Node 构建，采用自定义 Actions。

首次启用：进入 [dlnm 的 Pages 设置](https://github.com/henryd2341/dlnm/settings/pages)，在 **Build and deployment → Source** 选择 **GitHub Actions**。

之后每次推送 `main`，工作流自动安装锁定依赖、检查、构建 Gremlin 包并部署。也可从 Actions 手动运行；其他分支的手动构建只生成产物，部署限于 `main`。构建任务只有仓库读取权限，部署任务使用 Pages/OIDC 权限，无需个人访问令牌。

固定资源根地址为 `https://henryd2341.github.io/dlnm/`；固定前端入口为 `https://henryd2341.github.io/dlnm/live/state.html`。自有文件名、目录及加载 URL 都不加内容 Hash 或缓存破坏查询参数。前端加载器分别以 `no-store` 请求 HTML 和 JS；Pages/CDN 刷新仍有传播时间，不保证推送瞬间生效。第三方依赖的固定版本引用继续保留。

GitHub 部署记录中的提交 ID、Actions 缓存键和传输校验值属于平台机制，不参与自有资源命名。工作流部署的是 Pages，并不会自动创建 GitHub Release 标签。

`dist/` 与 `artifacts/` 继续由 Git 忽略。忽略规则只影响当前文件跟踪，普通推送仍会包含本地已有提交历史；首次公开前请确认历史中的开发文档是否符合预期。

## 更新与本地开发

- **从旧 localhost 卡迁移：**先等 Pages 部署成功，再导入新版卡，或按下述同步方式更新已有卡。旧卡内的地址不会因网站部署自动改变。
- **仅前端变化：**推送并等待部署成功，然后刷新酒馆或重新渲染消息。已打开的界面不会在阅读、输入或生成中强制重载。
- **正文、世界书、正则、Schema 或加载器变化：**重新导入新 JSON，或使用本地同步工具。Schema 随卡内嵌，与该版字段合同一起更新。
- **已有聊天：**沿用现有 24 字段的聊天不自动重置；新版开场请用新聊天体验。更早结构的聊天不自动迁移。

本地同步前检查 `delivery.config.mjs` 中的 `tavernOrigin` 和 `characterFile`，后者是已有角色的 PNG 文件名，不是显示名。默认仍是 `DLNM-P1-香气链路.png`。然后按需执行 `npm run sync:push`；该命令会构建并覆盖指定角色属性及整本绑定世界书。它和 Git 推送是两回事，CI 不执行此命令。需要会话 Cookie 时通过环境变量 `TAVERN_COOKIE` 提供，勿写进源码。

如需回到本机开发服务，在同一 PowerShell 窗口执行：

```powershell
$env:DLNM_ASSET_BASE_URL='http://127.0.0.1:5173/'
# 可选：只有本地持有 public 开发图片时才启用下一行
# $env:DLNM_IMAGE_SOURCE='development'
npm run build
npm run dev
```

将本次生成的卡导入专用测试聊天。前端代码变化后重新构建再刷新；这里服务的是构建产物，不是源码热更新。恢复发布前清除覆盖值，再运行 `npm run release`：

```powershell
Remove-Item Env:DLNM_ASSET_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:DLNM_IMAGE_SOURCE -ErrorAction SilentlyContinue
```

## 来源与验收边界

本项目为同人创作。开发参考图片不随仓库或发布包分发；使用者自行准备合适的图片。README 不授予第三方原作或素材的再分发许可。

界面月亮图标来自 [Font Awesome Free 6.7.2 Moon](https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/solid/moon.svg)，Copyright 2024 Fonticons, Inc.，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；归属信息也保留于 SVG metadata。

离线检查与构建证明源码和产物通过相应检查，不代表线上 Pages、远程依赖执行、Gremlin 图包、世界书模板、手机全屏或旧聊天已验收。首次部署后仍需在实际酒馆中验证这些边界。
