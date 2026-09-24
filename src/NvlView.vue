<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { State } from './mvu/schema.ts';
import type { NvlPage } from './nvl.ts';

const props = defineProps<{
  pages: NvlPage[];
  selectedId: number;
  snapshot: State | null;
  stateMessageId: number | null;
  draft: string;
  busy: boolean;
  connected: boolean;
  canSend: boolean;
  error: string;
  chatKey: string;
  hosted: boolean;
  mode: 'fullscreen' | 'panel';
}>();

const emit = defineEmits<{
  'update:draft': [value: string];
  select: [id: number];
  send: [];
  stop: [];
  refresh: [];
  'toggle-host': [];
  'change-mode': [mode: 'fullscreen' | 'panel'];
}>();

const reading = ref<HTMLElement | null>(null);
const composing = ref(false);
const positions = new Map<string, number>();

const selectedIndex = computed(() => props.pages.findIndex(page => page.id === props.selectedId));
const selectedPage = computed(() => selectedIndex.value < 0 ? null : props.pages[selectedIndex.value]);
const latestPage = computed(() => props.pages[props.pages.length - 1] ?? null);
const positionKey = computed(() => selectedPage.value
  ? `${props.chatKey}:${selectedPage.value.id}:${selectedPage.value.swipe}`
  : `${props.chatKey}:empty`);
const sendDisabled = computed(() => props.busy || !props.canSend || !props.draft.trim());

const traitGroups = computed(() => props.snapshot ? [
  {
    label: '技能', color: '橙', items: [
      ['清洁', props.snapshot.noa.cleaning, 1000],
      ['料理', props.snapshot.noa.cooking, 1000],
      ['洗涤', props.snapshot.noa.laundry, 1000],
    ],
  },
  {
    label: '教养', color: '蓝', items: [
      ['礼仪', props.snapshot.noa.etiquette, 1000],
      ['知识', props.snapshot.noa.knowledge, 1000],
    ],
  },
  {
    label: '人格', color: '绿', items: [
      ['魅力', props.snapshot.noa.charm, 1000],
      ['亲爱', props.snapshot.noa.affection, 1000],
    ],
  },
  {
    label: '本能', color: '红', items: [
      ['感度', props.snapshot.noa.sensitivity, 1000],
      ['欲求', props.snapshot.noa.desire, 100],
    ],
  },
] as const : []);

function storageKey(key: string) {
  return `dlnm:nvl-scroll:${key}`;
}

