<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import CardImage from "./CardImage.vue";
import CharacterStatus from "./CharacterStatus.vue";
import { sceneImage } from "./images.ts";
import { createMessageRenderer } from "./message-display.ts";
import type { State } from "./mvu/schema.ts";
import type { NvlPage } from "./nvl.ts";

const props = defineProps<{
  pages: NvlPage[];
  selectedId: number;
  following: boolean;
  snapshot: State | null;
  stateMessageId: number | null;
  draft: string;
  busy: boolean;
  connected: boolean;
  canSend: boolean;
  error: string;
  chatKey: string;
  imageRevision: number;
}>();

const emit = defineEmits<{
  "update:draft": [value: string];
  select: [id: number];
  follow: [value: boolean];
  send: [];
  stop: [];
  refresh: [];
  "toggle-host": [];
}>();

const reading = ref<HTMLElement | null>(null);
const sidebar = ref<HTMLElement | null>(null);
const sidebarToggle = ref<HTMLButtonElement | null>(null);
const sidebarClose = ref<HTMLButtonElement | null>(null);
const narrow = ref(false);
const sidebarOpen = ref(false);
const sidebarModal = computed(() => narrow.value && sidebarOpen.value);
let sidebarMedia: MediaQueryList | undefined;
const composing = ref(false);
const positions = new Map<string, number>();
const renderMessage = shallowRef<((text: string) => string) | null>(null);
const rendererError = ref("");
const now = ref(Date.now());
let waitingClock: ReturnType<typeof setInterval> | undefined;
let scrollRevision = 0;

const selectedIndex = computed(() =>
  props.pages.findIndex((page) => page.id === props.selectedId),
);
const selectedPage = computed(() =>
  selectedIndex.value < 0 ? null : props.pages[selectedIndex.value],
);
const latestPage = computed(() => props.pages[props.pages.length - 1] ?? null);
const scene = computed(() => sceneImage(props.snapshot?.world));
const positionKey = computed(() =>
  selectedPage.value
    ? `${props.chatKey}:${selectedPage.value.viewKey ?? `${selectedPage.value.id}:${selectedPage.value.swipe}`}`
    : `${props.chatKey}:empty`,
);
const waiting = computed(() => selectedPage.value?.waiting);
const waitingLabel = computed(() => {
  const value = waiting.value;
  if (!value) return "";
  if (value.phase === "sending") return "正在发送…";
  if (value.phase === "waiting")
    return value.replyId === undefined
      ? "已发送，等待回复…"
      : "正在重新生成，等待回复…";
  if (value.phase === "stopped")
    return value.userId === null && value.replyId === undefined
      ? "生成已停止，发送仍未确认；草稿保留，请返回酒馆核对。"
      : "生成已停止；已发送内容与已有回复保留。";
  if (value.phase === "unconfirmed")
    return "发送尚未确认，草稿已保留；请返回酒馆核对，不会自动重发。";
  return "生成已结束，但尚未收到正文；请返回酒馆核对错误提示，不会自动重发。";
});
const waitingSeconds = computed(() =>
  waiting.value
    ? Math.max(
        0,
        Math.floor(
          ((waiting.value.endedAt ?? now.value) - waiting.value.startedAt) /
            1000,
        ),
      )
    : 0,
);
const sendDisabled = computed(
  () => props.busy || !props.canSend || !props.draft.trim(),
);
const renderedBody = computed(() => {
  if (!renderMessage.value)
    return {
      html: "",
      error: rendererError.value || "正文格式组件尚未就绪，暂显示原文。",
    };
  try {
    return {
      html: renderMessage.value(selectedPage.value?.text ?? ""),
      error: "",
    };
  } catch {
    return {
      html: "",
      error: "正文格式转换失败，原文保留；请检查宿主 Markdown 与清理组件。",
    };
  }
});

function storageKey(key: string) {
  return `dlnm:nvl-scroll:${key}`;
}

