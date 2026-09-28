import { readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCard } from '../src/card.ts';
import { cardName } from '../src/card-content.ts';
import { createLiveLoader } from './live-loader.mjs';
import { assetBaseUrl } from '../delivery.config.mjs';

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
const imageManifest = JSON.parse(imageManifestText) as { source: 'development' | 'gremlin'; images: { name: string; source: string; path?: string; bytes?: number }[] };
if (!['development', 'gremlin'].includes(imageManifest.source)) throw Error('Unknown image source in build output');
const stateUrl = new URL('state.js', base).href;
const liveHtmlUrl = new URL('live/state.html', base).href;
// Load into the existing Helper iframe so its message identity and APIs stay intact.
const attribute = (url: string) => url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const stateHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style id="dlnm-nvl-style">${stateCss.replace(/<\/style/gi, '<\\/style')}</style><style>html,body{margin:0;background:#111;color:#eee}#dlnm-state{min-height:44px}</style></head><body><div id="dlnm-state">正在加载 NVL 阅读界面…</div><script data-dlnm-entry src="${attribute(stateUrl)}" onerror="document.getElementById('dlnm-state').textContent='阅读界面加载失败，请检查资源地址与网络。'"></script></body></html>`;
const loaderScript = `// Pinned MVU runtime for this card.
void (async () => {
  if (getCurrentCharacterName() !== ${JSON.stringify(cardName)}) return;
  // Always start this card's pinned lifecycle; MVU's unique-script registry chooses the active instance.
  await import('https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate@183d8ade3b9a3369e824a55cb13b4ddf91aada50/artifact/bundle.js');
})().catch(error => console.error('[DLNM MVU] 加载失败', error));`;
// Embed the matching schema: schema/content updates travel together, without a cached remote module.
const card = createCard({ schemaScript: schemaBundle, loaderScript, stateHtml: createLiveLoader(liveHtmlUrl) });
const content = JSON.stringify(card, null, 2) + '\n';
const name = `dlnm-${imageManifest.source}`;

// Only these stable outputs are replaced; historical version directories stay untouched.
const outputs = new Map([
  ['dist/live/state.html', stateHtml],
  [`artifacts/${name}.json`, content],
  ['artifacts/dlnm-sync.json', content],
]);
if (imageManifest.source === 'gremlin') {
  // Exact publication allowlist: never copy the entire local dist tree or development images.
  const release = new Map([
    ['schema.js', schemaBundle], ['state.js', stateBundle], ['state.css', stateCss],
    ['live/state.html', stateHtml], ['image-manifest.json', imageManifestText],
    ['dlnm.json', content], ['README.md', readFileSync(resolve(root, 'README.md'), 'utf8')],
    ['index.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DLNM 发布资源</title><body><main><h1>DLNM · Gremlin 版</h1><p>这是角色卡与前端资源下载页。聊天界面在 SillyTavern 内运行。</p><ul><li><a href="./dlnm.json" download>下载角色卡 JSON</a></li><li><a href="https://github.com/henryd2341/dlnm#readme">使用说明</a></li><li><a href="./image-manifest.json">图片命名清单</a></li></ul></main></body></html>\n`],
  ]);
  for (const [relative, value] of release) outputs.set(`artifacts/release/${relative}`, value);
}
for (const [relative, value] of outputs) {
  const path = resolve(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}
console.log(`Card: artifacts/${name}.json\nRuntime: dist/\nLive UI: ${liveHtmlUrl}\nSync input: artifacts/dlnm-sync.json\n${imageManifest.source === 'gremlin' ? 'Pages / ZIP contents: artifacts/release/\n' : ''}Host loading and user acceptance pending.`);
