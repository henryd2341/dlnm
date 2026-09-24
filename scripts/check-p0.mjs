// Retained field baseline + retired native-protocol examples. Not current P0/MVU acceptance.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const design = readFileSync(new URL('../docs/DESIGN.md', import.meta.url), 'utf8');
const blueprint = readFileSync(new URL('../docs/BLUEPRINT.md', import.meta.url), 'utf8');
let passed = 0;
function check(name, run) {
  try { run(); passed++; }
  catch (error) { throw new Error(name, { cause: error }); }
}

const rows = [...design.matchAll(/^\| (诺雅|莉莉希雅) \| [^|]+ \| ([^|]+) \| 0～(1000|100) \| (\d+) \| [^|]+ \| `([^`]+)` \|$/gm)];
const fields = Object.fromEntries(rows.map(([, , label, max, initial, path]) =>
  [path, { label: label.trim(), max: Number(max), initial: Number(initial) }]));
const initial = Object.fromEntries(Object.entries(fields).map(([path, field]) => [path, field.initial]));
Object.assign(initial, {
  'world.day': 1, 'world.period': '上午', 'world.location': '宅邸起居室',
  'noa.colors': ['红', '绿', '蓝', '橙'], 'lilixia.appearance': '平日模样',
  'lilixia.clothing': '居家便服', 'lilixia.expression': '神态放松', 'lilixia.condition': '无明显不适',
});
const grades = { practice: [1, 3], progress: [4, 8], breakthrough: [9, 15], minor: [1, 5], moderate: [6, 15], major: [16, 30] };
const textLimits = { 'world.location': 80, 'lilixia.appearance': 120, 'lilixia.clothing': 120, 'lilixia.expression': 120, 'lilixia.condition': 120 };
const periods = ['清晨', '上午', '午后', '傍晚', '夜间', '深夜'];
const open = '<lily_delta>';
const close = '</lily_delta>';

function example(id) {
  const block = design.match(new RegExp(`<!-- p0:${id} -->\\r?\\n\x60\x60\x60(?:text|json)\\r?\\n([\\s\\S]*?)\\r?\\n\x60\x60\x60`));
  assert.ok(block, `Missing document example ${id}`);
  return block[1].replaceAll('\r\n', '\n');
}
function keys(value, names) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), names.split(',').sort());
}
function text(value, max) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim().length > 0 && [...value].length <= max);
}
function split(reply) {
  reply = reply.replaceAll('\r\n', '\n');
  assert.equal(reply.split(open).length, 2, 'One opening marker required');
  assert.equal(reply.split(close).length, 2, 'One closing marker required');
  const match = reply.match(/^([\s\S]+)\n<lily_delta>\n([\s\S]+)\n<\/lily_delta>\s*$/u);
  assert.ok(match && match[1].trim(), 'Nonempty body and final standalone block required');
  assert.ok(Buffer.byteLength(match[2], 'utf8') <= 16 * 1024);
  const payload = JSON.parse(match[2]);
  keys(payload, 'version,changes');
  assert.equal(payload.version, 1);
  assert.ok(Array.isArray(payload.changes) && payload.changes.length <= 32);
  return { body: match[1], changes: payload.changes };
}
function add(path, base, delta, grade) {
  assert.ok(Object.hasOwn(fields, path));
  const { max } = fields[path];
  assert.ok(Number.isSafeInteger(base) && base >= 0 && base <= max);
  assert.ok(Number.isSafeInteger(delta) && delta !== 0);
  assert.ok(Object.hasOwn(grades, grade));
  assert.ok((max === 1000 ? ['practice', 'progress', 'breakthrough'] : ['minor', 'moderate', 'major']).includes(grade));
  if (max === 1000) assert.ok(delta > 0);
  const [low, high] = grades[grade];
  assert.ok(Math.abs(delta) >= low && Math.abs(delta) <= high);
  const result = base + delta;
  assert.ok(result >= 0 && result <= max);
  return result;
}
function apply(changes, base = initial) {
  // Only a contract oracle; P1/P3 must verify production parsing and persistence separately.
  const result = structuredClone(base);
  const seen = new Set();
  for (const change of changes) {
    assert.ok(change && ['add', 'set', 'append'].includes(change.op));
    keys(change, change.op === 'add' ? 'op,path,value,grade,reason' : 'op,path,value,reason');
    text(change.reason, 240);
    assert.ok(!seen.has(change.path), 'One change per path');
    seen.add(change.path);
    if (change.op === 'add') {
      result[change.path] = add(change.path, base[change.path], change.value, change.grade);
    } else if (change.op === 'append') {
      assert.equal(change.path, 'noa.colors');
      text(change.value, 16);
      result[change.path] = [...new Set([...base[change.path], change.value])];
    } else if (change.path === 'world.day') {
      assert.ok(Number.isSafeInteger(change.value) && change.value >= base[change.path]);
      result[change.path] = change.value;
    } else if (change.path === 'world.period') {
      assert.ok(periods.includes(change.value));
      result[change.path] = change.value;
    } else {
      assert.ok(Object.hasOwn(textLimits, change.path));
      text(change.value, textLimits[change.path]);
      result[change.path] = change.value;
    }
  }
  return result;
}

check('11 frozen numeric fields and no extras', () => {
  assert.equal(rows.length, 11);
  assert.deepEqual(Object.values(fields).map(({ initial }) => initial), [100, 60, 60, 60, 60, 50, 50, 60, 40, 0, 100]);
  assert.deepEqual(Object.keys(fields), ['noa.stamina', 'noa.cleaning', 'noa.cooking', 'noa.laundry', 'noa.etiquette', 'noa.knowledge', 'noa.charm', 'noa.affection', 'noa.sensitivity', 'noa.desire', 'lilixia.mana']);
  assert.equal(fields['noa.laundry'].label, '洗涤');
  assert.equal(Object.values(fields).filter(field => field.max === 1000).length, 8);
});
check('non-numeric defaults match documentation', () => {
  const narrativeRows = [...design.matchAll(/^\| `([^`]+)` \| [^|]+ \| `([^`]+)` \| [^|]+ \|$/gm)];
  assert.equal(narrativeRows.length, 8);
  for (const [, path, value] of narrativeRows) {
    assert.deepEqual(initial[path], path === 'noa.colors' ? JSON.parse(value) : path === 'world.day' ? Number(value) : value);
  }
});
for (const id of ['empty', 'practice', 'narrative']) check(`document example ${id}`, () => apply(split(example(id)).changes));
check('empty means unchanged', () => assert.deepEqual(apply(split(example('empty')).changes), initial));
check('numeric example result', () => {
  const result = apply(split(example('practice')).changes);
  assert.equal(result['noa.cleaning'], 62);
  assert.equal(result['noa.stamina'], 98);
});
for (const item of JSON.parse(example('boundaries'))) check(`boundary ${JSON.stringify(item)}`, () => {
  const run = () => add(item.path, item.base, item.delta, item.grade);
  if (item.expected === null) assert.throws(run); else assert.equal(run(), item.expected);
});
for (const [id, reply] of Object.entries({
  missing: '正文', truncated: `正文\n${open}\n{"version":1,"changes":[]}`,
  duplicate: `${example('empty')}\n${open}\n{}\n${close}`,
  emptyBody: `\n${open}\n{"version":1,"changes":[]}\n${close}`,
  trailing: `${example('empty')}尾注`, malformed: `正文\n${open}\n{\n${close}`,
  extraKey: `正文\n${open}\n{"version":1,"changes":[],"chat_id":"fake"}\n${close}`,
  large: `正文\n${open}\n${' '.repeat(16 * 1024)}{}\n${close}`,
})) check(`reject ${id}`, () => assert.throws(() => split(reply)));

const numeric = split(example('practice')).changes[0];
for (const [id, changes] of Object.entries({
  unknown: [{ ...numeric, path: 'lilixia.affection' }],
  prototypePath: [{ ...numeric, path: '__proto__.polluted' }],
  decimal: [{ ...numeric, value: 1.5 }], string: [{ ...numeric, value: '2' }],
  zero: [{ ...numeric, value: 0 }], duplicatePath: [numeric, numeric],
  emptyReason: [{ ...numeric, reason: ' ' }], unknownKey: [{ ...numeric, message_id: 2 }],
  unknownGrade: [{ ...numeric, grade: 'toString' }],
  wrongGrade: [{ ...numeric, grade: 'minor' }],
  backwardsDay: [{ op: 'set', path: 'world.day', value: 0, reason: 'test' }],
  wrongPeriod: [{ op: 'set', path: 'world.period', value: 'invalid', reason: 'test' }],
  emptyColor: [{ op: 'append', path: 'noa.colors', value: '', reason: 'test' }],
})) check(`reject ${id}`, () => assert.throws(() => apply(changes)));
check('atomic failure preserves base', () => {
  const base = structuredClone(initial);
  assert.throws(() => apply([numeric, { ...numeric, path: 'noa.stamina', value: -101 }], base));
  assert.deepEqual(base, initial);
});
check('duplicate color remains one entry', () => {
  const result = apply([{ op: 'append', path: 'noa.colors', value: '红', reason: '再次提及已有颜色' }]);
  assert.deepEqual(result['noa.colors'], initial['noa.colors']);
});
check('original phases and acceptance denominator unchanged', () => {
  assert.deepEqual([...blueprint.matchAll(/^### (P\d) ·/gm)].map(match => match[1]), ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);
  assert.equal([...blueprint.matchAll(/^\| T\d\d \|/gm)].length, 17);
  assert.ok(blueprint.includes('runtimePersistentBlueprintBudget = 0'));
});
console.log(`BASELINE / LEGACY PASS: ${passed} checks; includes retired protocol examples, not current P0 or MVU Zod acceptance.`);
