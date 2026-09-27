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
  [['noah', 'stamina'], 0, 100],
  [['noah', 'cleaning'], 0, 1000],
  [['noah', 'cooking'], 0, 1000],
  [['noah', 'laundry'], 0, 1000],
  [['noah', 'etiquette'], 0, 1000],
  [['noah', 'knowledge'], 0, 1000],
  [['noah', 'charm'], 0, 1000],
  [['noah', 'affection'], 0, 1000],
  [['noah', 'sensitivity'], 0, 1000],
  [['noah', 'desire'], 0, 100],
  [['lilicia', 'mana'], 0, 100],
];
const text: Array<[Path, number]> = [
  [['world', 'location'], 80],
  [['noah', 'clothing'], 120],
  [['noah', 'expression'], 120],
  [['lilicia', 'appearance'], 120],
  [['lilicia', 'clothing'], 120],
  [['lilicia', 'expression'], 120],
  [['lilicia', 'condition'], 120],
  [['seraphina', 'clothing'], 120],
  [['seraphina', 'expression'], 120],
  [['tanuki', 'expression'], 120],
];
const leaves: Path[] = [
  ['world', 'day'], ['world', 'period'], ['world', 'location'],
  ['noah', 'stamina'], ['noah', 'cleaning'], ['noah', 'cooking'], ['noah', 'laundry'],
  ['noah', 'etiquette'], ['noah', 'knowledge'], ['noah', 'charm'], ['noah', 'affection'],
  ['noah', 'sensitivity'], ['noah', 'desire'], ['noah', 'colors'], ['noah', 'clothing'], ['noah', 'expression'],
  ['lilicia', 'mana'], ['lilicia', 'appearance'], ['lilicia', 'clothing'],
  ['lilicia', 'expression'], ['lilicia', 'condition'],
  ['seraphina', 'clothing'], ['seraphina', 'expression'], ['tanuki', 'expression'],
];

function changed(path: Path, value: unknown): State {
  const state = structuredClone(initialState) as Record<string, Record<string, unknown>>;
  state[path[0]][path[1]] = value;
  return state as State;
}

check('all 24 documented initial values', () => {
  assert.equal(leaves.length, 24);
  assert.deepEqual(Schema.parse(initialState), initialState);
  assert.equal(Object.keys(initialState.noah).length, 13);
  assert.deepEqual(
    { clothing: initialState.noah.clothing, expression: initialState.noah.expression },
    { clothing: '女仆服', expression: '神态平静' },
  );
  assert.deepEqual(initialState.lilicia, {
    mana: 100,
    appearance: '平日模样',
    clothing: '居家便服',
    expression: '神态放松',
    condition: '无明显不适',
  });
  assert.deepEqual(initialState.seraphina, { clothing: '修女服，戴头纱', expression: '神态平静' });
  assert.deepEqual(initialState.tanuki, { expression: '神态平静' });
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
  const input = changed(['noah', 'colors'], ['红', '绿', '红', '蓝']);
  const before = structuredClone(input);
  assert.deepEqual(Schema.parse(input).noah.colors, ['红', '绿', '蓝']);
  assert.deepEqual(input, before);
});
check('invalid color rejects the entire state', () => {
  assert.throws(() => Schema.parse(changed(['noah', 'colors'], ['红', ' '])));
  assert.throws(() => Schema.parse(changed(['noah', 'colors'], ['红', '色'.repeat(17)])));
  assert.throws(() => Schema.parse(changed(['noah', 'colors'], '红')));
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
  assert.throws(() => Schema.parse({ ...initialState, noah: { ...initialState.noah, extra: true } }));
  assert.throws(() => Schema.parse({ ...initialState, lilicia: { ...initialState.lilicia, extra: true } }));
  assert.throws(() => Schema.parse({ ...initialState, seraphina: { ...initialState.seraphina, extra: true } }));
  assert.throws(() => Schema.parse({ ...initialState, tanuki: { ...initialState.tanuki, extra: true } }));
});
check('successful parse does not mutate the full input', () => {
  const input = structuredClone(initialState);
  const before = structuredClone(input);
  Schema.parse(input);
  assert.deepEqual(input, before);
});

console.log(`MVU SCHEMA PASS: ${passed} regression groups; 24 fields, no update protocol or host acceptance implied.`);
