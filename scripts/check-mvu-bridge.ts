import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beginBatch, finishBatch, publishSyncStatus, readStateAt, runtimeSchema } from '../src/mvu/bridge.ts';
import { initialState } from '../src/mvu/schema.ts';

const message = patches => `<UpdateVariable><Analyze>人工夹具，非模型回复</Analyze><JSONPatch>${JSON.stringify(patches)}</JSONPatch></UpdateVariable>`;
const commands = patches => patches.map(patch => ({ full_match: JSON.stringify(patch) }));
const fresh = () => ({ stat_data: structuredClone(initialState), unrelated: 'preserve' });
let count = 0;
function check(name, fn) { fn(); count += 1; }
check('reserved temporary field only', () => {
  assert.deepEqual(runtimeSchema.parse({ ...initialState, $internal: {} }), initialState);
  assert.equal(runtimeSchema.safeParse({ ...initialState, extra: {} }).success, false);
});
check('valid round uses MVU output, not own calculator', () => {
  const patches = [{ op: 'delta', path: '/noah/stamina', value: -2 }];
  const v = fresh(), cmd = commands(patches), batch = beginBatch(v, cmd, message(patches));
  assert.equal(batch.error, '');
  v.stat_data.noah.stamina = 98; // stand-in for upstream; not real-host evidence
  finishBatch(v, [], batch);
  assert.equal(v.stat_data.noah.stamina, 98);
  assert.equal(v.dlnm_sync.status, 'valid');
  assert.equal(v.unrelated, 'preserve');
});
check('empty is valid, missing is pending', () => {
  for (const [text, status] of [[message([]), 'valid'], ['正文', 'pending']]) {
    const v = fresh(), cmd = [], batch = beginBatch(v, cmd, text);
    finishBatch(v, cmd, batch);
    assert.equal(v.dlnm_sync.status, status);
    assert.deepEqual(v.stat_data, initialState);
  }
});
check('one leftover rolls back all successful prior commands', () => {
  const patches = [{ op: 'delta', path: '/noah/stamina', value: -2 }, { op: 'delta', path: '/lilicia/mana', value: 5 }];
  const v = fresh(), cmd = commands(patches), batch = beginBatch(v, cmd, message(patches));
  v.stat_data.noah.stamina = 98;
  finishBatch(v, cmd.slice(1), batch);
  assert.deepEqual(v.stat_data, initialState);
  assert.equal(v.dlnm_sync.status, 'pending');
});
check('reject malformed, unknown, coercion, extra commands', () => {
  for (const patches of [
    [{ op: 'move', path: '/noah/stamina', value: 1 }],
    [{ op: 'replace', path: '/noah/fake', value: 1 }],
    [{ op: 'delta', path: '/noah/stamina', value: '1' }],
    [{ op: 'delta', path: '/world/location', value: 1 }],
    [{ op: 'insert', path: '/noah/colors/-', value: ' ' }],
    [{ op: 'replace', path: '/world', value: {} }],
    [{ op: 'replace', path: '/noah/stamina', value: 5, extra: true }],
  ]) {
    const v = fresh(), cmd = commands(patches), batch = beginBatch(v, cmd, message(patches));
    assert.ok(batch.error);
    assert.equal(cmd.length, 0);
    finishBatch(v, cmd, batch);
    assert.deepEqual(v.stat_data, initialState);
  }
  assert.ok(beginBatch(fresh(), [{ full_match: '_.set()' }], message([])).error);
  assert.ok(beginBatch(fresh(), [], message([]) + message([])).error);
  assert.ok(beginBatch(fresh(), [], '<UpdateVariable><JSONPatch>[]').error);
});
check('post-update invalid state rolls back', () => {
  const v = fresh(), batch = beginBatch(v, [], message([]));
  v.stat_data.noah.stamina = 101;
  finishBatch(v, [], batch);
  assert.deepEqual(v.stat_data, initialState);
});
check('day does not go backwards relative to the round baseline', () => {
  const v = fresh();
  v.stat_data.world.day = 5;
  const patch = [{ op: 'replace', path: '/world/day', value: 4 }];
  const batch = beginBatch(v, commands(patch), message(patch));
  v.stat_data.world.day = 4;
  finishBatch(v, [], batch);
  assert.equal(v.stat_data.world.day, 5);
  assert.equal(v.dlnm_sync.status, 'pending');
});
check('schema failure never resets damaged saved input', () => {
  const v = { stat_data: { world: { day: 1 } } };
  const before = structuredClone(v.stat_data), batch = beginBatch(v, [], message([]));
  finishBatch(v, [], batch);
  assert.deepEqual(v.stat_data, before);
  assert.equal(v.dlnm_sync.status, 'pending');
});
check('read exact floor and current swipe, with no writes/defaults', () => {
  let calls = [];
  globalThis.getChatMessages = (id, options) => {
    calls.push([id, options]);
    return [{ role: 'assistant', swipe_id: 2 }];
  };
  globalThis.Mvu = { getMvuData: options => { calls.push(options); return fresh(); } };
  assert.deepEqual(readStateAt(7), { messageId: 7, swipeId: 2, state: initialState, pending: false });
  assert.deepEqual(calls[1], { type: 'message', message_id: 7 });
  assert.throws(() => readStateAt(-1));
  globalThis.Mvu.getMvuData = () => ({ stat_data: { ...structuredClone(initialState), $internal: {} } });
  assert.deepEqual(readStateAt(7).state, initialState);
  globalThis.Mvu.getMvuData = () => ({ stat_data: { ...structuredClone(initialState), wrong_field: true } });
  assert.throws(() => readStateAt(7), /字段未通过校验/);
  globalThis.Mvu.getMvuData = () => ({});
  assert.throws(() => readStateAt(7), /初值尚未写入/);
  const v = fresh(), batch = beginBatch(v, [], '缺失更新块');
  finishBatch(v, [], batch);
  v.display_data = { existing: 'preserved' }; // MVU rebuilds this before VARIABLE_UPDATE_ENDED.
  assert.match(readFileSync('src/mvu/register.ts', 'utf8'), /eventMakeLast\(`\$\{Mvu\.events\.VARIABLE_UPDATE_ENDED\}_for_zod`, publishSyncStatus\)/);
  publishSyncStatus(v);
  assert.equal(v.dlnm_sync, undefined);
  assert.equal(v.display_data.existing, 'preserved');
  const saved = { stat_data: v.stat_data, display_data: v.display_data }; // Upstream save whitelist.
  globalThis.Mvu.getMvuData = () => structuredClone(saved);
  assert.equal(readStateAt(7).pending, true);
  const repaired = beginBatch(v, [], message([]));
  finishBatch(v, [], repaired);
  publishSyncStatus(v);
  globalThis.Mvu.getMvuData = () => structuredClone({ stat_data: v.stat_data, display_data: v.display_data });
  assert.equal(readStateAt(7).pending, false);
  globalThis.Mvu.getMvuData = () => ({ stat_data: {} });
  assert.throws(() => readStateAt(7));
  delete globalThis.Mvu;
  delete globalThis.getChatMessages;
});
console.log(`MVU BRIDGE PASS: ${count} groups; upstream processing mocked, real-host gate open.`);
