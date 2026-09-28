import { beginBatch, finishBatch, publishSyncStatus, readStateAt, runtimeSchema } from './bridge.ts';
import { cardName as ownedName } from '../card-content.ts';

// Source/ordering evidence is recorded in DESIGN 7.5 and NEXT. No model calls.
const schemaUrl = 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource@f2f87def1cd1b30143b7aceb5525e758efacebba/dist/util/mvu_zod.js';

async function boot() {
  if (getCurrentCharacterName() !== ownedName) return;
  let closed = false;
  const cleanup: (() => void)[] = [];
  window.addEventListener('pagehide', () => { closed = true; cleanup.forEach(stop => stop()); }, { once: true });
  let timer: ReturnType<typeof setTimeout>;
  const deadline = Date.now() + 15000;
  try {
    await Promise.race([
      waitGlobalInitialized('Mvu'),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('MVU 尚未就绪')), 15000); }),
    ]);
  } finally { clearTimeout(timer!); }
  if (closed || getCurrentCharacterName() !== ownedName) return;
  // An older global may precede the pinned card runtime during the two script startups.
  while ((Mvu.events.VARIABLE_INITIALIZED as string) !== 'mag_variable_initialized' && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (closed || getCurrentCharacterName() !== ownedName) return;
  }
  if ((Mvu.events.VARIABLE_INITIALIZED as string) !== 'mag_variable_initialized') throw Error('MVU 事件版本与制作基线不同');
  const { registerMvuSchema } = await import(/* @vite-ignore */ schemaUrl);
  if (closed || getCurrentCharacterName() !== ownedName) return;
  registerMvuSchema(runtimeSchema);

  const batches = new WeakMap<object, ReturnType<typeof beginBatch>>();
  cleanup.push(eventMakeFirst(Mvu.events.COMMAND_PARSED, (variables, commands, message) => {
    batches.set(variables, beginBatch(variables, commands, message));
  }).stop);
  cleanup.push(eventMakeLast(`${Mvu.events.COMMAND_PARSED}_for_zod`, (variables: Mvu.MvuData, commands: Mvu.CommandInfo[]) => {
    const batch = batches.get(variables);
    if (!batch) throw Error('本轮缺少 Schema 校验起点');
    finishBatch(variables, commands, batch);
    batches.delete(variables);
  }).stop);
  // StageDog clears display_data in its Zod end hook; publish after that cleanup, before MVU saves.
  cleanup.push(eventMakeLast(`${Mvu.events.VARIABLE_UPDATE_ENDED}_for_zod`, publishSyncStatus).stop);
  cleanup.push(registerMacroLike(/\{\{dlnm_state\}\}/g, () => {
    if (getCurrentCharacterName() !== ownedName) return '状态待同步：非专用测试对象';
    try {
      let id = getLastMessageId();
      if (getChatMessages(id)[0]?.role === 'user') id -= 1;
      const result = readStateAt(id);
      if (result.pending) return '状态待同步：暂停推进，先修复本轮更新。';
      return JSON.stringify(result.state).replace(/[<>&]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
    } catch { return '状态待同步：没有可用的当前 MVU 数据，先检查初始化或修复当前回复。'; }
  }).unregister);
}

void boot().catch(error => console.error('[DLNM MVU] 接入未完成', error));
