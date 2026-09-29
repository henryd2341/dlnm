import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createCard } from '../src/card.ts';
import { beginBatch } from '../src/mvu/bridge.ts';
import { initialState } from '../src/mvu/schema.ts';
import { cardName, initialYaml, worldbookName } from '../src/card-content.ts';
import { toWorldbook } from '../tavern_sync.mjs';

let passed = 0;
function check(name: string, run: () => void) {
  try { run(); passed++; }
  catch (error) { throw new Error(name, { cause: error }); }
}

const stateHtml = '<section data-money="$1">cost: ${value}; raw $&</section>';
const card = createCard({ schemaScript: 'SCHEMA_SCRIPT();', loaderScript: 'LOADER_SCRIPT();', stateHtml });
const data = card.data;
const book = data.character_book;
const regexes = data.extensions.regex_scripts;

function compile(source: string) {
  const match = source.match(/^\/(.*)\/([a-z]*)$/s);
  assert.ok(match, `invalid regex string: ${source}`);
  return new RegExp(match[1], match[2]);
}
function applyRegex(raw: string, item: (typeof regexes)[number]) {
  return raw.replace(compile(item.findRegex), () => item.replaceString);
}

check('V2 card and declared world binding shape', () => {
  assert.equal(card.spec, 'chara_card_v2');
  assert.equal(card.spec_version, '2.0');
  assert.equal(cardName, '魔族大小姐与女仆的30天·续');
  assert.equal(data.name, cardName);
  assert.ok(Array.isArray(book.entries));
  assert.equal(data.extensions.world, book.name);
  assert.equal(data.creator_notes, '');
});

check('initvar is disabled YAML generated from the shared initial state', () => {
  const init = book.entries.find(item => item.comment.includes('[initvar]'));
  assert.ok(init);
  assert.equal(init.enabled, false);
  assert.equal(init.constant, true);
  assert.equal(init.content, initialYaml);
  assert.match(init.content, /^world:\n  day: 1\n  period: "上午"/);
  for (const [group, fields] of Object.entries(initialState)) {
    assert.ok(init.content.includes(`${group}:\n`));
    for (const [name, value] of Object.entries(fields)) {
      assert.ok(init.content.includes(Array.isArray(value)
        ? `  ${name}:\n${value.map(item => `    - ${JSON.stringify(item)}`).join('\n')}`
        : `  ${name}: ${JSON.stringify(value)}`));
    }
  }
  assert.equal(worldbookName, 'DLNM-世界书');
  assert.equal(book.name, worldbookName);
});

check('technical and core entries stay constant while N5 details are conditional', () => {
  assert.equal(book.entries.length, 16);
  assert.deepEqual(book.entries.map(item => item.id).sort((a, b) => a - b), Array.from({ length: 16 }, (_, id) => id));
  const promptEntries = book.entries.filter(item => item.enabled && item.id <= 5);
  assert.equal(promptEntries.length, 5);
  for (const item of promptEntries) {
    assert.equal(item.constant, true);
    assert.equal(item.selective, false);
    assert.deepEqual(item.keys, []);
    assert.equal(item.position, 'before_char');
    if (item.id !== 1) assert.match(item.content, /【作用范围】/);
  }
});

check('confirmed relationship and daily scope do not force player choices', () => {
  const content = book.entries.find(item => item.id === 1)!.content;
  assert.match(content, /\{\{user\}\}就是诺雅/);
  assert.match(content, /恋人关系/);
  assert.match(content, /互相依偎和共同生活/);
  assert.match(content, /不替诺雅决定/);
  assert.match(content, /不强制采购、收集颜色或成长/);
  assert.match(content, /登场人物与称谓/);
});

