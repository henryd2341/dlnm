// Optional after explicit test permission: node scripts/check-nvl.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { displayStateId, pagesFromMessages, pagesWithWaiting, visibleBody, type WaitingTurn } from '../src/nvl.ts';

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
assert.equal(pages[1].viewKey, 'turn:1:2');
assert.equal(pages[2].viewKey, 'reply:5:0'); // A second assistant message is a different reading position.
const previous = pagesFromMessages([message(0, 'assistant', '开场')], []);
const sending: WaitingTurn = { key: 'chat-A', text: '新行动', after: 1, userId: null, startedAt: 1000, phase: 'sending' };
const before = JSON.stringify(previous);
const immediate = pagesWithWaiting(previous, sending);
assert.equal(immediate.length, 2);
assert.equal(immediate.at(-1)!.id, -2);
assert.equal(immediate.at(-1)!.prompt, '新行动');
assert.equal(immediate.at(-1)!.waiting!.phase, 'sending');
assert.equal(JSON.stringify(previous), before); // Never insert the temporary page into real messages/pages.
const acknowledged: WaitingTurn = { ...sending, text: '宏展开后的新行动', userId: 1, phase: 'waiting', startedAt: 2000 };
const placeholder = pagesFromMessages([message(0, 'assistant', '开场'), message(1, 'user', acknowledged.text), message(2, 'assistant', '...')], []);
const waiting = pagesWithWaiting(placeholder, JSON.parse(JSON.stringify(acknowledged)));
assert.deepEqual(waiting.map(page => page.id), [0, -2]);
assert.equal(waiting.at(-1)!.viewKey, placeholder.at(-1)!.viewKey);
assert.equal(waiting.at(-1)!.prompt, acknowledged.text);
assert.equal(waiting.at(-1)!.text, '');
for (const phase of ['unconfirmed', 'stopped', 'failed'] as const) {
  const stopped = pagesWithWaiting(placeholder, { ...acknowledged, phase, endedAt: 8000 });
  assert.equal(stopped.at(-1)!.waiting!.phase, phase);
  assert.equal(stopped.at(-1)!.waiting!.endedAt, 8000);
  assert.equal(stopped.at(-1)!.prompt, acknowledged.text);
}
const reply = pagesFromMessages([message(0, 'assistant', '开场'), message(1, 'user', acknowledged.text), message(2, 'assistant', '首字')], []);
assert.equal(pagesWithWaiting(reply, null), reply);
assert.equal(reply.at(-1)!.viewKey, waiting.at(-1)!.viewKey); // Waiting -> first token uses one scroll identity.
const regeneration = pagesWithWaiting(reply, { ...acknowledged, replyId: 2, viewKey: reply[1].viewKey, previousText: '首字' });
assert.equal(regeneration.length, reply.length);
assert.equal(regeneration.at(-1)!.text, '首字');
assert.equal(regeneration.at(-1)!.viewKey, reply[1].viewKey);
const otherSwipe = pagesFromMessages([message(0, 'assistant', '开场'), message(1, 'user', acknowledged.text), message(2, 'assistant', '旧分支')], [0, 0, 3]);
const regeneratingSwipe = pagesWithWaiting(otherSwipe, { ...acknowledged, replyId: 2,
  viewKey: otherSwipe[1].viewKey!.replace(/:\d+$/, ':0'), previousText: otherSwipe[1].text });