function readPosition(key: string) {
  if (positions.has(key)) return positions.get(key) ?? 0;
  try {
    let stored = sessionStorage.getItem(storageKey(key));
    // Reuse A-R1 scroll positions when a real page first adopts a stable turn key.
    if (stored === null && selectedPage.value && selectedPage.value.id >= 0) {
      stored = sessionStorage.getItem(
        storageKey(
          `${props.chatKey}:${selectedPage.value.id}:${selectedPage.value.swipe}`,
        ),
      );
    }
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
function onScroll() {
  scrollRevision++;
  savePosition();
  const element = reading.value;
  if (element)
    emit(
      "follow",
      selectedPage.value?.id === latestPage.value?.id &&
        element.scrollHeight - element.clientHeight - element.scrollTop < 80,
    );
}

function restorePosition(key: string) {
  if (reading.value)
    reading.value.scrollTop =
      props.following && selectedPage.value?.id === latestPage.value?.id
        ? reading.value.scrollHeight
        : readPosition(key);
}

function selectRelative(offset: number) {
  const page = props.pages[selectedIndex.value + offset];
  if (page) emit("select", page.id);
}

function onDraft(event: Event) {
  emit("update:draft", (event.target as HTMLTextAreaElement).value);
}

function requestSend() {
  if (!sendDisabled.value) emit("send");
}

function onComposerKeydown(event: KeyboardEvent) {
  if (
    event.key !== "Enter" ||
    !event.ctrlKey ||
    event.isComposing ||
    composing.value
  )
    return;
  event.preventDefault();
  requestSend();
}

function sidebarActiveElement() {
  return (sidebar.value?.getRootNode() as Document | ShadowRoot | undefined)
    ?.activeElement;
}

async function openSidebar() {
  if (!narrow.value) return;
  sidebarOpen.value = true;
  await nextTick();
  if (sidebarModal.value) sidebarClose.value?.focus({ preventScroll: true });
}

async function closeSidebar() {
  sidebarOpen.value = false;
  await nextTick();
  if (narrow.value) sidebarToggle.value?.focus({ preventScroll: true });
}

function onSidebarMediaChange() {
  const active = sidebarActiveElement();
  const restoreFocus = active &&
    (sidebar.value?.contains(active) || active === sidebarToggle.value);
  narrow.value = sidebarMedia?.matches ?? false;
  sidebarOpen.value = false;
  if (restoreFocus)
    void nextTick(() => {
      (narrow.value ? sidebarToggle.value : sidebar.value)?.focus({ preventScroll: true });
    });
}

function onSidebarKeydown(event: KeyboardEvent) {
  if (!sidebarModal.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    void closeSidebar();
  } else if (event.key === "Tab") {
    const controls = Array.from(sidebar.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), summary, [tabindex="0"]',
    ) ?? []).filter((element) => element.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    const active = sidebarActiveElement();
    if (!controls.includes(active as HTMLElement) ||
      (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus({ preventScroll: true });
    }
  }
}

watch(
  positionKey,
  (next, previous) => {
    savePosition(previous);
    nextTick(() => {
      if (positionKey.value === next) restorePosition(next);
    });
  },
  { flush: "pre" },
);
watch(
  () => waiting.value?.phase,
  (phase) => {
    clearInterval(waitingClock);
    now.value = Date.now();
    if (phase === "waiting")
      waitingClock = setInterval(() => {
        now.value = Date.now();
      }, 1000);
  },
  { immediate: true },
);
watch(
  () => selectedPage.value?.text,
  () => {
    const element = reading.value,
      key = positionKey.value,
      revision = scrollRevision;
    if (
      !element ||
      !props.following ||
      selectedPage.value?.id !== latestPage.value?.id ||
      element.scrollHeight - element.clientHeight - element.scrollTop >= 80
    )
      return;
    void nextTick(() => {
      if (
        reading.value === element &&
        key === positionKey.value &&
        revision === scrollRevision
      )
        element.scrollTop = element.scrollHeight;
    });
  },
  { flush: "pre" },
);

onMounted(() => {
  // Teleported into the host ShadowRoot: use its viewport, not the Helper iframe.
  sidebarMedia = reading.value?.ownerDocument.defaultView?.matchMedia("(max-width: 1000px)");
  onSidebarMediaChange();
  sidebarMedia?.addEventListener("change", onSidebarMediaChange);
  try {
    renderMessage.value = createMessageRenderer(window.parent);
  } catch (cause) {
    rendererError.value =
      cause instanceof Error
        ? cause.message
        : "宿主正文组件不可用，暂显示原文。";
  }
  const revision = scrollRevision;
  void nextTick(() => {
    if (revision === scrollRevision) restorePosition(positionKey.value);
  });
});
onBeforeUnmount(() => {
  sidebarMedia?.removeEventListener("change", onSidebarMediaChange);
  savePosition();
  clearInterval(waitingClock);
});
</script>

<template>
  <main class="nvl-shell" aria-label="阅读界面" @keydown.stop="onSidebarKeydown" @keyup.stop>
    <header class="nvl-header" :inert="sidebarModal">
      <div class="brand">
        <svg class="moon" viewBox="0 0 384 512" aria-hidden="true" focusable="false">
          <metadata>Font Awesome Free 6.7.2 by Fonticons, Inc. Copyright 2024. Moon icon: CC BY 4.0. https://fontawesome.com/license/free</metadata>
          <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
        </svg>
        <div>
          <strong>魔族大小姐与女仆共度的30天 ~ Brand New Colors</strong>
        </div>
      </div>
      <dl class="scene-meta">
        <div>
          <dt>日期</dt>
          <dd>
            {{ snapshot ? `续篇第 ${snapshot.world.day} 日` : "无有效数据" }}
          </dd>
        </div>
        <div>
          <dt>时段</dt>
          <dd>{{ snapshot?.world.period ?? "无有效数据" }}</dd>
        </div>
        <div>
          <dt>地点</dt>
          <dd>{{ snapshot?.world.location ?? "无有效数据" }}</dd>
        </div>
      </dl>
      <div class="header-actions">
        <span class="connection" :class="{ online: connected }">{{
          connected ? "宿主已连接" : "宿主未连接"
        }}</span>
        <button
          type="button"
          :disabled="!connected"
          aria-label="返回酒馆"
          title="返回酒馆"
          @click="emit('toggle-host')"
        >
          <svg class="control-icon header-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14 4h6v16h-6M14 12H3m5-5-5 5 5 5" />
          </svg>
          <span>返回酒馆</span>
        </button>
        <button type="button" aria-label="重新读取" title="重新读取" @click="emit('refresh')">
          <svg class="control-icon header-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5" />
          </svg>
          <span>重新读取</span>
        </button>
      </div>
    </header>

    <p v-if="error || !connected" class="error-banner" role="status" :inert="sidebarModal">
      {{ error || "未连接酒馆宿主，真实聊天、状态与生成均不可用。" }}
    </p>

    <div class="nvl-stage">
      <button
        v-show="!sidebarModal"
        ref="sidebarToggle"
        type="button"
        class="status-toggle"
        aria-controls="dlnm-character-sidebar"
        :aria-expanded="sidebarModal"
        aria-haspopup="dialog"
        aria-label="展开人物状态"
        title="展开人物状态"
        @click="openSidebar"
      >
        <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
      <aside
        id="dlnm-character-sidebar"
        ref="sidebar"
        class="status-sidebar"
        :class="{ 'is-open': sidebarModal }"
        :role="sidebarModal ? 'dialog' : undefined"
        :aria-modal="sidebarModal ? true : undefined"
        aria-label="人物状态"
        tabindex="-1"
      >
        <div class="sidebar-header">
          <strong>人物状态</strong>
          <button ref="sidebarClose" class="sidebar-close" type="button" aria-label="收起人物状态" title="收起人物状态" @click="closeSidebar">
            <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
        </div>
        <CharacterStatus
          class="character-panel"
          :snapshot="snapshot"
          :state-message-id="stateMessageId"
          :chat-key="chatKey"
          :image-revision="imageRevision"
        />
      </aside>
      <button
        v-if="sidebarModal"
        type="button"
        class="status-backdrop"
        tabindex="-1"
        aria-hidden="true"
        @click="closeSidebar"
      ></button>

      <section class="reader-column" aria-label="当前阅读内容" :inert="sidebarModal">
        <CardImage
          class="scene-background"
          scene
          :names="scene.names"
          :note="scene.note"
          :label="snapshot?.world.location ?? '场景'"
          :chat-key="chatKey"
          :revision="imageRevision"
        />
        <div
          ref="reading"
          class="reading-scroll"
          tabindex="0"
          @scroll.passive="onScroll"
        >
          <article v-if="selectedPage" class="nvl-page">
            <section class="prompt-block" aria-label="本轮玩家输入">
              <b>诺雅</b>
              <p>{{ selectedPage.prompt || "本轮没有可显示的用户输入。" }}</p>
            </section>
            <section class="reply-block" aria-label="本轮回复">
              <div class="reply-heading">
                <span>{{ selectedPage.name || "回复" }}</span>
                <small v-if="waiting">{{
                  waiting.replyId === undefined ? "本轮待回复" : "本轮重新生成"
                }}</small>
                <small v-else
                  >消息 {{ selectedPage.id }} · 分支
                  {{ selectedPage.swipe + 1 }}</small
                >
              </div>
              <div v-if="waiting" class="waiting-reply">
                <p role="status">{{ waitingLabel }}</p>
                <small v-if="waiting.phase === 'waiting'"
                  >已等待 {{ waitingSeconds }} 秒</small
                >
                <small v-if="waiting.previousText"
                  >以下保留重生成前的正文，尚非新回复。</small
                >
              </div>
              <template v-if="!waiting || selectedPage.text">
                <p v-if="renderedBody.error" class="format-error" role="status">
                  {{ renderedBody.error }}
                </p>
                <p v-if="renderedBody.error" class="plain-reply">
                  {{ selectedPage.text }}
                </p>
                <div
                  v-else
                  class="reply-markdown"
                  v-html="renderedBody.html"
                ></div>
              </template>
            </section>
          </article>
          <div v-else class="empty-reader" role="status">
            <strong>没有可显示的真实回复</strong>
            <span>连接酒馆并选择一条有效的助手回复后，这里才会显示正文。</span>
          </div>
        </div>

        <nav class="reading-nav" aria-label="回复阅读导航">
          <button
            type="button"
            :disabled="selectedIndex <= 0"
            @click="selectRelative(-1)"
          >
            ← 前一轮
          </button>
          <details class="history-menu">
            <summary>
              历史 {{ pages.filter((page) => !page.waiting).length
              }}<span v-if="pages.some((page) => page.waiting)">
                · 本轮待回复</span
              >
            </summary>
            <ol>
              <li v-for="page in pages" :key="`${page.id}:${page.swipe}`">
                <button
                  type="button"
                  :aria-current="page.id === selectedId ? 'page' : undefined"
                  @click="emit('select', page.id)"
                >
                  <span v-if="page.waiting">{{
                    page.waiting.replyId === undefined
                      ? "本轮待回复"
                      : "本轮重新生成"
                  }}</span>
                  <span v-else
                    >消息 {{ page.id }} · 分支 {{ page.swipe + 1 }}</span
                  >
                  <small>{{ page.prompt || "无用户输入摘要" }}</small>
                </button>
              </li>
            </ol>
          </details>
          <button
            type="button"
            :disabled="selectedIndex < 0 || selectedIndex >= pages.length - 1"
            @click="selectRelative(1)"
          >
            后一轮 →
          </button>
          <button
            type="button"
            :disabled="!latestPage || latestPage.id === selectedId"
            @click="latestPage && emit('select', latestPage.id)"
          >
            返回最新
          </button>
        </nav>
      </section>
    </div>

    <section class="composer" aria-label="诺雅的输入区" :inert="sidebarModal">
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
        <small>Ctrl + Enter 发送</small>
        <button
          v-if="busy"
          type="button"
          class="stop-button"
          @click="emit('stop')"
        >
          停止生成
        </button>
        <button
          type="button"
          class="send-button"
          :disabled="sendDisabled"
          @click="requestSend"
        >
          发送
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
.error-banner {
  grid-row: 2;
}
.composer {
  grid-row: 4;
}
footer {
  grid-row: 5;
}

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
textarea {
  font: inherit;
}

button,
summary {
  min-height: 44px;
  color: var(--ink);
}

button {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 0.55rem 0.85rem;
  background: #202020;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #303030;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
button:focus-visible,
summary:focus-visible,
textarea:focus-visible,
.status-sidebar:focus-visible,
.reading-scroll:focus-visible {
  outline: 3px solid #dedbd5;
  outline-offset: 2px;
}

.nvl-header {
  grid-row: 1;
  min-height: 78px;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(260px, 1.2fr) auto;
  align-items: center;
  gap: 1.25rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(90deg, #101010, #242424 48%, #111);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.brand p {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
}
.brand strong {
  font-size: 1.05rem;
  letter-spacing: 0.08em;
}
.moon {
  display: block;
  width: 38px;
  height: 38px;
  color: #d7d4ce;
  fill: currentColor;
  flex: 0 0 auto;
}

.scene-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
}
.scene-meta div {
  padding: 0 0.85rem;
  border-left: 1px solid var(--line);
}
.scene-meta dt {
  color: var(--muted);
  font-size: 0.72rem;
}
.scene-meta dd {
  margin: 0;
  font-size: 0.9rem;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.45rem;
}
.connection {
  color: #c1aaa7;
  font-size: 0.75rem;
  white-space: nowrap;
}
.connection::before {
  content: "";
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  margin-right: 0.35rem;
  border-radius: 50%;
  background: #8a3d35;
}
.connection.online {
  color: #aac0ad;
}
.connection.online::before {
  background: #4f8057;
}

.error-banner {
  margin: 0;
  padding: 0.45rem 1rem;
  border-bottom: 1px solid #75433f;
  color: #f1d6d2;
  background: #391c1a;
  font-size: 0.86rem;
}

.nvl-stage {
  grid-row: 3;
  min-height: 0;
  display: grid;
  grid-template-columns: clamp(30rem, 40vw, 40rem) minmax(0, 1fr);
  gap: 1px;
  background: var(--line);
}

.status-sidebar {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.status-toggle,
.sidebar-header,
.status-backdrop {
  display: none;
}
.status-toggle,
.sidebar-close {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  place-items: center;
}
.sidebar-close {
  display: grid;
}
.control-icon {
  display: block;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.header-icon {
  display: none;
}

.character-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #121212;
}

.character-panel,
.reading-scroll {
  scrollbar-width: thin;
  scrollbar-color: #777 #191919;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}
.character-panel::-webkit-scrollbar,
.reading-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.character-panel::-webkit-scrollbar-track,
.reading-scroll::-webkit-scrollbar-track {
  background: #191919;
}
.character-panel::-webkit-scrollbar-thumb,
.reading-scroll::-webkit-scrollbar-thumb {
  border: 2px solid #191919;
  border-radius: 999px;
  background: #777;
}

.reader-column {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  isolation: isolate;
  background: #0e0e0e;
}
.reading-scroll {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: grid;
  overflow: auto;
}
.scene-background,
.reading-scroll,
.nvl-page,
.empty-reader {
  grid-area: 1 / 1;
}
.scene-background {
  z-index: 0;
  width: 100%;
  pointer-events: none;
}
.nvl-page {
  position: relative;
  z-index: 1;
  width: min(820px, calc(100% - 2rem));
  min-height: 100%;
  margin: 0 auto;
  padding: clamp(2.2rem, 7vh, 5rem) 0 4rem;
}
.prompt-block {
  margin: 0 0 2rem auto;
  max-width: 76%;
  padding: 0.75rem 1rem;
  border-right: 3px solid #aaa;
  text-align: right;
  background: #111c;
}
.prompt-block b {
  color: #bdbab4;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
}
.prompt-block p {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
}
.reply-block {
  padding: clamp(1.2rem, 3vw, 2.2rem);
  border: 1px solid #777;
  background: #080808dc;
  box-shadow: 0 18px 55px #000b;
}
.reply-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.3rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #555;
}
.reply-heading span {
  letter-spacing: 0.16em;
}
.reply-heading small {
  color: var(--muted);
}
.reply-markdown,
.plain-reply {
  margin: 0;
  color: var(--paper);
  font-size: clamp(1rem, 1.4vw, 1.16rem);
  text-shadow: 0 1px 2px #000;
}
.plain-reply {
  white-space: pre-wrap;
}
.format-error {
  color: #f1d6d2;
  font-size: 0.85rem;
}
.waiting-reply {
  min-height: 5rem;
  padding: 0.8rem 0;
  color: var(--paper);
  overflow-wrap: anywhere;
}
.waiting-reply p {
  margin: 0 0 0.5rem;
}
.waiting-reply small {
  display: block;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.reply-markdown :deep(p) {
  margin: 0 0 1em;
}
.reply-markdown :deep(:last-child) {
  margin-bottom: 0;
}
.reply-markdown :deep(ul),
.reply-markdown :deep(ol) {
  padding-left: 1.5em;
}
.reply-markdown :deep(blockquote) {
  margin: 1em 0;
  padding: 0.3em 1em;
  border-left: 3px solid #999;
  color: #ccc9c3;
}
.reply-markdown :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  padding: 0.8em;
  border: 1px solid #555;
  background: #151515;
  white-space: pre;
}
.reply-markdown :deep(code) {
  font:
    0.9em/1.6 Consolas,
    monospace;
  background: #252525;
  border-radius: 2px;
}
.reply-markdown :deep(pre code) {
  background: none;
}
.reply-markdown :deep(a) {
  color: #9bc7ff;
  text-decoration: underline;
  overflow-wrap: anywhere;
}
.reply-markdown :deep(a:focus-visible) {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.reply-markdown :deep(span[style]) {
  text-shadow: 0 1px 2px #000;
}
.empty-reader {
  min-height: 100%;
  display: grid;
  place-content: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
  background: #101010;
}
.empty-reader span {
  color: var(--muted);
}

.reading-nav {
  position: relative;
  z-index: 3;
  display: flex;
  gap: 0.45rem;
  align-items: center;
  padding: 0.55rem 0.7rem;
  border-top: 1px solid var(--line);
  background: #161616;
}
.history-menu {
  position: relative;
}
.history-menu > summary {
  display: grid;
  place-items: center;
  min-width: 96px;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--line);
  cursor: pointer;
  list-style: none;
  background: #202020;
}
.history-menu > summary::-webkit-details-marker {
  display: none;
}
.history-menu ol {
  position: absolute;
  z-index: 5;
  bottom: calc(100% + 0.45rem);
  left: 0;
  width: min(380px, 75vw);
  max-height: min(55dvh, 480px);
  overflow: auto;
  margin: 0;
  padding: 0.4rem;
  border: 1px solid #777;
  background: #111;
  list-style: none;
  box-shadow: 0 12px 32px #000c;
}
.history-menu li + li {
  margin-top: 0.3rem;
}
.history-menu li button {
  width: 100%;
  display: grid;
  text-align: left;
}
.history-menu li button[aria-current="page"] {
  border-color: #ddd;
  background: #333;
}
.history-menu small {
  max-width: 34ch;
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer {
  display: grid;
  grid-template-columns: minmax(130px, 0.22fr) minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0.7rem;
  padding: 0.7rem max(1rem, env(safe-area-inset-right))
    max(0.7rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  border-top: 1px solid var(--line);
  background: #101010;
}
.composer label {
  align-self: center;
  color: var(--muted);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}
.composer textarea {
  min-height: 72px;
  max-height: 22dvh;
  resize: vertical;
  border: 1px solid #595959;
  border-radius: 2px;
  padding: 0.65rem 0.8rem;
  color: var(--ink);
  background: #202020;
  font-size: 16px;
  line-height: 1.5;
}
.composer-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.4rem;
}
.composer-actions small {
  max-width: 24ch;
  color: var(--muted);
  font-size: 0.68rem;
  text-align: right;
}
.send-button {
  min-width: 110px;
  border-color: #aaa;
  background: #dedbd5;
  color: #111;
  font-weight: 700;
}
.stop-button {
  min-width: 110px;
  border-color: #9b5b55;
  color: #f1d6d2;
  background: #4b2421;
}

footer {
  padding: 0.25rem max(0.7rem, env(safe-area-inset-right))
    max(0.25rem, env(safe-area-inset-bottom))
    max(0.7rem, env(safe-area-inset-left));
  color: #8b8984;
  background: #090909;
  font-size: 0.65rem;
  text-align: center;
}

@media (max-width: 1000px) {
  .nvl-header {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
    padding: 0.55rem 0.7rem;
  }
  .brand,
  .brand > div {
    min-width: 0;
  }
  .brand {
    grid-row: 1;
    overflow-wrap: break-word;
  }
  .brand strong {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .brand p {
    font-size: 0.62rem;
  }
  .moon {
    width: 30px;
    height: 30px;
  }
  .scene-meta {
    grid-column: 1 / -1;
    grid-row: 2;
    order: 3;
  }
  .scene-meta div {
    padding: 0 0.55rem;
  }
  .scene-meta dd {
    font-size: 0.78rem;
  }
  .header-actions {
    grid-row: 3;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .header-actions button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
  }
  .header-actions button > span {
    display: none;
  }
  .header-icon {
    display: block;
  }
  .connection {
    margin-right: auto;
    text-align: left;
  }
  .nvl-stage {
    position: relative;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
  }
  .status-toggle {
    display: grid;
    position: absolute;
    top: 50%;
    left: 0;
    z-index: 4;
    transform: translateY(-50%);
    border-radius: 0 50% 50% 0;
    background: #161616e6;
  }
  .status-sidebar {
    display: none;
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 6;
    width: min(24rem, calc(100% - 3rem));
    border-right: 1px solid var(--line);
    background: #121212;
    box-shadow: 8px 0 24px #0009;
  }
  .status-sidebar.is-open {
    display: flex;
  }
  .sidebar-header {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.4rem 0.65rem;
    border-bottom: 1px solid var(--line);
  }
  .status-backdrop,
  .status-backdrop:hover:not(:disabled) {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 5;
    border: 0;
    border-radius: 0;
    background: #0009;
  }
  .nvl-page {
    width: min(100% - 1rem, 720px);
    padding: 1.2rem 0 2.4rem;
  }
  .prompt-block {
    max-width: 90%;
    margin-bottom: 1rem;
  }
  .reply-block {
    padding: 1rem;
  }
  .reply-heading {
    display: grid;
    gap: 0.2rem;
  }
  .reading-nav {
    overflow-x: auto;
    padding: 0.4rem;
  }
  .reading-nav > button,
  .history-menu > summary {
    white-space: nowrap;
  }
  .history-menu ol {
    position: fixed;
    inset: auto 0.5rem calc(44px + 112px + env(safe-area-inset-bottom)) 0.5rem;
    width: auto;
    max-height: 40dvh;
  }
  .composer {
    grid-template-columns: 1fr auto;
    gap: 0.45rem;
    padding: 0.55rem max(0.55rem, env(safe-area-inset-right))
      max(0.55rem, env(safe-area-inset-bottom))
      max(0.55rem, env(safe-area-inset-left));
  }
  .composer label {
    grid-column: 1 / -1;
  }
  .composer textarea {
    min-height: 64px;
    max-height: 18dvh;
    resize: none;
  }
  .composer-actions {
    min-width: 106px;
  }
  .composer-actions small {
    display: none;
  }
  .composer-actions button {
    min-width: 100%;
    flex: 1;
  }
}

@media (max-width: 450px) {
  .brand p {
    display: none;
  }
  .scene-meta {
    font-size: 0.72rem;
  }
  .reply-markdown,
  .plain-reply {
    font-size: 1rem;
  }
  .reading-nav > button {
    padding-inline: 0.65rem;
  }
  .composer {
    grid-template-columns: minmax(0, 1fr) 96px;
  }
  .composer-actions {
    min-width: 0;
  }
}

@media (max-height: 600px) {
  .nvl-shell {
    grid-template-rows: auto auto minmax(240px, 1fr) auto auto;
    overflow-y: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition: none !important;
    animation: none !important;
  }
}
</style>
