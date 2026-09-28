import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createLiveLoader } from './live-loader.mjs';

// Run the loader and a trivial script fixture, never the real UI or a network request.
async function load(options: { foreign?: boolean; htmlFailed?: boolean; jsFailed?: boolean; empty?: boolean;
  abort?: boolean; missing?: 'style' | 'root' | 'entry' | 'path'; scriptFailure?: 'runtime' | 'syntax' } = {}) {
  const requests: { url: string; options: RequestInit }[] = [];
  const scripts: { textContent?: string; src?: string }[] = [];
  const errors: unknown[] = [];
  const root = { textContent: '', replaceWith() {} };
  let pagehide = () => {};
  const listeners = new Map<string, (event: object) => void>();
  const html = createLiveLoader('https://example.test/dlnm/live/state.html');
  const code = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  runInNewContext(code, {
    AbortController, URL,
    console: { error: (...args: unknown[]) => errors.push(args) },
    window: {
      addEventListener: (event: string, callback: () => void) => {
        if (event === 'pagehide') pagehide = callback;
        else listeners.set(event, callback);
      },
      removeEventListener: (event: string) => listeners.delete(event),
    },
    document: {
      getElementById: () => root,
      importNode: (node: unknown) => node,
      createElement: () => ({}),
      head: { append() {} },
      body: { append: (script: { textContent: string }) => {
        scripts.push(script);
        try { runInNewContext(script.textContent, { UI_SOURCE() {} }); }
        catch (error) { listeners.get('error')?.({ error }); }
      } },
    },
    DOMParser: class {
      parseFromString() {
        return {
          getElementById: (id: string) => (options.missing === 'style' && id === 'dlnm-nvl-style')
            || (options.missing === 'root' && id === 'dlnm-state') ? null : {},
          querySelector: () => options.missing === 'entry' ? null : ({ getAttribute: () => options.missing === 'path'
            ? null : options.foreign ? 'https://other.test/state.js' : 'https://example.test/dlnm/state.js' }),
        };
      }
    },
    fetch: async (url: string | URL, init: RequestInit) => {
      requests.push({ url: String(url), options: init });
      if (requests.length === 2 && options.abort) pagehide();
      const failed = requests.length === 1 ? options.htmlFailed : options.jsFailed;
      return {
        ok: !failed, status: failed ? 503 : 200, url: String(url),
        text: async () => requests.length === 1 ? '<html></html>' : options.empty ? ''
          : options.scriptFailure === 'runtime' ? 'throw new Error("boot failed")'
          : options.scriptFailure === 'syntax' ? 'const = broken' : 'UI_SOURCE();',
      };
    },
  });
  await new Promise(setImmediate);
  return { requests, scripts, errors, root, listeners };
}

const success = await load();
assert.equal(success.requests.length, 2, 'fetch both fixed HTML and JS without browser-cache reuse');
for (const request of success.requests) {
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.redirect, 'error');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(new URL(request.url).search, '');
}
assert.equal(success.scripts.length, 1);
assert.equal(success.scripts[0].textContent, 'UI_SOURCE();');
assert.equal(success.scripts[0].src, undefined);
assert.equal(success.errors.length, 0);
assert.equal(success.listeners.size, 0);
for (const options of [{ foreign: true }, { htmlFailed: true }, { jsFailed: true }, { empty: true },
  ...(['style', 'root', 'entry', 'path'] as const).map(missing => ({ missing }))]) {
  const result = await load(options);
  assert.equal(result.scripts.length, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.root.textContent, /加载失败/);
}
for (const scriptFailure of ['runtime', 'syntax'] as const) {
  const result = await load({ scriptFailure });
  assert.equal(result.scripts.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.root.textContent, /加载失败/);
  assert.equal(result.listeners.size, 0, 'remove temporary global error listener after execution');
}
const aborted = await load({ abort: true });
assert.equal(aborted.scripts.length, 0);
assert.equal(aborted.errors.length, 0);
console.log('Loader checks passed: fixed URLs, no-store HTML/JS, foreign source, both HTTP failures, malformed HTML, empty JS, pagehide, script errors and cleanup.');
