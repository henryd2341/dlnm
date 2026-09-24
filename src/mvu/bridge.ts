import { z } from 'zod';
import { Schema } from './schema.ts';

// MVU 183d8ade injects $internal during updates. It is not a character field.
export const runtimeSchema = z.preprocess(input => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const { $internal, ...state } = input as Record<string, unknown>;
    return state;
  }
  return input;
}, Schema);

type SyncStatus = { status: 'valid' | 'pending'; reason: string };
type Variables = { stat_data: unknown; dlnm_sync?: SyncStatus; display_data?: Record<string, unknown> };
type Command = { full_match: string };
type Batch = { baseline: unknown; error: string };
const patchSchema = z.strictObject({
  op: z.enum(['replace', 'delta', 'insert']), path: z.string(), value: z.unknown(),
});
const fields = new Map<string, z.ZodType>(
  Object.entries(Schema.shape).flatMap(([group, schema]) =>
    Object.entries(schema.shape).map(([field, leaf]) => [`/${group}/${field}`, leaf] as const)),
);

// Validate only the wire envelope; MVU remains the command parser and calculator.
export function beginBatch(variables: Variables, commands: Command[], message: string): Batch {
  const batch: Batch = { baseline: structuredClone(variables.stat_data), error: '' };
  try {
    runtimeSchema.parse(variables.stat_data);
    const blocks = [...message.matchAll(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/g)];
    if (blocks.length !== 1 || (message.match(/<UpdateVariable>/g) ?? []).length !== 1) throw Error('需要一个完整更新块');
    const body = blocks[0]![1]!;
    const match = /^\s*<Analyze>[\s\S]*?<\/Analyze>\s*<JSONPatch>([\s\S]*?)<\/JSONPatch>\s*$/.exec(body);
    if (!match) throw Error('更新块结构不完整');
    const patches = z.array(patchSchema).parse(JSON.parse(match[1]!));
    if (commands.length !== patches.length) throw Error('MVU 解析命令与更新数组不一致');
    patches.forEach((patch, index) => {
      if (JSON.stringify(patchSchema.parse(JSON.parse(commands[index]!.full_match))) !== JSON.stringify(patch)) throw Error('混入其他更新命令');
      if (patch.op === 'insert') {
        if (patch.path !== '/noa/colors/-') throw Error('仅允许追加颜色');
        z.string().refine(value => value.trim().length > 0 && [...value].length <= 16).parse(patch.value);
      } else {
        const field = fields.get(patch.path);
        if (!field) throw Error('未知字段路径');
        if (patch.op === 'replace') field.parse(patch.value);
        else {
          if (!(field instanceof z.ZodNumber)) throw Error('增量只用于数值');
          z.number().int().parse(patch.value);
        }
      }
    });
  } catch (error) {
    batch.error = error instanceof Error ? error.message : '状态检查失败';
    commands.length = 0;
  }
  return batch;
}

export function finishBatch(variables: Variables, remaining: Command[], batch: Batch): void {
  const parsed = runtimeSchema.safeParse(variables.stat_data);
  const before = runtimeSchema.safeParse(batch.baseline);
  const dayReversed = parsed.success && before.success && parsed.data.world.day < before.data.world.day;
  // ponytail: conservative rollback includes upstream no-op leftovers; refine at P3.
  if (batch.error || remaining.length || !parsed.success || dayReversed) {
    variables.stat_data = batch.baseline;
    variables.dlnm_sync = { status: 'pending', reason: batch.error || '更新未完整通过 Schema；本轮已保留原状态' };
  } else {
    variables.stat_data = { ...(variables.stat_data as object), ...parsed.data };
    variables.dlnm_sync = { status: 'valid', reason: '' };
  }
  remaining.length = 0;
}

export function readStateAt(messageId: number) {
  if (!Number.isInteger(messageId) || messageId < 0) throw Error('需要明确的消息楼层');
  const message = getChatMessages(messageId, { include_swipes: true })[0];
  if (!message || message.role !== 'assistant') throw Error('所选楼层不是角色回复');
  const variables = Mvu.getMvuData({ type: 'message', message_id: messageId });
  if (!variables?.stat_data || (typeof variables.stat_data === 'object' && !Object.keys(variables.stat_data).length)) {
    throw Error(`消息 ${messageId} 的 MVU 初值尚未写入。`);
  }
  const parsed = runtimeSchema.safeParse(variables.stat_data);
  if (!parsed.success) {
    const paths = [...new Set(parsed.error.issues.map(issue => issue.path.join('.') || '根字段'))].join('、');
    throw Error(`消息 ${messageId} 已有 MVU 数据，但字段未通过校验：${paths}。原数据保持不变。`);
  }
  const state = parsed.data;
  return { messageId, swipeId: message.swipe_id, state, pending: variables.display_data?.dlnm_sync?.status === 'pending' };
}

// MVU saves display_data, but drops arbitrary top-level fields. Run after its display-data rebuild.
export function publishSyncStatus(variables: Variables) {
  if (variables.dlnm_sync) {
    variables.display_data = { ...variables.display_data, dlnm_sync: variables.dlnm_sync };
    delete variables.dlnm_sync;
  }
}
