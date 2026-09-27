// Template reference: StageDog/tavern_sync, e411f26 (push + whole-worldbook replacement).
// Use ST's native HTTP endpoints instead of its partial Character facade / Socket.IO bridge.
// API authority: SillyTavern aa50edcf4, src/endpoints/{characters,worldinfo}.js and src/util.js.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { tavernOrigin, characterFile } from './delivery.config.mjs';

// Same field mapping as the installed host's public/scripts/world-info.js: convertCharacterBook.
export function toWorldbook(book) {
  return {
    originalData: book,
    entries: Object.fromEntries(book.entries.map((entry, index) => {
      const extra = entry.extensions ?? {};
      const uid = entry.id ?? index;
      return [uid, {
        uid, key: entry.keys, keysecondary: entry.secondary_keys ?? [],
        comment: entry.comment ?? '', content: entry.content,
        constant: entry.constant ?? false, selective: entry.selective ?? false,
        order: entry.insertion_order, disable: !entry.enabled, addMemo: !!entry.comment,
        position: extra.position ?? (entry.position === 'before_char' ? 0 : 1),
        excludeRecursion: extra.exclude_recursion ?? false,
        preventRecursion: extra.prevent_recursion ?? false,
        delayUntilRecursion: extra.delay_until_recursion ?? false,
        displayIndex: extra.display_index ?? index,
        probability: extra.probability ?? 100, useProbability: extra.useProbability ?? true,
        depth: extra.depth ?? 4, selectiveLogic: extra.selectiveLogic ?? 0,
        outletName: extra.outlet_name ?? '', group: extra.group ?? '',
        groupOverride: extra.group_override ?? false, groupWeight: extra.group_weight ?? 100,
        scanDepth: extra.scan_depth ?? null, caseSensitive: extra.case_sensitive ?? null,
        matchWholeWords: extra.match_whole_words ?? null, useGroupScoring: extra.use_group_scoring ?? null,
        automationId: extra.automation_id ?? '', role: extra.role ?? 0,
        vectorized: extra.vectorized ?? false, sticky: extra.sticky ?? null,
        cooldown: extra.cooldown ?? null, delay: extra.delay ?? null,
        matchPersonaDescription: extra.match_persona_description ?? false,
        matchCharacterDescription: extra.match_character_description ?? false,
        matchCharacterPersonality: extra.match_character_personality ?? false,
        matchCharacterDepthPrompt: extra.match_character_depth_prompt ?? false,
        matchScenario: extra.match_scenario ?? false, matchCreatorNotes: extra.match_creator_notes ?? false,
        extensions: extra, triggers: extra.triggers ?? [], ignoreBudget: extra.ignore_budget ?? false,
      }];
    })),
  };
}

export function characterPatch(card, avatar) {
  const data = card.data;
  // Update V1 mirrors too; leave avatar pixels, chat identity and unrelated host fields to ST.
  return {
    avatar, data,
    ...Object.fromEntries(['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'tags']
      .map(key => [key, data[key]])),
    creatorcomment: data.creator_notes,
  };
}

export async function pushCard(card, avatar, origin, cookie = '', request = fetch) {
  const cookies = new Map(cookie.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const split = part.indexOf('=');
    return [part.slice(0, split), part.slice(split + 1)];
  }));
  let token;
  async function send(path, body) {
    const response = await request(new URL(path, origin), {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        ...(cookies.size ? { Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') } : {}),
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const value of response.headers.getSetCookie()) {
      const part = value.split(';', 1)[0];
      const split = part.indexOf('=');
      cookies.set(part.slice(0, split), part.slice(split + 1));
    }
    if (!response.ok) throw Error(`${path}: HTTP ${response.status} ${response.statusText}`);
    return response;
  }
  token = (await (await send('/csrf-token')).json()).token;
  const book = card.data.character_book;
  await send('/api/worldinfo/edit', { name: book.name, data: toWorldbook(book) });
  // No diff, remote readback, entry-count gate, automatic snapshot, or retry.
  try {
    await send('/api/characters/merge-attributes', characterPatch(card, avatar));
  } catch (error) {
    throw Error(`世界书已覆盖；角色卡更新失败。修正目标文件名或连接后重新推送。${error.message}`);
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    options: { avatar: { type: 'string', default: characterFile }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (values.help || positionals.length === 0) {
    console.log('node tavern_sync.mjs push [--avatar "角色文件名.png"]\n使用已有构建直接覆盖世界书并更新角色卡；npm run sync:push 会先重新构建。\n目标地址在 delivery.config.mjs；登录模式可在 TAVERN_COOKIE 环境变量中传入已有会话。');
    return;
  }
  if (positionals.length !== 1 || positionals[0] !== 'push') throw Error('使用 push 命令或 --help');
  const card = JSON.parse(readFileSync(new URL('./artifacts/dlnm-sync.json', import.meta.url), 'utf8'));
  await pushCard(card, values.avatar, tavernOrigin, process.env.TAVERN_COOKIE);
  console.log(`服务端已接受世界书与角色卡更新：${values.avatar}\n请刷新酒馆以重新读取卡、世界书和前端；未执行回读校验。`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`[DLNM sync] ${error.message}`); process.exitCode = 1; });
}