check('ten conditional lore entries keep character tags and omit author metadata', () => {
  const names = ['诺雅', '莉莉希雅', '塞拉菲娜', '狸猫', '月光都市瑟雷妮亚', '卢娜家宅邸', '香气与共用香气', '原色丧失与色视', '魔族与魔力', '修道院与神圣术'];
  for (const [index, name] of names.entries()) {
    const item = book.entries.find(entry => entry.id === index + 6)!;
    assert.ok(item);
    assert.ok(item.comment.endsWith(name));
    assert.equal(item.enabled, true);
    assert.equal(item.constant, false);
    assert.equal(item.selective, false);
    assert.equal(item.position, 'before_char');
    assert.ok(item.keys.length > 0);
    assert.ok(item.keys.every(key => key.trim().length > 1));
    if (index < 4) {
      assert.match(item.content, new RegExp(`<${name}_信息>[\\s\\S]+</${name}_信息>`));
    }
  }
  const lore = book.entries.filter(item => item.id === 1 || item.id >= 6).map(item => item.content).join('\n');
  assert.doesNotMatch(lore, /SHA256|ManualTransFile|来源表|原文依据：|待审|本轮|成品 [ABC]|[A-Z]:[\\/]|```text/);
  assert.match(book.entries.find(item => item.id === 7)!.content, /混血；本人明确自称魅魔/);
  assert.match(book.entries.find(item => item.id === 8)!.content, /修道院的主教/);
  assert.match(book.entries.find(item => item.id === 9)!.content, /真实身份: 未明/);
  assert.equal(data.personality, '');
});

check('N5 keyword and recursion settings survive the native worldbook adapter', () => {
  const native = toWorldbook(book);
  assert.equal(Object.keys(native.entries).length, book.entries.length);
  for (const item of book.entries.filter(item => item.id === 1 || item.id >= 6)) {
    const converted = native.entries[item.id];
    assert.deepEqual(converted.key, item.keys);
    assert.equal(converted.constant, item.id === 1);
    assert.equal(converted.excludeRecursion, true);
    assert.equal(converted.preventRecursion, true);
    assert.equal(converted.scanDepth, 4);
    assert.equal(converted.caseSensitive, false);
    assert.equal(converted.matchWholeWords, false);
    assert.equal(converted.probability, 100);
    assert.equal(converted.ignoreBudget, false);
    assert.equal(converted.matchCharacterDescription, false);
    assert.equal(converted.matchScenario, false);
    assert.equal(converted.content, item.content);
  }
});

check('state entry uses only the registered read-only macro', () => {
  const content = book.entries.find(item => item.comment.includes('当前已校验状态'))!.content;
  assert.match(content, /\{\{dlnm_state\}\}/);
  assert.doesNotMatch(content, /get_message_variable|stat_data\}\}/);
});

check('field rules cover every initial-state leaf without duplicating initial JSON', () => {
  const content = book.entries.find(item => item.comment.includes('24 字段'))!.content;
  const paths: string[] = [];
  for (const [group, values] of Object.entries(initialState)) {
    for (const field of Object.keys(values)) paths.push(`${group}.${field}`);
  }
  assert.equal(paths.length, 24);
  for (const path of paths) assert.match(content, new RegExp(path.replace('.', '\\.')));
  assert.doesNotMatch(content, /"stamina"\s*:\s*100/);
});

check('observable appearance rules stay narrow and do not force supporting cast into every turn', () => {
  const content = book.entries.find(item => item.comment.includes('24 字段'))!.content;
  assert.match(content, /当前可观察状态/);
  assert.match(content, /“睡、内”交给 underwear/);
  assert.match(content, /“纱、巾”交给 sisterveil/);
  assert.match(content, /smile 只匹配“喜、欢、乐、笑”，不匹配“微”/);
  assert.match(content, /不得把“微怒”写成“微笑”/);
  assert.match(content, /不强迫塞拉菲娜或狸猫每轮进入剧情/);
});

check('output contract includes empty, delta, replace and insert JSONPatch examples', () => {
  const content = book.entries.find(item => item.comment.includes('JSONPatch'))!.content;
  assert.match(content, /<UpdateVariable><Analyze>[\s\S]+<JSONPatch>\[\]<\/JSONPatch><\/UpdateVariable>/);
  for (const operation of ['delta', 'replace', 'insert']) assert.match(content, new RegExp(`"op":"${operation}"`));
  assert.match(content, /"path":"\/noah\/colors\/-"/);
  const examples = [...content.matchAll(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g)].map(match => match[0]);
  assert.equal(examples.length, 4);
  for (const example of examples) {
    const patches = JSON.parse(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/.exec(example)![1]);
    const commands = patches.map((patch: unknown) => ({ full_match: JSON.stringify(patch) }));
    assert.equal(beginBatch({ stat_data: structuredClone(initialState) }, commands, example).error, '');
  }
});

check('first message contains the frontend placeholder', () => assert.match(data.first_mes, /<StatusPlaceHolderImpl\/>/));
check('body presentation is separate from game colors and technical output', () => {
  const content = book.entries.find(item => item.comment.includes('正文呈现'))!.content;
  assert.match(content, /<span style="color: red">/);
  assert.match(content, /不修改 noah.colors/);
  assert.match(content, /不在技术块中插入 HTML/);
  assert.equal(data.character_version, 'p2-nvl-nc');
});
check('greeting keeps the reviewed story beats and exactly one protocol tail', () => {
  const tail = '<UpdateVariable><Analyze>开场初值由世界书载入，本轮没有额外变化</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>\n\n<StatusPlaceHolderImpl/>';
  assert.ok(data.first_mes.endsWith(`\n\n${tail}`));
  for (const beat of [
    '上午，宅邸起居室。',
    '“诺雅，过来坐一会儿吧。”',
    '找一种两个人都能用的香气',
    '“想去看看花草，还是先在家里慢慢商量？呵呵，诺雅，你若是另有安排，也说来听听。”',
  ]) assert.match(data.first_mes, new RegExp(beat));
  assert.equal((data.first_mes.match(/<UpdateVariable>/g) ?? []).length, 1);
  assert.equal((data.first_mes.match(/<StatusPlaceHolderImpl\/>/g) ?? []).length, 1);
  assert.doesNotMatch(data.first_mes, /开场说明|场景引导|原文依据/);
});
check('greeting declares a valid empty MVU update instead of being marked pending', () => {
  assert.equal(beginBatch({ stat_data: structuredClone(initialState) }, [], data.first_mes).error, '');
});

check('three regexes keep prompt cleanup global and mount UI on latest depth only', () => {
  assert.equal(regexes.length, 3);
  for (const item of regexes) {
    assert.deepEqual(item.placement, [2]);
    assert.equal(item.disabled, false);
    assert.equal(item.runOnEdit, true);
    assert.equal(item.minDepth, null);
    assert.equal(item.maxDepth, item.id === 'dlnm-state-display' ? 0 : null);
  }
  assert.deepEqual(regexes.map(item => [item.markdownOnly, item.promptOnly]), [[true, false], [false, true], [true, false]]);
});

check('display hides only complete update blocks and preserves raw text', () => {
  const item = regexes[0];
  const complete = '正文\n<UpdateVariable><Analyze>x</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>';
  const truncated = '正文\n<UpdateVariable><Analyze>x</Analyze><JSONPatch>[]</JSONPatch>';
  assert.equal(applyRegex(complete, item), '正文');
  assert.equal(applyRegex(truncated, item), truncated);
  assert.match(complete, /<UpdateVariable>/);
});

check('prompt cleanup removes complete history blocks and placeholders only', () => {
  const item = regexes[1];
  const raw = '旧正文\n<UpdateVariable><Analyze>x</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>\n<StatusPlaceHolderImpl/>';
  assert.doesNotMatch(applyRegex(raw, item), /UpdateVariable|StatusPlaceHolderImpl/);
  const truncated = '旧正文\n<UpdateVariable><JSONPatch>[]';
  assert.equal(applyRegex(truncated, item), truncated);
});

check('state HTML replacement is safe from regex dollar capture expansion', () => {
  const item = regexes[2];
  assert.doesNotMatch(item.replaceString, /\$/);
  assert.match(item.replaceString, /^\n\n```html\n<!DOCTYPE html>\n<script>[\s\S]+<\/script>\n```$/);
  // Mirrors Helper 4.11.0 src/util/is_frontend.ts, before any script executes.
  assert.ok(['html>', '<head>', '<body'].some(tag => item.replaceString.includes(tag)));
  const scriptBody = /<script>([\s\S]*?)<\/script>/.exec(item.replaceString)![1];
  assert.doesNotThrow(() => new Function(scriptBody));
  const encoded = /atob\("([A-Za-z0-9+/=]+)"\)/.exec(item.replaceString)![1];
  const decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), character => character.charCodeAt(0)));
  assert.equal(decoded, stateHtml);
  let written = '';
  runInNewContext(scriptBody, {
    document: { write: (value: string) => { written += value; } }, TextDecoder, Uint8Array, atob,
  });
  assert.equal(written, stateHtml);
  assert.equal(applyRegex('正文\n<StatusPlaceHolderImpl/>', item), `正文\n${item.replaceString}`);
  assert.equal(applyRegex('没有占位符的后续回复', item), `没有占位符的后续回复${item.replaceString}`);
  assert.equal(compile(item.findRegex).global, false);
});

check('three enabled Tavern Helper scripts use the verified pack shape', () => {
  const scripts = data.extensions.tavern_helper.scripts;
  assert.equal(scripts.length, 3);
  assert.deepEqual(scripts.slice(0, 2).map(item => item.content), ['SCHEMA_SCRIPT();', 'LOADER_SCRIPT();']);
  assert.equal(scripts[2].id, 'dlnm-latest-message-only');
  assert.equal(new Set(scripts.map(item => item.id)).size, scripts.length);
  assert.match(scripts[1].name, /MVU 运行组件加载器/);
  for (const item of scripts) {
    assert.equal(item.type, 'script');
    assert.equal(item.enabled, true);
    assert.deepEqual(item.button, { enabled: false, buttons: [] });
    assert.deepEqual(item.data, {});
    assert.deepEqual(item.export_with, { data: true, button: true });
  }
});

function loadLatestMessageScript(readyState: string, hasLatest = true) {
  const source = data.extensions.tavern_helper.scripts.find(item => item.id === 'dlnm-latest-message-only')!.content;
  assert.doesNotMatch(source, /\bjQuery\b|\$\s*\(/);
  const removed: number[] = [];
  const document = Object.assign(new EventTarget(), { readyState });
  const window = Object.assign(new EventTarget(), { parent: { document: {
    querySelector: (selector: string) => {
      assert.equal(selector, '#chat > .mes.last_mes');
      return hasLatest ? {} : null;
    },
    querySelectorAll: (selector: string) => {
      assert.equal(selector, '#chat > .mes:not(.last_mes)');
      assert.ok(hasLatest, 'keep the view intact before a latest row exists');
      return [0, 1].map(id => ({ remove: () => removed.push(id) }));
    },
  } } });
  let changed: ((id: string) => void) | undefined;
  let reloads = 0, subscriptions = 0, stopped = 0;
  runInNewContext(source, {
    document, window,
    SillyTavern: { getCurrentChatId: () => 'chat-a' },
    tavern_events: { CHAT_CHANGED: 'chat_id_changed' },
    eventOn: (event: string, callback: (id: string) => void) => {
      assert.equal(event, 'chat_id_changed');
      changed = callback; subscriptions++;
      return { stop: () => { changed = undefined; stopped++; } };
    },
    reloadIframe: () => { reloads++; },
  });
  return {
    removed, ready: () => document.dispatchEvent(new Event('DOMContentLoaded')),
    close: () => window.dispatchEvent(new Event('pagehide')),
    change: (id: string) => changed?.(id),
    counts: () => ({ reloads, subscriptions, stopped }),
  };
}

check('native latest-message script waits for readiness and only removes old host rows', () => {
  for (const state of ['loading', 'interactive', 'complete']) {
    const view = loadLatestMessageScript(state);
    if (state === 'loading') {
      assert.deepEqual(view.removed, []);
      assert.equal(view.counts().subscriptions, 0);
    }
    view.ready(); view.ready();
    assert.deepEqual(view.removed, [0, 1]);
    assert.equal(view.counts().subscriptions, 1);
    view.change('chat-a');
    assert.equal(view.counts().reloads, 0);
    view.change('chat-b'); view.change('chat-b');
    assert.equal(view.counts().reloads, 1);
    view.change('');
    assert.equal(view.counts().reloads, 2);
    view.close(); view.close(); view.change('chat-c');
    assert.deepEqual(view.counts(), { reloads: 2, subscriptions: 1, stopped: 1 });
  }
});

check('latest-message script preserves an unfinished view and cancels pending startup on close', () => {
  const missing = loadLatestMessageScript('complete', false);
  assert.deepEqual(missing.removed, []);
  missing.change('chat-b');
  assert.equal(missing.counts().reloads, 1);
  missing.close();
  const early = loadLatestMessageScript('loading');
  early.close(); early.ready(); early.change('chat-b');
  assert.deepEqual(early.removed, []);
  assert.deepEqual(early.counts(), { reloads: 0, subscriptions: 0, stopped: 0 });
});

check('component inputs are required', () => {
  assert.throws(() => createCard({ schemaScript: '', loaderScript: 'x', stateHtml: 'x' }));
  assert.throws(() => createCard({ schemaScript: 'x', loaderScript: ' ', stateHtml: 'x' }));
  assert.throws(() => createCard({ schemaScript: 'x', loaderScript: 'x', stateHtml: '' }));
});

console.log(`CARD PASS: ${passed} regression groups; package composition only, no host binding or remote execution implied.`);
