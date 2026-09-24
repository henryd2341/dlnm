import assert from 'node:assert/strict';
import { P1_INITIAL, applyP1Changes, parseP1Reply, settleP1 } from '../src/p1-state.mjs';

let passed = 0;
function check(name, run) {
  try { run(); passed++; }
  catch (error) { throw new Error(name, { cause: error }); }
}

const hash = character => character.repeat(64);
const source = (overrides = {}) => ({
  chatKey: 'DLNM-P1-test', messageId: 4, swipeId: 0,
  contentHash: hash('a'), parentHash: hash('b'), ...overrides,
});
const reply = changes => `正文只作为文本保留。\n<lily_delta>\n${JSON.stringify({ version: 1, changes })}\n</lily_delta>`;
const change = (value, grade = 'minor') => ({ op: 'add', path: 'noa.stamina', value, grade, reason: '测试事件造成体力变化' });

check('initial state', () => assert.deepEqual(P1_INITIAL, { noa: { stamina: 100 } }));
check('valid empty list', () => {
  assert.deepEqual(parseP1Reply(reply([])), { body: '正文只作为文本保留。', changes: [] });
  assert.deepEqual(applyP1Changes(P1_INITIAL, []), P1_INITIAL);
});
check('valid decreases and grade boundaries', () => {
  assert.equal(applyP1Changes(P1_INITIAL, [change(-5)]).noa.stamina, 95);
  assert.equal(applyP1Changes(P1_INITIAL, [change(-15, 'moderate')]).noa.stamina, 85);
  assert.equal(applyP1Changes(P1_INITIAL, [change(-30, 'major')]).noa.stamina, 70);
});
check('valid increase', () => assert.equal(applyP1Changes({ noa: { stamina: 90 } }, [change(10, 'moderate')]).noa.stamina, 100));

for (const [name, changes] of Object.entries({
  decimal: [change(1.5)], string: [{ ...change(1), value: '1' }], zero: [change(0)],
  wrongOp: [{ ...change(-1), op: 'set' }], wrongPath: [{ ...change(-1), path: 'noa.cleaning' }],
  wrongGrade: [change(-6, 'minor')], unknownGrade: [change(-1, 'practice')],
  emptyReason: [{ ...change(-1), reason: ' ' }], extraKey: [{ ...change(-1), modelSource: true }],
  duplicatePath: [change(-1), change(-2)],
})) check(`reject ${name}`, () => assert.throws(() => applyP1Changes(P1_INITIAL, changes)));

check('reject malformed payload structure', () => {
  assert.throws(() => parseP1Reply('正文'));
  assert.throws(() => parseP1Reply(reply([]).replace('{"version":1', '{"version":2')));
  assert.throws(() => parseP1Reply(`正文\n<lily_delta>\n{"version":1,"changes":[],"source":{}}\n</lily_delta>`));
  assert.throws(() => parseP1Reply(`${reply([])}\n<lily_delta>\n{}\n</lily_delta>`));
});
check('reject bounds atomically', () => {
  const base = { noa: { stamina: 2 } };
  assert.throws(() => applyP1Changes(base, [change(-3)]));
  assert.deepEqual(base, { noa: { stamina: 2 } });
});
check('settle creates valid record without input mutation', () => {
  const base = { noa: { stamina: 50 } };
  const identity = source();
  const beforeBase = structuredClone(base);
  const beforeSource = structuredClone(identity);
  const result = settleP1(base, reply([change(-5)]), identity);
  assert.equal(result.changed, true);
  assert.deepEqual(result.record, { schemaVersion: 1, scope: 'p1-probe', status: 'valid', state: { noa: { stamina: 45 } }, source: identity });
  assert.deepEqual(base, beforeBase);
  assert.deepEqual(identity, beforeSource);
  assert.notEqual(result.record.state, base);
  assert.notEqual(result.record.source, identity);
});
check('same event is reused without stacking', () => {
  const first = settleP1({ noa: { stamina: 100 } }, reply([change(-5)]), source());
  const repeated = settleP1({ noa: { stamina: 100 } }, 'ignored because the verified source is unchanged', source(), first.record);
  assert.equal(repeated.changed, false);
  assert.equal(repeated.record, first.record);
  assert.equal(repeated.record.state.noa.stamina, 95);
});
check('regeneration recalculates from base', () => {
  const base = { noa: { stamina: 80 } };
  const first = settleP1(base, reply([change(-5)]), source(), undefined);
  const regenerated = settleP1(base, reply([change(-2)]), source({ contentHash: hash('c') }), first.record);
  assert.equal(regenerated.record.state.noa.stamina, 78);
});
check('different swipe recalculates from base', () => {
  const base = { noa: { stamina: 60 } };
  const first = settleP1(base, reply([change(-5)]), source(), undefined);
  const swiped = settleP1(base, reply([change(5)]), source({ swipeId: 1, contentHash: hash('d') }), first.record);
  assert.equal(swiped.record.state.noa.stamina, 65);
});
check('invalid complete source is rejected', () => {
  assert.throws(() => settleP1(P1_INITIAL, reply([]), { ...source(), parentHash: undefined }));
  assert.throws(() => settleP1(P1_INITIAL, reply([]), { ...source(), contentHash: 'model supplied' }));
  assert.throws(() => settleP1(P1_INITIAL, reply([]), { ...source(), extra: true }));
});
check('corrupt previous record with same source is rejected', () => {
  const first = settleP1(P1_INITIAL, reply([]), source());
  const corrupt = { ...first.record, state: { noa: { stamina: 101 } } };
  assert.throws(() => settleP1(P1_INITIAL, reply([]), source(), corrupt));
});
check('text content is never executed', () => {
  globalThis.__p1Probe = 0;
  const body = `globalThis.__p1Probe = 1;\n<lily_delta>\n${JSON.stringify({ version: 1, changes: [change(-1)] })}\n</lily_delta>`;
  assert.equal(settleP1(P1_INITIAL, body, source()).record.state.noa.stamina, 99);
  assert.equal(globalThis.__p1Probe, 0);
  delete globalThis.__p1Probe;
});

console.log(`LEGACY P1 PASS: ${passed} regression groups; retired native-state probe, not MVU Zod or frontend acceptance.`);
