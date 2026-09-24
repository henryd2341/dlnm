import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createCard } from '../src/card.ts';
import { beginBatch } from '../src/mvu/bridge.ts';
import { initialState } from '../src/mvu/schema.ts';
import { initialYaml } from '../src/card-content.ts';

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
  assert.equal(data.name, 'DLNM-P1-香气链路');
  assert.ok(Array.isArray(book.entries));
  assert.equal(data.extensions.world, book.name);
  assert.match(data.creator_notes, /不代表宿主已完成世界书链接/);
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
  assert.equal(book.name, 'DLNM-P1-香气链路-世界书-R2');
});

check('all prompt entries are explicit constant blue lights', () => {
  const promptEntries = book.entries.filter(item => item.enabled);
  assert.equal(promptEntries.length, 4);
  for (const item of promptEntries) {
    assert.equal(item.constant, true);
    assert.equal(item.selective, false);
    assert.deepEqual(item.keys, []);
    assert.equal(item.position, 'before_char');
    assert.match(item.content, /【作用范围】/);
  }
});

check('confirmed relationship and daily scope do not force player choices', () => {
  const content = book.entries.find(item => item.comment.includes('关系与宅邸'))!.content;
  assert.match(content, /玩家扮演诺雅/);
  assert.match(content, /恋人关系/);
  assert.match(content, /不替诺雅决定/);
  assert.match(content, /不强制采购、收集颜色或成长/);
});

check('state entry uses only the registered read-only macro', () => {
  const content = book.entries.find(item => item.comment.includes('当前已校验状态'))!.content;
  assert.match(content, /\{\{dlnm_state\}\}/);
  assert.doesNotMatch(content, /get_message_variable|stat_data\}\}/);
});

check('field rules cover every initial-state leaf without duplicating initial JSON', () => {
  const content = book.entries.find(item => item.comment.includes('19 字段'))!.content;
  const paths: string[] = [];
  for (const [group, values] of Object.entries(initialState)) {
    for (const field of Object.keys(values)) paths.push(`${group}.${field}`);
  }
  assert.equal(paths.length, 19);
  for (const path of paths) assert.match(content, new RegExp(path.replace('.', '\\.')));
  assert.doesNotMatch(content, /"stamina"\s*:\s*100/);
});

check('output contract includes empty, delta, replace and insert JSONPatch examples', () => {
  const content = book.entries.find(item => item.comment.includes('JSONPatch'))!.content;
  assert.match(content, /<UpdateVariable><Analyze>[\s\S]+<JSONPatch>\[\]<\/JSONPatch><\/UpdateVariable>/);
  for (const operation of ['delta', 'replace', 'insert']) assert.match(content, new RegExp(`"op":"${operation}"`));
  assert.match(content, /"path":"\/noa\/colors\/-"/);
  const examples = [...content.matchAll(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g)].map(match => match[0]);
  assert.equal(examples.length, 4);
  for (const example of examples) {
    const patches = JSON.parse(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/.exec(example)![1]);
    const commands = patches.map((patch: unknown) => ({ full_match: JSON.stringify(patch) }));
    assert.equal(beginBatch({ stat_data: structuredClone(initialState) }, commands, example).error, '');
  }
});

check('first message contains the frontend placeholder', () => assert.match(data.first_mes, /<StatusPlaceHolderImpl\/>/));
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

check('two enabled Tavern Helper scripts use the verified pack shape', () => {
  const scripts = data.extensions.tavern_helper.scripts;
  assert.equal(scripts.length, 2);
  assert.deepEqual(scripts.map(item => item.content), ['SCHEMA_SCRIPT();', 'LOADER_SCRIPT();']);
  assert.match(scripts[1].name, /MVU 运行组件加载器/);
  for (const item of scripts) {
    assert.equal(item.type, 'script');
    assert.equal(item.enabled, true);
    assert.deepEqual(item.button, { enabled: false, buttons: [] });
    assert.deepEqual(item.data, {});
    assert.deepEqual(item.export_with, { data: true, button: true });
  }
});

check('component inputs are required', () => {
  assert.throws(() => createCard({ schemaScript: '', loaderScript: 'x', stateHtml: 'x' }));
  assert.throws(() => createCard({ schemaScript: 'x', loaderScript: ' ', stateHtml: 'x' }));
  assert.throws(() => createCard({ schemaScript: 'x', loaderScript: 'x', stateHtml: '' }));
});

console.log(`CARD PASS: ${passed} regression groups; package composition only, no host binding or remote execution implied.`);
