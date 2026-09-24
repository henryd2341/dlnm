import assert from 'node:assert/strict';
import { Schema, initialState, type State } from '../src/mvu/schema.ts';

let passed = 0;
function check(name: string, run: () => void) {
  try { run(); passed++; }
  catch (error) { throw new Error(name, { cause: error }); }
}

type Path = [keyof State, string];
const numeric: Array<[Path, number, number]> = [
  [['world', 'day'], 1, Number.MAX_SAFE_INTEGER],
  [['noa', 'stamina'], 0, 100],
  [['noa', 'cleaning'], 0, 1000],
  [['noa', 'cooking'], 0, 1000],
  [['noa', 'laundry'], 0, 1000],
  [['noa', 'etiquette'], 0, 1000],
  [['noa', 'knowledge'], 0, 1000],
  [['noa', 'charm'], 0, 1000],
  [['noa', 'affection'], 0, 1000],
  [['noa', 'sensitivity'], 0, 1000],
  [['noa', 'desire'], 0, 100],
  [['lilixia', 'mana'], 0, 100],
];
const text: Array<[Path, number]> = [
  [['world', 'location'], 80],
  [['lilixia', 'appearance'], 120],
  [['lilixia', 'clothing'], 120],
  [['lilixia', 'expression'], 120],
  [['lilixia', 'condition'], 120],
];
const leaves: Path[] = [
  ['world', 'day'], ['world', 'period'], ['world', 'location'],
  ['noa', 'stamina'], ['noa', 'cleaning'], ['noa', 'cooking'], ['noa', 'laundry'],
  ['noa', 'etiquette'], ['noa', 'knowledge'], ['noa', 'charm'], ['noa', 'affection'],
  ['noa', 'sensitivity'], ['noa', 'desire'], ['noa', 'colors'],
  ['lilixia', 'mana'], ['lilixia', 'appearance'], ['lilixia', 'clothing'],
  ['lilixia', 'expression'], ['lilixia', 'condition'],
];

function changed(path: Path, value: unknown): State {
  const state = structuredClone(initialState) as Record<string, Record<string, unknown>>;
  state[path[0]][path[1]] = value;
  return state as State;
}

check('all 19 documented initial values', () => {
  assert.equal(leaves.length, 19);
  assert.deepEqual(Schema.parse(initialState), initialState);
});

for (const [path, minimum, maximum] of numeric) {
  const label = path.join('.');
  check(`${label} boundaries`, () => {
    assert.equal((Schema.parse(changed(path, minimum)) as any)[path[0]][path[1]], minimum);
    assert.equal((Schema.parse(changed(path, maximum)) as any)[path[0]][path[1]], maximum);
    assert.throws(() => Schema.parse(changed(path, minimum - 1)));
    if (maximum !== Number.MAX_SAFE_INTEGER) assert.throws(() => Schema.parse(changed(path, maximum + 1)));
    assert.throws(() => Schema.parse(changed(path, minimum + 0.5)));
    assert.throws(() => Schema.parse(changed(path, String(minimum))));
  });
}

check('day rejects unsafe integer', () => assert.throws(() => Schema.parse(changed(['world', 'day'], Number.MAX_SAFE_INTEGER + 1))));
check('period accepts only documented values', () => {
  for (const period of ['清晨', '上午', '午后', '傍晚', '夜间', '深夜']) Schema.parse(changed(['world', 'period'], period));
  assert.throws(() => Schema.parse(changed(['world', 'period'], '午夜')));
});

for (const [path, maximum] of text) {
  const label = path.join('.');
  check(`${label} text boundaries`, () => {
    assert.equal((Schema.parse(changed(path, '字')) as any)[path[0]][path[1]], '字');
    Schema.parse(changed(path, '字'.repeat(maximum)));
    assert.throws(() => Schema.parse(changed(path, '字'.repeat(maximum + 1))));
    assert.throws(() => Schema.parse(changed(path, ' \n\t ')));
  });
}

check('duplicate colors are deduplicated without mutating input', () => {
  const input = changed(['noa', 'colors'], ['红', '绿', '红', '蓝']);
  const before = structuredClone(input);
  assert.deepEqual(Schema.parse(input).noa.colors, ['红', '绿', '蓝']);
  assert.deepEqual(input, before);
});
check('invalid color rejects the entire state', () => {
  assert.throws(() => Schema.parse(changed(['noa', 'colors'], ['红', ' '])));
  assert.throws(() => Schema.parse(changed(['noa', 'colors'], ['红', '色'.repeat(17)])));
  assert.throws(() => Schema.parse(changed(['noa', 'colors'], '红')));
});

check('every field is required', () => {
  for (const path of leaves) {
    const state = structuredClone(initialState) as Record<string, Record<string, unknown>>;
    delete state[path[0]][path[1]];
    assert.throws(() => Schema.parse(state), path.join('.'));
  }
});
check('unknown fields are rejected at every object level', () => {
  assert.throws(() => Schema.parse({ ...initialState, extra: true }));
  assert.throws(() => Schema.parse({ ...initialState, world: { ...initialState.world, extra: true } }));
  assert.throws(() => Schema.parse({ ...initialState, noa: { ...initialState.noa, extra: true } }));
  assert.throws(() => Schema.parse({ ...initialState, lilixia: { ...initialState.lilixia, extra: true } }));
});
check('successful parse does not mutate the full input', () => {
  const input = structuredClone(initialState);
  const before = structuredClone(input);
  Schema.parse(input);
  assert.deepEqual(input, before);
});

console.log(`MVU SCHEMA PASS: ${passed} regression groups; 19 fields, no update protocol or host acceptance implied.`);
