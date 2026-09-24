// RETIRED 2026-09-23: historical native-variable experiment; not the MVU Zod implementation.
export const P1_INITIAL = { noa: { stamina: 100 } };

const OPEN = '<lily_delta>';
const CLOSE = '</lily_delta>';
const SOURCE_KEYS = ['chatKey', 'messageId', 'swipeId', 'contentHash', 'parentHash'];
const GRADES = { minor: [1, 5], moderate: [6, 15], major: [16, 30] };

function plain(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be a plain object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  return value;
}

function exactKeys(value, expected, label) {
  plain(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has invalid keys`);
  }
}

function validState(state) {
  exactKeys(state, ['noa'], 'state');
  exactKeys(state.noa, ['stamina'], 'state.noa');
  if (!Number.isSafeInteger(state.noa.stamina) || state.noa.stamina < 0 || state.noa.stamina > 100) {
    throw new RangeError('state.noa.stamina must be an integer from 0 to 100');
  }
}

function validChange(change, seen) {
  exactKeys(change, ['op', 'path', 'value', 'grade', 'reason'], 'change');
  if (change.op !== 'add' || change.path !== 'noa.stamina') throw new TypeError('only add/noa.stamina is allowed');
  if (seen.has(change.path)) throw new TypeError('a path may only occur once per reply');
  seen.add(change.path);
  if (!Number.isSafeInteger(change.value) || change.value === 0) throw new TypeError('change.value must be a nonzero integer');
  if (!Object.hasOwn(GRADES, change.grade)) throw new TypeError('change.grade is invalid');
  const [minimum, maximum] = GRADES[change.grade];
  if (Math.abs(change.value) < minimum || Math.abs(change.value) > maximum) throw new RangeError('change.value does not match its grade');
  if (typeof change.reason !== 'string' || !change.reason.trim() || [...change.reason].length > 240) {
    throw new TypeError('change.reason must contain 1 to 240 characters');
  }
}

function validChanges(changes) {
  if (!Array.isArray(changes) || changes.length > 32) throw new TypeError('changes must be an array of at most 32 items');
  const seen = new Set();
  for (const change of changes) validChange(change, seen);
}

function validSource(source) {
  exactKeys(source, SOURCE_KEYS, 'source');
  if (typeof source.chatKey !== 'string' || !source.chatKey.trim()) throw new TypeError('source.chatKey must be nonempty');
  for (const key of ['messageId', 'swipeId']) {
    if (!Number.isSafeInteger(source[key]) || source[key] < 0) throw new TypeError(`source.${key} must be a nonnegative integer`);
  }
  for (const key of ['contentHash', 'parentHash']) {
    if (typeof source[key] !== 'string' || !/^[a-f0-9]{64}$/u.test(source[key])) throw new TypeError(`source.${key} must be a SHA-256 hex digest`);
  }
}

function sameSource(left, right) {
  return SOURCE_KEYS.every(key => left?.[key] === right[key]);
}

function validRecord(record) {
  exactKeys(record, ['schemaVersion', 'scope', 'status', 'state', 'source'], 'record');
  if (record.schemaVersion !== 1 || record.scope !== 'p1-probe' || record.status !== 'valid') throw new TypeError('record metadata is invalid');
  validState(record.state);
  validSource(record.source);
}

export function parseP1Reply(text) {
  if (typeof text !== 'string') throw new TypeError('reply must be text');
  const reply = text.replaceAll('\r\n', '\n');
  if (reply.split(OPEN).length !== 2 || reply.split(CLOSE).length !== 2) throw new SyntaxError('reply must contain one delta block');
  const match = reply.match(/^([\s\S]+)\n<lily_delta>\n([\s\S]+)\n<\/lily_delta>\s*$/u);
  if (!match || !match[1].trim()) throw new SyntaxError('reply needs a nonempty body and final standalone delta block');
  if (new TextEncoder().encode(match[2]).byteLength > 16 * 1024) throw new RangeError('delta block exceeds 16 KiB');
  const payload = JSON.parse(match[2]);
  exactKeys(payload, ['version', 'changes'], 'payload');
  if (payload.version !== 1) throw new TypeError('payload.version must be 1');
  validChanges(payload.changes);
  return { body: match[1], changes: payload.changes };
}

export function applyP1Changes(base, changes) {
  validState(base);
  validChanges(changes);
  let stamina = base.noa.stamina;
  for (const change of changes) stamina += change.value;
  if (stamina < 0 || stamina > 100) throw new RangeError('change would move noa.stamina outside 0 to 100');
  return { noa: { stamina } };
}

export function settleP1(base, text, source, previous) {
  validState(base);
  validSource(source);
  if (previous != null && plain(previous, 'previous').source && sameSource(previous.source, source)) {
    validRecord(previous);
    return { record: previous, changed: false };
  }
  const { changes } = parseP1Reply(text);
  const state = applyP1Changes(base, changes);
  return {
    record: {
      schemaVersion: 1,
      scope: 'p1-probe',
      status: 'valid',
      state,
      source: Object.fromEntries(SOURCE_KEYS.map(key => [key, source[key]])),
    },
    changed: true,
  };
}