assert.equal(regeneratingSwipe.at(-1)!.viewKey, reply[1].viewKey);
assert.equal(visibleBody('正文<UpdateVariable>截断块'), '正文');
assert.equal(visibleBody('正文<Analyze>截断块'), '正文');
assert.equal(visibleBody('正文<StatusPlaceHol'), '正文');
// Static delivery guards only; real activation, CSS and Escape still need host acceptance.
const runtime = readFileSync(new URL('../src/nvl.ts', import.meta.url), 'utf8');
const packaging = readFileSync(new URL('./build-card.ts', import.meta.url), 'utf8');
assert.match(runtime, /root\.requestFullscreen\(/);
assert.match(runtime, /addEventListener\('fullscreenchange'/);
assert.match(runtime, /getElementById\('dlnm-nvl-style'\)/);
assert.doesNotMatch(runtime, /querySelector[^\n]*link\[rel=/);
assert.match(packaging, /style id="dlnm-nvl-style"/);
assert.doesNotMatch(packaging, /typeof Mvu === 'undefined'/);
assert.match(runtime, /tavern_events\.STREAM_TOKEN_RECEIVED, receiveToken/);
assert.doesNotMatch(runtime, /iframe_events\.STREAM_TOKEN_RECEIVED/);
assert.match(runtime, /host\.requestAnimationFrame/);
assert.match(runtime, /stream\.text = \(processor\.continueMessage \|\| ''\) \+ text/);
assert.match(runtime, /eventMakeLast\(tavern_events\.CHARACTER_MESSAGE_RENDERED, rendered\)/);
assert.match(runtime, /if \(connected\.value && !closed\) refresh\(\)/);
assert.match(runtime, /detail: ownerToken/);
assert.doesNotMatch(runtime, /detail: frame\.id|detail !== frame\.id/);
assert.match(runtime, /stopFailed = !context\(\)\.stopGeneration\(\)/);
assert.match(runtime, /if \(displayId < 0\)/);
assert.match(runtime, /if \(statePageId\(\) === WAITING_PAGE\) return/);
assert.doesNotMatch(runtime, /\b(?:createChatMessages|setChatMessages|replaceVariables|updateVariablesWith)\s*\(/);
const send = runtime.slice(runtime.indexOf('  function send()'), runtime.indexOf('  function armSendTimeout()'));
assert.ok(send.indexOf('waitingTurn.value =') < send.indexOf('button.click()'));
assert.ok(send.indexOf('readSelected(); persist();') < send.indexOf('button.click()'));
assert.match(runtime, /waitingTurn: waitingTurn\.value/);
assert.match(runtime, /revealWaitingReply\(true\)/);
const release = runtime.slice(runtime.indexOf('  function release()'), runtime.indexOf('  function cancelStream()'));
assert.doesNotMatch(release, /stops\.splice|clearTimeout\(timer\)/);
const acquire = runtime.slice(runtime.indexOf('  async function acquire('), runtime.indexOf('  async function toggleHost('));
assert.doesNotMatch(acquire, /eventOn\(tavern_events/);
const view = readFileSync(new URL('../src/NvlView.vue', import.meta.url), 'utf8');
assert.match(view, /props\.following && selectedPage\.value\?\.id === latestPage\.value\?\.id/);
assert.match(view, /revision === scrollRevision/);
assert.match(view, /已发送，等待回复/);
assert.match(view, /已等待 \{\{ waitingSeconds \}\} 秒/);
assert.match(view, /clearInterval\(waitingClock\)/);
// N3: current status in light UI must not overwrite the separate historical reading selection.
assert.equal(displayStateId(pages, 0, true), 0);
assert.equal(displayStateId(pages, 0, false), 5);
assert.equal(displayStateId(waiting, 0, false), -2);
assert.equal(displayStateId(waiting, 0, true), 0);
assert.equal(displayStateId([], 0, false), -1);
assert.match(runtime, /saved\.mode === 'panel' \|\| saved\.mode === 'light'/);
assert.match(runtime, /if \(!nativeMode && isReaderFullscreen\(\)\) await acquire\(\)/);
assert.doesNotMatch(runtime, /data-dlnm-nvl-(?:chat|frame|row|input)|--dlnm-reader-height|ResizeObserver/);
assert.match(runtime, /superseded\.value = true; retire\(\)/);
const entry = readFileSync(new URL('../src/StateCard.vue', import.meta.url), 'utf8');
assert.match(entry, /!hosted && !superseded/);
assert.match(entry, /<CharacterStatus/);
assert.match(view, /<CharacterStatus/);
assert.doesNotMatch(entry, /<textarea|scene-placeholder|history-menu|面板模式/);
assert.doesNotMatch(view, /change-mode|面板模式/);
const status = readFileSync(new URL('../src/CharacterStatus.vue', import.meta.url), 'utf8');
const statusTemplate = status.slice(status.indexOf('<template>'), status.indexOf('</template>'));
const folded = [...statusTemplate.matchAll(/<details\b[^>]*>[\s\S]*?<\/details>/g)].map(match => match[0]);
assert.equal(folded.length, 3);
assert.ok(folded.every(part => !/<meter|<CardImage|<details[^>]*\bopen\b/.test(part)));
assert.equal([...statusTemplate.matchAll(/<meter\b/g)].length, 2);
assert.match(status, /@container \(min-width: 30rem\)/);
assert.match(status, /repeat\(2, minmax\(0, 1fr\)\)/);
assert.equal([...statusTemplate.matchAll(/<CardImage\b/g)].length, 4);
for (const name of ['塞拉菲娜', '狸猫']) {
  const card = statusTemplate.match(new RegExp(`<section class="character-card" aria-label="${name}的状态">[\\s\\S]*?<\\/section>`))?.[0];
  assert.ok(card);
  assert.doesNotMatch(card, /<details|<meter/);
}
assert.doesNotMatch(status, /eventOn|watch\(|v-html|replaceVariables/);
console.log('NVL message projection checks passed; no host or UI acceptance implied.');
