import { createMessageRenderer, visibleBody } from '../src/message-display.ts';

const equal = (actual: string, expected: string) => { if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`); };
const matches = (value: string, pattern: RegExp) => { if (!pattern.test(value)) throw new Error(`expected ${JSON.stringify(value)} to match ${pattern}`); };
const excludes = (value: string, pattern: RegExp) => { if (pattern.test(value)) throw new Error(`expected ${JSON.stringify(value)} to exclude ${pattern}`); };

const update = '<UpdateVariable><Analyze>事实</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>';
equal(visibleBody(`正文\n${update}\n<StatusPlaceHolderImpl/>`), '正文');
equal(visibleBody('正文<UpdateVariable><Analyze>流式半截'), '正文');
equal(visibleBody('正文<Analyze>流式半截'), '正文');
equal(visibleBody('正文<JSONPatch>[{"op":'), '正文');
equal(visibleBody('正文<UpdateVari'), '正文');
equal(visibleBody('正文<StatusPlaceHol'), '正文');
equal(visibleBody('正文\n```xml\n<UpdateVariable><Analyze>代码包装</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>\n```'), '正文');
equal(visibleBody('正文\n```xml\n<UpdateVariable><Analyze>未闭合技术块'), '正文');
equal(visibleBody('正文 `<UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>`'), '正文');
equal(visibleBody('```html\n<span onclick="demo()">普通标签字面演示</span>\n```'), '```html\n<span onclick="demo()">普通标签字面演示</span>\n```');
equal(visibleBody('`<iframe>普通标签字面演示</iframe>`'), '`<iframe>普通标签字面演示</iframe>`');
equal(visibleBody('正文\n```html\n<!DOCTYPE html>\n<script>document.write(new TextDecoder().decode(Uint8Array.from(atob("QUJD"),c=>c.charCodeAt(0))));</script>\n```'), '正文');
equal(visibleBody('正文\n<!DOCTYPE html>\n<script>document.write(new TextDecoder().decode(Uint8Array.from(atob("QUJD"),c=>c.charCodeAt(0))));</script>\n后文'), '正文\n\n后文');
equal(visibleBody('正文\n<!DOCTYPE html>\n<script>document.write(new TextDecoder().decode(Uint8Array.from(atob("QU'), '正文');

/** Run manually in the target browser; this file deliberately needs no DOM shim or added package. */
export function checkMessageRendererInBrowser(host: Window) {
  const render = createMessageRenderer(host);
  const safe = render('**加粗**\n\n<span style="color: #9bc7ff">月光</span>\n\n[链接](https://example.com)');
  matches(safe, /<strong>加粗<\/strong>/);
  matches(safe, /<span style="color: #9bc7ff">月光<\/span>/i);
  matches(safe, /href="https:\/\/example\.com\/?"/i);
  matches(safe, /target="_blank"/);
  matches(safe, /rel="noopener noreferrer"/);
  const redirected = render('<a href="https://example.com" target="_top" rel="opener">链接</a>');
  excludes(redirected, /target="_top"|rel="opener"/);
  matches(redirected, /target="_blank"/);

  const hostile = render('<iframe srcdoc="x"></iframe><img src=x onerror=alert(1)><script>alert(1)</script><span style="background:red;color:black" onclick="x()">文字</span>[坏链接](javascript:alert(1))');
  excludes(hostile, /<(?:iframe|img|script|form)\b|onerror|onclick|javascript:|background/i);

  const code = render('`<span onclick="x()">文字演示</span>`\n\n```html\n<iframe>字面演示</iframe>\n```');
  matches(code, /&lt;span onclick=&quot;x\(\)&quot;&gt;文字演示&lt;\/span&gt;/);
  matches(code, /&lt;iframe&gt;字面演示&lt;\/iframe&gt;/);
  return true;
}