function readPosition(key: string) {
  if (positions.has(key)) return positions.get(key) ?? 0;
  try {
    const stored = sessionStorage.getItem(storageKey(key));
    const value = stored === null ? 0 : Number(stored);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function savePosition(key = positionKey.value) {
  if (!reading.value) return;
  const value = reading.value.scrollTop;
  positions.set(key, value);
  try {
    sessionStorage.setItem(storageKey(key), String(value));
  } catch {
    // Memory remains authoritative for this mounted view when storage is unavailable.
  }
}

function restorePosition(key: string) {
  if (reading.value) reading.value.scrollTop = readPosition(key);
}

function selectRelative(offset: number) {
  const page = props.pages[selectedIndex.value + offset];
  if (page) emit('select', page.id);
}

function hasColor(color: string) {
  return props.snapshot?.noa.colors.some(value => value === color || value === `${color}色`) ?? false;
}

function meterWidth(value: number, maximum: number) {
  return `${Math.max(0, Math.min(100, value / maximum * 100))}%`;
}

function onDraft(event: Event) {
  emit('update:draft', (event.target as HTMLTextAreaElement).value);
}

function requestSend() {
  if (!sendDisabled.value) emit('send');
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || !event.ctrlKey || event.isComposing || composing.value) return;
  event.preventDefault();
  requestSend();
}

watch(positionKey, (next, previous) => {
  savePosition(previous);
  nextTick(() => { if (positionKey.value === next) restorePosition(next); });
}, { flush: 'pre' });

onMounted(() => restorePosition(positionKey.value));
onBeforeUnmount(() => savePosition());
</script>

<template>
  <main class="nvl-shell" aria-label="《恶魔少女与黑之女仆》阅读界面" @keydown.stop @keyup.stop>
    <header class="nvl-header">
      <div class="brand">
        <span class="moon" aria-hidden="true"></span>
        <div>
          <p>月光宅邸 · NVL 阅读</p>
          <strong>恶魔少女与黑之女仆</strong>
        </div>
      </div>
      <dl class="scene-meta">
        <div><dt>日期</dt><dd>{{ snapshot ? `续篇第 ${snapshot.world.day} 日` : '无有效数据' }}</dd></div>
        <div><dt>时段</dt><dd>{{ snapshot?.world.period ?? '无有效数据' }}</dd></div>
        <div><dt>地点</dt><dd>{{ snapshot?.world.location ?? '无有效数据' }}</dd></div>
      </dl>
      <div class="header-actions">
        <span class="connection" :class="{ online: connected }">{{ connected ? '宿主已连接' : '宿主未连接' }}</span>
        <button type="button" @click="emit('change-mode', mode === 'fullscreen' ? 'panel' : 'fullscreen')">{{ mode === 'fullscreen' ? '面板模式' : '浏览器全屏阅读' }}</button>
        <button type="button" :disabled="!connected" @click="emit('toggle-host')">返回酒馆</button>
        <button type="button" @click="emit('refresh')">重新读取</button>
      </div>
    </header>

    <p v-if="error || !connected" class="error-banner" role="status">
      {{ error || '未连接酒馆宿主，真实聊天、状态与生成均不可用。' }}
    </p>

    <div class="nvl-stage">
      <details class="character-panel" open>
        <summary>人物与状态</summary>
        <div v-if="snapshot" class="character-list">
          <small class="state-source">状态来源：消息 {{ stateMessageId ?? '未标记' }}</small>
          <section class="character-card" aria-labelledby="noa-name">
            <div class="portrait portrait-noa" role="img" aria-label="诺雅头像占位">
              <span>头像占位</span><b>诺雅</b>
            </div>
            <div class="character-body">
              <h2 id="noa-name">诺雅</h2>
              <div class="primary-meter">
                <span>体力</span><b>{{ snapshot.noa.stamina }} / 100</b>
                <i><i :style="{ width: meterWidth(snapshot.noa.stamina, 100) }"></i></i>
              </div>
              <div v-for="group in traitGroups" :key="group.label" class="trait-group">
                <h3 :class="['color-label', `tone-${group.color}`, { active: hasColor(group.color) }]">
                  {{ group.label }} · {{ group.color }}
                </h3>
                <dl>
                  <div v-for="item in group.items" :key="item[0]">
                    <dt>{{ item[0] }}</dt><dd>{{ item[1] }} / {{ item[2] }}</dd>
                  </div>
                </dl>
              </div>
              <p class="colors">已获得颜色：{{ snapshot.noa.colors.length ? snapshot.noa.colors.join('、') : '暂无' }}</p>
            </div>
          </section>

          <section class="character-card" aria-labelledby="lilixia-name">
            <div class="portrait portrait-lilixia" role="img" aria-label="莉莉希雅头像占位">
              <span>头像占位</span><b>莉莉希雅</b>
            </div>
            <div class="character-body">
              <h2 id="lilixia-name">莉莉希雅</h2>
              <div class="primary-meter">
                <span>魔力</span><b>{{ snapshot.lilixia.mana }} / 100</b>
                <i><i :style="{ width: meterWidth(snapshot.lilixia.mana, 100) }"></i></i>
              </div>
              <dl class="description-list">
                <div><dt>外貌</dt><dd>{{ snapshot.lilixia.appearance }}</dd></div>
                <div><dt>服装</dt><dd>{{ snapshot.lilixia.clothing }}</dd></div>
                <div><dt>神态</dt><dd>{{ snapshot.lilixia.expression }}</dd></div>
                <div><dt>状态</dt><dd>{{ snapshot.lilixia.condition }}</dd></div>
              </dl>
            </div>
          </section>
        </div>
        <p v-else class="empty-state" role="status">当前回复没有通过校验的有效状态数据。</p>
      </details>

      <section class="reader-column" aria-label="当前阅读内容">
        <div ref="reading" class="reading-scroll" tabindex="0" @scroll.passive="savePosition()">
          <div class="scene-placeholder" aria-label="宅邸与月光城市场景占位">
            <svg viewBox="0 0 1000 620" aria-hidden="true">
              <path d="M0 0h1000v620H0z" fill="#151515" />
              <path d="M80 70h360v330H80zM115 105h135v120H115zM270 105h135v120H270z" fill="none" stroke="#777" stroke-width="8" />
              <path d="M250 70v330M80 245h360M0 470h1000M545 390h300l70 80H475zM600 470v90M800 470v90" fill="none" stroke="#777" stroke-width="8" />
              <path d="M690 90l45 65-45 65-45-65zM865 60v250M835 105h60M830 150h70M825 195h80" fill="none" stroke="#a7a7a7" stroke-width="7" />
              <circle cx="185" cy="165" r="46" fill="#d6d6d6" opacity=".75" />
            </svg>
            <span>宅邸 / 瑟雷妮亚场景占位</span>
          </div>

          <article v-if="selectedPage" class="nvl-page">
            <section class="prompt-block" aria-label="本轮玩家输入">
              <b>诺雅</b>
              <p>{{ selectedPage.prompt || '本轮没有可显示的用户输入。' }}</p>
            </section>
            <section class="reply-block" aria-label="本轮回复">
              <div class="reply-heading">
                <span>{{ selectedPage.name || '回复' }}</span>
                <small>消息 {{ selectedPage.id }} · 分支 {{ selectedPage.swipe + 1 }}</small>
              </div>
              <p>{{ selectedPage.text }}</p>
            </section>
          </article>
          <div v-else class="empty-reader" role="status">
            <strong>没有可显示的真实回复</strong>
            <span>连接酒馆并选择一条有效的助手回复后，这里才会显示正文。</span>
          </div>
        </div>

        <nav class="reading-nav" aria-label="回复阅读导航">
          <button type="button" :disabled="selectedIndex <= 0" @click="selectRelative(-1)">← 前一轮</button>
          <details class="history-menu">
            <summary>历史 {{ pages.length }}</summary>
            <ol>
              <li v-for="page in pages" :key="`${page.id}:${page.swipe}`">
                <button
                  type="button"
                  :aria-current="page.id === selectedId ? 'page' : undefined"
                  @click="emit('select', page.id)"
                >
                  <span>消息 {{ page.id }} · 分支 {{ page.swipe + 1 }}</span>
                  <small>{{ page.prompt || '无用户输入摘要' }}</small>
                </button>
              </li>
            </ol>
          </details>
          <button type="button" :disabled="selectedIndex < 0 || selectedIndex >= pages.length - 1" @click="selectRelative(1)">后一轮 →</button>
          <button
            type="button"
            :disabled="!latestPage || latestPage.id === selectedId"
            @click="latestPage && emit('select', latestPage.id)"
          >返回最新</button>
        </nav>
      </section>
    </div>

    <section class="composer" aria-label="诺雅的输入区">
      <label for="nvl-draft">以诺雅的身份回应</label>
      <textarea
        id="nvl-draft"
        :value="draft"
        :disabled="!connected"
        rows="3"
        placeholder="写下行动或回应……"
        @input="onDraft"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @keydown="onComposerKeydown"
      ></textarea>
      <div class="composer-actions">
        <small>Ctrl + Enter 发送；输入法选字期间不会触发</small>
        <button v-if="busy" type="button" class="stop-button" @click="emit('stop')">停止生成</button>
        <button type="button" class="send-button" :disabled="sendDisabled" @click="requestSend">发送</button>
      </div>
    </section>

    <footer>P2 NVL 界面原型 · 人物头像与宅邸 / 城市场景均为标注占位素材 · 待桌面与手机手动验收</footer>
  </main>
</template>

<style scoped>
:global(*) { box-sizing: border-box; }
.error-banner { grid-row: 2; }
.composer { grid-row: 4; }
footer { grid-row: 5; }

.nvl-shell {
  --paper: #e8e5df;
  --ink: #f3f1ed;
  --muted: #aaa7a1;
  --panel: #171717;
  --line: #4a4946;
  height: 100vh;
  height: var(--dlnm-surface-height, 100dvh);
  display: grid;
  grid-template-rows: auto auto minmax(240px, 1fr) auto auto;
  overflow: auto;
  color: var(--ink);
  background: #090909;
  font-family: "Noto Serif SC", "Songti SC", "Microsoft YaHei", serif;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

button,
summary,
textarea { font: inherit; }

button,
summary {
  min-height: 44px;
  color: var(--ink);
}

button {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: .55rem .85rem;
  background: #202020;
  cursor: pointer;
}

button:hover:not(:disabled) { background: #303030; }
button:disabled { opacity: .4; cursor: not-allowed; }
button:focus-visible,
summary:focus-visible,
textarea:focus-visible,
.reading-scroll:focus-visible { outline: 3px solid #dedbd5; outline-offset: 2px; }

.nvl-header {
  grid-row: 1;
  min-height: 78px;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(260px, 1.2fr) auto;
  align-items: center;
  gap: 1.25rem;
  padding: .7rem 1.2rem;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(90deg, #101010, #242424 48%, #111);
}

.brand { display: flex; align-items: center; gap: .8rem; }
.brand p { margin: 0; color: var(--muted); font-size: .75rem; letter-spacing: .16em; }
.brand strong { font-size: 1.05rem; letter-spacing: .08em; }
.moon { width: 38px; height: 38px; border: 2px solid #d7d4ce; border-radius: 50%; box-shadow: inset 10px -4px 0 #101010; flex: 0 0 auto; }

.scene-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; }
.scene-meta div { padding: 0 .85rem; border-left: 1px solid var(--line); }
.scene-meta dt { color: var(--muted); font-size: .72rem; }
.scene-meta dd { margin: 0; font-size: .9rem; }
.header-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: .45rem; }
.connection { color: #c1aaa7; font-size: .75rem; white-space: nowrap; }
.connection::before { content: ""; display: inline-block; width: .55rem; height: .55rem; margin-right: .35rem; border-radius: 50%; background: #8a3d35; }
.connection.online { color: #aac0ad; }
.connection.online::before { background: #4f8057; }

.error-banner { margin: 0; padding: .45rem 1rem; border-bottom: 1px solid #75433f; color: #f1d6d2; background: #391c1a; font-size: .86rem; }

.nvl-stage {
  grid-row: 3;
  min-height: 0;
  display: grid;
  grid-template-columns: clamp(280px, 27vw, 380px) minmax(0, 1fr);
  gap: 1px;
  background: var(--line);
}

.character-panel { min-height: 0; overflow: auto; background: #121212; }
.character-panel > summary { display: block; padding: .7rem 1rem; cursor: pointer; }
.character-list { padding: .9rem; display: grid; gap: .9rem; }
.state-source { color: var(--muted); }
.character-card { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: .8rem; padding: .75rem; border: 1px solid #393939; background: #1c1c1c; }
.portrait { position: relative; height: 116px; display: grid; place-content: center; overflow: hidden; border: 1px solid #6a6863; background: linear-gradient(135deg, #555, #151515 70%); text-align: center; }
.portrait::before { content: ""; width: 34px; height: 34px; margin: auto; border: 2px solid #a5a39e; border-radius: 50%; }
.portrait::after { content: ""; width: 58px; height: 48px; margin-top: -2px; border: 2px solid #888681; border-bottom: 0; border-radius: 50% 50% 0 0; }
.portrait span { position: absolute; inset: .2rem .2rem auto; color: #ccc; font-size: .62rem; letter-spacing: .08em; }
.portrait b { position: absolute; inset: auto 0 0; padding: .2rem; background: #111d; font-size: .76rem; }
.portrait-lilixia { background: linear-gradient(215deg, #717171, #1b1b1b 68%); }
.character-body { min-width: 0; }
.character-body h2 { margin: 0 0 .4rem; font-size: 1rem; }
.primary-meter { display: grid; grid-template-columns: 1fr auto; gap: 0 .4rem; font-size: .78rem; }
.primary-meter > i { grid-column: 1 / -1; height: 5px; overflow: hidden; background: #4a4a4a; }
.primary-meter > i > i { display: block; height: 100%; background: #dedbd5; }
.trait-group { margin-top: .65rem; }
.trait-group h3 { margin: 0 0 .2rem; padding-left: .45rem; border-left: 4px solid #747474; color: #aaa; font-size: .72rem; }
.trait-group dl,
.description-list { margin: 0; font-size: .73rem; }
.trait-group dl div,
.description-list div { display: flex; justify-content: space-between; gap: .5rem; border-bottom: 1px dotted #3c3c3c; }
.trait-group dd,
.description-list dd { margin: 0; text-align: right; }
.description-list dd { max-width: 65%; }
.color-label.active.tone-橙 { border-color: #d68135; color: #e6a15f; }
.color-label.active.tone-蓝 { border-color: #4f83ae; color: #80acd0; }
.color-label.active.tone-绿 { border-color: #568b61; color: #83b18b; }
.color-label.active.tone-红 { border-color: #a94f48; color: #d57a72; }
.colors { margin: .55rem 0 0; color: var(--muted); font-size: .7rem; }
.empty-state { margin: 1rem; padding: 1rem; border: 1px solid #555; color: var(--muted); }

.reader-column { min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto; background: #0e0e0e; }
.reading-scroll { position: relative; min-height: 0; display: grid; overflow: auto; isolation: isolate; scrollbar-color: #777 #222; }
.scene-placeholder,
.nvl-page,
.empty-reader { grid-area: 1 / 1; }
.scene-placeholder { position: relative; z-index: 0; width: 100%; height: 100%; min-height: 520px; filter: grayscale(1); background: #151515; }
.scene-placeholder::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, #050505e8 0%, #111b 48%, #050505eb 100%), linear-gradient(0deg, #060606de, transparent 45%, #090909c7); }
.scene-placeholder svg { position: sticky; top: 0; width: 100%; height: min(100%, 100dvh); min-height: 520px; object-fit: cover; }
.scene-placeholder span { position: absolute; z-index: 1; top: .7rem; right: .8rem; padding: .18rem .4rem; border: 1px solid #777; color: #ccc; background: #111c; font-size: .65rem; letter-spacing: .08em; }
.nvl-page { position: relative; z-index: 1; width: min(820px, calc(100% - 2rem)); min-height: 100%; margin: 0 auto; padding: clamp(2.2rem, 7vh, 5rem) 0 4rem; }
.prompt-block { margin: 0 0 2rem auto; max-width: 76%; padding: .75rem 1rem; border-right: 3px solid #aaa; text-align: right; background: #111c; }
.prompt-block b { color: #bdbab4; font-size: .78rem; letter-spacing: .14em; }
.prompt-block p { margin: .25rem 0 0; white-space: pre-wrap; }
.reply-block { padding: clamp(1.2rem, 3vw, 2.2rem); border: 1px solid #777; background: #080808dc; box-shadow: 0 18px 55px #000b; }
.reply-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: 1.3rem; padding-bottom: .65rem; border-bottom: 1px solid #555; }
.reply-heading span { letter-spacing: .16em; }
.reply-heading small { color: var(--muted); }
.reply-block > p { margin: 0; color: var(--paper); font-size: clamp(1rem, 1.4vw, 1.16rem); white-space: pre-wrap; text-shadow: 0 1px 2px #000; }
.empty-reader { min-height: 100%; display: grid; place-content: center; gap: .5rem; padding: 2rem; text-align: center; background: #101010; }
.empty-reader span { color: var(--muted); }

.reading-nav { position: relative; z-index: 3; display: flex; gap: .45rem; align-items: center; padding: .55rem .7rem; border-top: 1px solid var(--line); background: #161616; }
.history-menu { position: relative; }
.history-menu > summary { display: grid; place-items: center; min-width: 96px; padding: .45rem .75rem; border: 1px solid var(--line); cursor: pointer; list-style: none; background: #202020; }
.history-menu > summary::-webkit-details-marker { display: none; }
.history-menu ol { position: absolute; z-index: 5; bottom: calc(100% + .45rem); left: 0; width: min(380px, 75vw); max-height: min(55dvh, 480px); overflow: auto; margin: 0; padding: .4rem; border: 1px solid #777; background: #111; list-style: none; box-shadow: 0 12px 32px #000c; }
.history-menu li + li { margin-top: .3rem; }
.history-menu li button { width: 100%; display: grid; text-align: left; }
.history-menu li button[aria-current="page"] { border-color: #ddd; background: #333; }
.history-menu small { max-width: 34ch; overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }

.composer { display: grid; grid-template-columns: minmax(130px, .22fr) minmax(0, 1fr) auto; align-items: stretch; gap: .7rem; padding: .7rem max(1rem, env(safe-area-inset-right)) max(.7rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left)); border-top: 1px solid var(--line); background: #101010; }
.composer label { align-self: center; color: var(--muted); font-size: .82rem; letter-spacing: .08em; }
.composer textarea { min-height: 72px; max-height: 22dvh; resize: vertical; border: 1px solid #595959; border-radius: 2px; padding: .65rem .8rem; color: var(--ink); background: #202020; font-size: 16px; line-height: 1.5; }
.composer-actions { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; gap: .4rem; }
.composer-actions small { max-width: 24ch; color: var(--muted); font-size: .68rem; text-align: right; }
.send-button { min-width: 110px; border-color: #aaa; background: #dedbd5; color: #111; font-weight: 700; }
.stop-button { min-width: 110px; border-color: #9b5b55; color: #f1d6d2; background: #4b2421; }

footer { padding: .25rem max(.7rem, env(safe-area-inset-right)) max(.25rem, env(safe-area-inset-bottom)) max(.7rem, env(safe-area-inset-left)); color: #8b8984; background: #090909; font-size: .65rem; text-align: center; }

@media (max-width: 1000px) {
  .nvl-header { grid-template-columns: 1fr auto; gap: .7rem; padding: .55rem .7rem; }
  .brand strong { font-size: .9rem; }
  .brand p { font-size: .62rem; }
  .moon { width: 30px; height: 30px; }
  .scene-meta { grid-column: 1 / -1; grid-row: 2; order: 3; }
  .scene-meta div { padding: 0 .55rem; }
  .scene-meta dd { font-size: .78rem; }
  .header-actions { justify-content: flex-end; flex-wrap: wrap; }
  .connection { flex-basis: 100%; text-align: right; }
  .nvl-stage { display: flex; flex-direction: column; min-height: 0; }
  .character-panel { flex: 0 0 auto; max-height: min(38dvh, 45%); border-bottom: 1px solid var(--line); overflow: auto; }
  .character-panel:not([open]) { overflow: hidden; }
  .character-panel > summary { position: sticky; top: 0; z-index: 4; display: flex; align-items: center; background: #181818; }
  .character-panel > summary::after { content: "收起"; margin-left: auto; color: var(--muted); font-size: .75rem; }
  .character-panel:not([open]) > summary::after { content: "展开"; }
  .character-list { grid-template-columns: repeat(2, minmax(260px, 1fr)); overflow-x: auto; padding: .65rem; }
  .state-source { grid-column: 1 / -1; }
  .character-card { min-width: 260px; }
  .reader-column { flex: 1 1 auto; min-height: 0; }
  .scene-placeholder { min-height: 430px; }
  .nvl-page { width: min(100% - 1rem, 720px); padding: 1.2rem 0 2.4rem; }
  .prompt-block { max-width: 90%; margin-bottom: 1rem; }
  .reply-block { padding: 1rem; }
  .reply-heading { display: grid; gap: .2rem; }
  .reading-nav { overflow-x: auto; padding: .4rem; }
  .reading-nav > button, .history-menu > summary { white-space: nowrap; }
  .history-menu ol { position: fixed; inset: auto .5rem calc(44px + 112px + env(safe-area-inset-bottom)) .5rem; width: auto; max-height: 40dvh; }
  .composer { grid-template-columns: 1fr auto; gap: .45rem; padding: .55rem max(.55rem, env(safe-area-inset-right)) max(.55rem, env(safe-area-inset-bottom)) max(.55rem, env(safe-area-inset-left)); }
  .composer label { grid-column: 1 / -1; }
  .composer textarea { min-height: 64px; max-height: 18dvh; resize: none; }
  .composer-actions { min-width: 106px; }
  .composer-actions small { display: none; }
  .composer-actions button { min-width: 100%; flex: 1; }
}

@media (max-width: 450px) {
  .nvl-header { max-height: 142px; overflow: auto; }
  .brand p { display: none; }
  .header-actions button { padding-inline: .55rem; }
  .scene-meta { font-size: .72rem; }
  .character-list { grid-template-columns: 1fr; overflow-x: visible; }
  .character-card { min-width: 0; grid-template-columns: 70px minmax(0, 1fr); }
  .portrait { height: 102px; }
  .reply-block > p { font-size: 1rem; }
  .reading-nav > button { padding-inline: .65rem; }
  .composer { grid-template-columns: minmax(0, 1fr) 96px; }
  .composer-actions { min-width: 0; }
}

@media (max-height: 600px) {
  .nvl-shell { grid-template-rows: auto auto minmax(240px, 1fr) auto auto; overflow-y: auto; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
</style>
