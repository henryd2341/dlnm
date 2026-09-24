// Optional after explicit test permission: node scripts/check-nvl.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pagesFromMessages, visibleBody } from '../src/nvl.ts';

const message = (message_id: number, role: ChatMessage['role'], text: string, is_hidden = false): ChatMessage =>
  ({ message_id, role, name: role, message: text, is_hidden, data: {}, extra: {} });
const block = '<UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>';
const pages = pagesFromMessages([
  message(0, 'assistant', '开场<StatusPlaceHolderImpl/>'),
  message(1, 'user', '我的行动'),
  message(2, 'assistant', `真实回复\n${block}`),
  message(3, 'user', '隐藏输入', true),
  message(4, 'system', '系统通知'),
  message(5, 'assistant', '<img onerror="bad()">只作为文本'),
], [0, 0, 2]);
assert.deepEqual(pages.map(page => [page.id, page.swipe, page.prompt]), [[0, 0, ''], [2, 2, '我的行动'], [5, 0, '我的行动']]);
assert.equal(pages[0].text, '开场');
assert.equal(pages[1].text, '真实回复');
assert.equal(pages[2].text, '<img onerror="bad()">只作为文本');
assert.equal(visibleBody('正文<UpdateVariable>截断块'), '正文<UpdateVariable>截断块');
// Static delivery guards only; real activation, CSS and Escape still need host acceptance.
const runtime = readFileSync(new URL('../src/nvl.ts', import.meta.url), 'utf8');
const packaging = readFileSync(new URL('./build-card.ts', import.meta.url), 'utf8');
assert.match(runtime, /root\.requestFullscreen\(/);
assert.match(runtime, /addEventListener\('fullscreenchange'/);
assert.match(runtime, /getElementById\('dlnm-nvl-style'\)/);
assert.doesNotMatch(runtime, /querySelector[^\n]*link\[rel=/);
assert.match(packaging, /style id="dlnm-nvl-style"/);
assert.doesNotMatch(packaging, /typeof Mvu === 'undefined'/);
console.log('NVL message projection checks passed; no host or UI acceptance implied.');
