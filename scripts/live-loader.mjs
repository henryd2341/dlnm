// Keep Tavern Helper's existing message iframe and globals; only replace our UI root.
export function createLiveLoader(htmlUrl) {
  const url = JSON.stringify(htmlUrl).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0;background:#111;color:#eee}#dlnm-state{min-height:44px}</style></head><body><div id="dlnm-state">正在加载阅读界面…</div><script>
(() => {
const controller = new AbortController();
window.addEventListener('pagehide', () => controller.abort(), { once: true });
const showError = error => {
  if (controller.signal.aborted) return;
  document.getElementById('dlnm-state').textContent = '阅读界面加载失败，请检查资源地址与网络后刷新酒馆。';
  console.error('[DLNM UI]', error);
};
void (async () => {
  const options = { cache: 'no-store', redirect: 'error', credentials: 'omit', signal: controller.signal };
  const response = await fetch(${url}, options);
  if (!response.ok) throw Error('HTTP ' + response.status);
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  if (controller.signal.aborted) return;
  const style = page.getElementById('dlnm-nvl-style');
  const root = page.getElementById('dlnm-state');
  const entry = page.querySelector('script[data-dlnm-entry]');
  if (!style || !root || !entry) throw Error('前端资源缺少样式、挂载点或入口');
  const path = entry.getAttribute('src');
  if (!path) throw Error('前端入口地址为空');
  const source = new URL(path, response.url);
  if (source.origin !== new URL(${url}).origin) throw Error('前端入口来源不匹配');
  const bundle = await fetch(source.href, options);
  if (!bundle.ok) throw Error('JS HTTP ' + bundle.status);
  const code = await bundle.text();
  if (controller.signal.aborted) return;
  if (!code.trim()) throw Error('前端入口内容为空');
  document.head.append(document.importNode(style, true));
  document.getElementById('dlnm-state').replaceWith(document.importNode(root, true));
  const script = document.createElement('script');
  script.textContent = code;
  // Inline classic scripts execute during append; their exceptions dispatch on window.
  const scriptError = event => showError(event.error || new Error(event.message));
  window.addEventListener('error', scriptError);
  try { document.body.append(script); }
  finally { window.removeEventListener('error', scriptError); }
})().catch(showError);
})();
</script></body></html>`;
}
