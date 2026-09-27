// Optional local-only check. No network, filesystem writes, host, or model calls.
import assert from 'node:assert/strict';
import { createCard } from '../src/card.ts';
import { createLiveLoader } from './live-loader.mjs';
import { characterPatch, pushCard, toWorldbook } from '../tavern_sync.mjs';

const html = createLiveLoader('http://127.0.0.1:5173/live/state.html');
const card = createCard({ schemaScript: 'SCHEMA()', loaderScript: 'MVU()', stateHtml: html });
const book = toWorldbook(card.data.character_book);
assert.equal(book.entries[0].uid, 0);
assert.equal(book.entries[0].disable, true);
assert.equal(book.entries[0].position, 0);
assert.equal(book.entries[0].probability, 100);
assert.equal(book.entries[0].content, card.data.character_book.entries[0].content);
assert.equal(Object.keys(book.entries).length, card.data.character_book.entries.length);
assert.deepEqual(book.originalData, card.data.character_book);
const patch = characterPatch(card, 'existing.png');
assert.equal(patch.avatar, 'existing.png');
assert.deepEqual(patch.data, card.data);
assert.equal(patch.personality, card.data.personality);
assert.equal(patch.scenario, card.data.scenario);
assert.equal('chat' in patch, false);
assert.equal('create_date' in patch, false);
assert.match(html, /cache: 'no-store'/);
assert.match(html, /controller\.abort\(\)/);
assert.match(html, /script\[data-dlnm-entry\]/);
assert.doesNotMatch(html, /<iframe|document\.open|location\.(href|replace)/);
new Function(/<script>([\s\S]*?)<\/script>/.exec(html)[1]);

const calls = [];
const request = async (url, options) => {
  calls.push([url.pathname, options]);
  if (url.pathname === '/csrf-token') return Response.json({ token: 'token' }, { headers: { 'Set-Cookie': 'session=new; HttpOnly' } });
  return new Response('OK');
};
await pushCard(card, 'existing.png', 'http://127.0.0.1:8000', 'session=old; other=a=b', request);
assert.deepEqual(calls.map(([path]) => path), ['/csrf-token', '/api/worldinfo/edit', '/api/characters/merge-attributes']);
assert.equal(calls[0][1].headers.Cookie, 'session=old; other=a=b');
assert.equal(calls[1][1].headers.Cookie, 'session=new; other=a=b');
assert.equal(calls[1][1].headers['X-CSRF-Token'], 'token');
assert.deepEqual(JSON.parse(calls[1][1].body), { name: card.data.character_book.name, data: book });
assert.deepEqual(JSON.parse(calls[2][1].body), patch);
assert.equal(calls[2][1].redirect, 'error');

await assert.rejects(pushCard(card, 'existing.png', 'http://127.0.0.1:8000', '', async (url, options) => {
  if (url.pathname === '/api/characters/merge-attributes') return new Response('failed', { status: 500 });
  return request(url, options);
}), /世界书已覆盖；角色卡更新失败/);
let failedCalls = 0;
await assert.rejects(pushCard(card, 'existing.png', 'http://127.0.0.1:8000', '', async () => {
  failedCalls++;
  return new Response('denied', { status: 403 });
}), /HTTP 403/);
assert.equal(failedCalls, 1);
console.log('SYNC PASS: local mapping, request sequence, cookie, error and loader checks; real host pending.');
