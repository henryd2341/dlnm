import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { readStateAt } from './mvu/bridge.ts';
import type { State } from './mvu/schema.ts';
import { visibleBody } from './message-display.ts';
import { cardName, worldbookName } from './card-content.ts';
export { visibleBody } from './message-display.ts';

export type WaitingTurn = {
  key: string; text: string; after: number; userId: number | null; startedAt: number;
  phase: 'sending' | 'waiting' | 'unconfirmed' | 'stopped' | 'failed'; endedAt?: number;
  replyId?: number; viewKey?: string; previousText?: string;
};
export type NvlPage = {
  id: number; swipe: number; name: string; text: string; prompt: string;
  promptId?: number; viewKey?: string; waiting?: WaitingTurn;
};
const WAITING_PAGE = -2; // Display identity only; never passed to a message/MVU API.
export function pagesFromMessages(messages: ChatMessage[], swipes: number[]): NvlPage[] {
  let prompt = '', promptId: number | undefined, firstReply = false;
  return messages.flatMap(message => {
    if (message.is_hidden || message.role === 'system') return [];
    if (message.role === 'user') { prompt = message.message; promptId = message.message_id; firstReply = true; return []; }
    const swipe = swipes[message.message_id] ?? 0;
    const viewKey = firstReply ? `turn:${promptId}:${swipe}` : `reply:${message.message_id}:${swipe}`;
    firstReply = false;
    return [{ id: message.message_id, swipe, name: message.name, text: visibleBody(message.message), prompt, promptId, viewKey }];
  });
}
export function pagesWithWaiting(pages: NvlPage[], waiting: WaitingTurn | null): NvlPage[] {
  if (!waiting) return pages;
  // Hide the host's empty streaming placeholder, not any historical reply.
  const placeholder = replyForWaiting(pages, waiting);
  return [...pages.filter(page => page !== placeholder), {
    id: WAITING_PAGE, swipe: 0, name: '回复', text: waiting.previousText ?? '', prompt: waiting.text, waiting,
    viewKey: waiting.viewKey ?? (waiting.userId === null ? `sending:${waiting.startedAt}` : `turn:${waiting.userId}:0`),
  }];
}
function replyForWaiting(pages: NvlPage[], waiting: WaitingTurn) {
  return waiting.replyId !== undefined ? pages.find(page => page.id === waiting.replyId)
    : waiting.userId === null ? undefined : pages.find(page => page.promptId === waiting.userId);
}
export function displayStateId(pages: NvlPage[], selectedId: number, hosted: boolean) {
  return hosted ? selectedId : pages.at(-1)?.id ?? -1;
}

type HostWindow = Window & typeof globalThis & { SillyTavern?: { getContext(): typeof SillyTavern } };
type Stream = { messageId: number; type: string; result: string; continueMessage: string; isFinished: boolean; isStopped: boolean };
const ownerEvent = 'dlnm:nvl-owner';

export function useNvl() {
  // Helper reuses the same DOM id on same-floor rerenders; ownership belongs to this instance.
  const ownerToken = {};
  const pages = ref<NvlPage[]>([]), selectedId = ref(-1);
  const waitingTurn = ref<WaitingTurn | null>(null);
  const readingPages = computed(() => pagesWithWaiting(pages.value, waitingTurn.value));
  const snapshot = ref<State | null>(null), stateMessageId = ref<number | null>(null);
  const draft = ref(''), busy = ref(false), connected = ref(false), hosted = ref(false), chatKey = ref('');
  const opening = ref(false);
  const superseded = ref(false);
  const following = ref(true);
  const surfaceTarget = shallowRef<HTMLElement | null>(null);
  const notice = ref(''), stateError = ref('等待酒馆与 MVU'), initDetails = ref(''), validLatest = ref(false);
  const error = computed(() => [notice.value, stateError.value, initDetails.value].filter(Boolean).join(' '));
  const canSend = computed(() => hosted.value && connected.value && validLatest.value && !busy.value && !waitingTurn.value && selectedId.value === pages.value.at(-1)?.id);
  let host: HostWindow, frame: HTMLIFrameElement, row: HTMLElement, chat: HTMLElement;
  let dialog: HTMLDialogElement | undefined, surfaceGeneration = 0;
  let closed = false, nativeMode = false, ownsStorage = false;
  let timer: ReturnType<typeof setTimeout> | undefined, readyTimer: ReturnType<typeof setTimeout> | undefined, sendTimer: ReturnType<typeof setTimeout> | undefined;
  let stateTimer: ReturnType<typeof setTimeout> | undefined, stateDeadline = 0;
  let finishTimer: ReturnType<typeof setTimeout> | undefined;
  let pending: { text: string; after: number; key: string } | undefined;
  const stops: (() => void)[] = [], surfaceStops: (() => void)[] = [];
  let awaitingState = false;
  let generationType = 'normal';
  let stopFailed = false;
  let streamFrame = 0, streamEpoch = 0;
  let ignoredProcessor: Stream | null = null;
  let stream: { processor: Stream; message: SillyTavern.ChatMessage; swipe: number; index: number; text: string } | undefined;

  function context() {
    const value = host.SillyTavern?.getContext();
    if (!value || value.groupId || getCurrentCharacterName() !== cardName) throw Error('请在本卡的单角色聊天中打开阅读界面');
    return value;
  }
  function identity() {
    const ctx = context(), id = ctx.getCurrentChatId();
    if (!id) throw Error('当前聊天尚未就绪');
    return JSON.stringify([ctx.characterId, id]);
  }
  function isCurrent() {
    try { return !closed && identity() === chatKey.value; } catch { return false; }
  }
  function persist() {
    if (closed || !ownsStorage || !chatKey.value) return;
    try { host.sessionStorage.setItem(`dlnm:nvl:${chatKey.value}`, JSON.stringify({ draft: draft.value, selectedId: selectedId.value, following: following.value, native: nativeMode, mode: nativeMode ? 'light' : 'fullscreen', waitingTurn: waitingTurn.value, generationType })); }
    catch { notice.value = '浏览器草稿存储不可用；当前草稿仍在，请在关闭或刷新前自行复制。'; }
  }
  function readSaved() {
    try {
      const saved = JSON.parse(host.sessionStorage.getItem(`dlnm:nvl:${chatKey.value}`) || '{}');
      selectedId.value = Number.isSafeInteger(saved.selectedId) ? saved.selectedId : -1;
      following.value = saved.following !== false;
      // Old panel sessions become light UI; keep their draft and reading selection intact.
      nativeMode = saved.native === true || saved.mode === 'panel' || saved.mode === 'light';
      draft.value = typeof saved.draft === 'string' ? saved.draft : '';
      generationType = ['normal', 'continue', 'regenerate', 'swipe'].includes(saved.generationType) ? saved.generationType : 'normal';
      const waiting = saved.waitingTurn as WaitingTurn | undefined;
      if (waiting && waiting.key === chatKey.value && typeof waiting.text === 'string'
        && Number.isSafeInteger(waiting.after) && waiting.after >= 0 && waiting.after <= context().chat.length
        && (waiting.userId === null || (Number.isSafeInteger(waiting.userId) && waiting.userId >= 0))
        && (waiting.replyId === undefined || (Number.isSafeInteger(waiting.replyId) && waiting.replyId >= 0 && typeof waiting.viewKey === 'string' && typeof waiting.previousText === 'string'))
        && Number.isFinite(waiting.startedAt) && waiting.startedAt > 0 && waiting.startedAt <= Date.now()
        && (waiting.endedAt === undefined || (Number.isFinite(waiting.endedAt) && waiting.endedAt >= waiting.startedAt))
        && ['sending', 'waiting', 'unconfirmed', 'stopped', 'failed'].includes(waiting.phase)) waitingTurn.value = waiting;
      return true;
    } catch { notice.value = '本地阅读记录读取失败，原记录保留；本次草稿仅留在界面，请在退出前自行复制。'; return false; }
  }
  watch(draft, persist, { flush: 'sync' });
  function statePageId() { return displayStateId(readingPages.value, selectedId.value, hosted.value); }
  function readSelected() {
    validLatest.value = false;
    const displayId = statePageId();
    const waiting = displayId === WAITING_PAGE ? waitingTurn.value : null;
    if (waiting || ((busy.value || awaitingState) && displayId === readingPages.value.at(-1)?.id)) {
      // Only a display fallback: never copy these values into the new message or MVU.
      if (!snapshot.value) {
        for (let index = pages.value.length - 1; index >= 0; index--) {
          const id = pages.value[index]!.id;
          if (!waiting && id >= displayId) continue;
          try { const result = readStateAt(id); snapshot.value = result.state; stateMessageId.value = id; break; } catch { /* Try the preceding saved reply. */ }
        }
      }
      stateError.value = waiting ? '本轮尚无有效回复，人物状态沿用上一份已保存数据。'
        : busy.value ? '回复生成中，人物状态暂留上一份有效值；结束后自动同步。' : '正文已收到，等待本轮 MVU 保存；人物状态暂留上一份有效值。';
      return;
    }
    if (displayId < 0) { stateError.value = '等待可显示的真实回复。'; return; }
    try {
      const result = readStateAt(displayId), messages = context().chat, latest = messages.at(-1);
      snapshot.value = result.state; stateMessageId.value = result.messageId;
      initDetails.value = '';
      validLatest.value = !result.pending && displayId === messages.length - 1 && !!latest && !latest.is_user;
      stateError.value = result.pending ? '状态待同步：本轮保留原状态，请返回酒馆修复或重生成。'
        : latest?.is_user ? '行动已送出，等待当前回复；如生成失败，请返回酒馆继续处理。'
        : displayId !== pages.value.at(-1)?.id ? '正在回看历史，人物状态跟随本轮；返回最新后再发送。' : '';
    } catch (cause) { stateError.value = cause instanceof Error ? cause.message : '读取当前回复的 MVU 状态失败；正文、草稿和原状态保留。'; }
  }
  async function diagnoseInit() {
    const key = chatKey.value, id = statePageId();
    if (id < 0) return;
    try {
      const book = getCharWorldbookNames('current').primary;
      if (!book) { initDetails.value = '本角色未绑定主世界书；请在酒馆导入并链接修订包内的世界书，保留原卡与聊天。'; return; }
      const entries = await getWorldbook(book);
      if (!isCurrent() || key !== chatKey.value || id !== statePageId() || snapshot.value) return;
      const init = entries.find(entry => entry.name.toLowerCase().includes('[initvar]') && entry.name.includes('DLNM'));
      if (!init) { initDetails.value = `已绑定“${book}”，但未找到本卡的 [initvar] 条目；请核对卡包与世界书版本。`; return; }
      if (!init.content.trim()) { initDetails.value = `“${book}”的 [initvar] 内容为空；修订包提供完整 YAML 初值，请链接“${worldbookName}”。`; return; }
      if (book !== worldbookName) { initDetails.value = `当前绑定的是“${book}”；请导入并链接本包的“${worldbookName}”，原书保留。`; return; }
      const data = Mvu.getMvuData({ type: 'message', message_id: id });
      initDetails.value = Object.hasOwn(data.initialized_lorebooks ?? {}, book)
        ? `“${book}”已被 MVU 标记初始化，本楼数据仍缺失或不符合本卡字段；原存档保留，不自动重置。请先保留旧聊天，再以修订卡新建独立开场核对。`
        : `已找到“${book}”的 [initvar]（提示禁用属正常），但本楼尚无可用初值；请核对 MVU 启用、世界书内容和两个脚本的加载提示。`;
    } catch (cause) {
      if (isCurrent() && key === chatKey.value && id === statePageId() && !snapshot.value) initDetails.value = `初值只读诊断：${cause instanceof Error ? cause.message : '读取世界书失败'}。`;
    }
  }
  function waitForState() {
    clearTimeout(stateTimer); stateDeadline = Date.now() + 15000;
    if (statePageId() === WAITING_PAGE) return;
    if (!snapshot.value) void diagnoseInit();
    const poll = () => {
      if (!connected.value || !isCurrent()) return;
      readSelected();
      if (busy.value || (!awaitingState && snapshot.value && stateMessageId.value === statePageId())) return;
      if (Date.now() < stateDeadline) stateTimer = setTimeout(poll, 250);
      else if (awaitingState) stateError.value = '状态待同步：本轮保存尚未确认，正文和草稿保留；请返回酒馆核对或修复，完成后自动重读。';
      else { stateError.value += ' 自动初始化未完成；不需要发送聊天消息，请检查下方组件诊断。'; void diagnoseInit(); }
    };
    // Initialization events precede setChatMessages persistence, so always reread after the event stack.
    stateTimer = setTimeout(poll, 0);
  }
  function retryState() { notice.value = ''; initDetails.value = ''; refresh(); waitForState(); }
  function changedChat() {
    superseded.value = true;
    exitReaderFullscreen();
    retire();
    waitingTurn.value = null; pages.value = []; snapshot.value = null; stateMessageId.value = null; draft.value = '';
    notice.value = '聊天已切换；草稿已按原聊天保留，请使用当前聊天的阅读入口。';
  }
  function refresh() {
    if (!isCurrent()) { changedChat(); return; }
    try {
      // ponytail: one linear scan per settled event; use a bounded index if real-host profiling requires it.
      pages.value = pagesFromMessages(getChatMessages('0-{{lastMessageId}}'), context().chat.map(message => message.swipe_id ?? 0));
      reconcileWaiting();
      if (busy.value && stream) {
        stream.index = pages.value.findIndex(page => page.id === stream!.processor.messageId && page.swipe === stream!.swipe);
        if (stream.index >= 0) pages.value[stream.index]!.text = visibleBody(stream.text);
      }
      revealWaitingReply();
      if (waitingTurn.value && !busy.value && ['sending', 'waiting'].includes(waitingTurn.value.phase) && host.document.body.dataset.generating !== 'true') {
        waitingTurn.value.phase = waitingTurn.value.userId === null && waitingTurn.value.replyId === undefined ? 'unconfirmed' : 'failed';
        waitingTurn.value.endedAt = Date.now();
      }
      if (following.value || !readingPages.value.some(page => page.id === selectedId.value)) { selectedId.value = readingPages.value.at(-1)?.id ?? -1; following.value = true; }
      readSelected(); persist();
    } catch (cause) { notice.value = cause instanceof Error ? cause.message : '读取聊天失败'; }
  }
  function scheduleRefresh() {
    clearTimeout(timer);
    // MVU end hooks precede storage; leave the current event stack before reading.
    timer = setTimeout(() => { if (connected.value && !closed) refresh(); }, 0);
  }
  function select(id: number) {
    if (!isCurrent() || !readingPages.value.some(page => page.id === id)) return;
    selectedId.value = id; following.value = id === readingPages.value.at(-1)?.id;
    snapshot.value = null; stateMessageId.value = null;
    initDetails.value = ''; readSelected(); persist(); if (!snapshot.value) waitForState();
  }
  function follow(value: boolean) { following.value = value && selectedId.value === readingPages.value.at(-1)?.id; persist(); }

  function reconcileWaiting() {
    const waiting = waitingTurn.value, messages = context().chat;
    if (!waiting) return;
    if (waiting.userId === null && waiting.replyId === undefined) {
      const id = messages.findIndex((message, index) => index >= waiting.after && message.is_user && !message.is_system);
      if (id >= 0) acceptSent(id);
    } else if (waiting.userId !== null) {
      const message = messages[waiting.userId];
      if (!message?.is_user || message.is_system) { waitingTurn.value = null; pending = undefined; clearTimeout(sendTimer); }
      else waiting.text = message.mes; // Later host extensions may normalize the already-confirmed user message.
    }
  }
  function revealWaitingReply(fromStream = false) {
    const waiting = waitingTurn.value;
    if (!waiting) return;
    const reply = replyForWaiting(pages.value, waiting);
    if (!reply || !reply.text.trim() || (!fromStream && reply.text.trim() === '...')) return;
    if (busy.value && !fromStream && waiting.replyId !== undefined && reply.text === waiting.previousText) return;
    // Transfer the selected display page without forcing a reader out of history or changing scroll-follow intent.
    if (selectedId.value === WAITING_PAGE) selectedId.value = reply.id;
    waitingTurn.value = null;
  }
  function release() {
    surfaceGeneration++;
    persist();
    surfaceStops.splice(0).forEach(stop => stop());
    const previousDialog = dialog;
    dialog = undefined; surfaceTarget.value = null;
    previousDialog?.close();
    // Let Teleport move/unmount its own nodes before removing the old target.
    if (previousDialog) void nextTick(() => previousDialog.remove());
    hosted.value = false;
  }
  function cancelStream() {
    streamEpoch++; host?.cancelAnimationFrame(streamFrame); streamFrame = 0; stream = undefined;
  }
  function retire() {
    release(); ownsStorage = false; closed = true; connected.value = false;
    clearTimeout(timer); clearTimeout(sendTimer); clearTimeout(stateTimer); clearTimeout(finishTimer); cancelStream();
    stops.splice(0).forEach(stop => stop());
    host?.document.removeEventListener(ownerEvent, receiveOwner);
  }
  function receiveOwner(event: Event) {
    if ((event as CustomEvent).detail !== ownerToken) { superseded.value = true; retire(); }
  }
  function receiveToken(text: string) {
    if (!isCurrent() || !busy.value || typeof text !== 'string') return;
    const ctx = context(), processor = ctx.streamingProcessor as Stream | null;
    if (!processor || processor === ignoredProcessor || processor.isFinished || processor.isStopped || ['quiet', 'impersonate'].includes(processor.type)) return;
    const id = processor.messageId, message = ctx.chat[id];
    if (!Number.isSafeInteger(id) || id < 0 || !message || message.is_user || message.is_system || message.extra?.type === 'narrator') return;
    const swipe = message.swipe_id ?? 0;
    if (stream?.processor === processor && (stream.message !== message || stream.swipe !== swipe)) {
      ignoredProcessor = processor; cancelStream(); return;
    }
    if (!stream || stream.processor !== processor || stream.message !== message || stream.swipe !== swipe) {
      cancelStream();
      let index = pages.value.findIndex(page => page.id === id);
      const before = ctx.chat.slice(0, id);
      const userId = before.findLastIndex(item => item.is_user && !item.is_system);
      const previousReply = before.findLastIndex(item => !item.is_user && !item.is_system && item.extra?.type !== 'narrator');
      const promptId = userId < 0 ? undefined : userId;
      const prompt = before[userId]?.mes ?? '';
      const viewKey = userId > previousReply ? `turn:${userId}:${swipe}` : `reply:${id}:${swipe}`;
      const page: NvlPage = { id, swipe, name: message.name, prompt, promptId, viewKey, text: '' };
      if (index < 0) { index = pages.value.length; pages.value.push(page); }
      else pages.value[index] = page;
      stream = { processor, message, swipe, index, text: '' };
      if (following.value && !waitingTurn.value) { selectedId.value = id; readSelected(); persist(); }
    }
    // ST 1.17 emits the full generated suffix BEFORE updating chat.mes; continue needs its old prefix once.
    stream.text = (processor.continueMessage || '') + text;
    if (streamFrame) return;
    const epoch = streamEpoch;
    streamFrame = host.requestAnimationFrame(() => {
      streamFrame = 0;
      if (epoch !== streamEpoch || !stream || !isCurrent() || !busy.value) return;
      const current = context();
      if (current.streamingProcessor !== stream.processor || current.chat[id] !== stream.message || (stream.message.swipe_id ?? 0) !== stream.swipe) { cancelStream(); return; }
      const page = pages.value[stream.index];
      if (page?.id === id && page.swipe === stream.swipe) {
        page.text = visibleBody(stream.text);
        if (waitingTurn.value) { revealWaitingReply(true); readSelected(); persist(); }
      }
    });
  }
  function started(type: string, _options: unknown, dryRun: boolean) {
    if (dryRun || ['quiet', 'impersonate'].includes(type) || !isCurrent()) return;
    cancelStream(); ignoredProcessor = null; clearTimeout(stateTimer); clearTimeout(finishTimer); awaitingState = true; stopFailed = false;
    generationType = type || 'normal';
    if (type === 'regenerate') {
      const page = pages.value.at(-1);
      if (page) {
        waitingTurn.value = { key: chatKey.value, text: page.prompt, after: page.id, userId: page.promptId ?? null,
          startedAt: Date.now(), phase: 'waiting', replyId: page.id,
          viewKey: page.viewKey?.replace(/:\d+$/, ':0') ?? `reply:${page.id}:0`, previousText: page.text };
        if (following.value || selectedId.value === page.id) selectedId.value = WAITING_PAGE;
      }
    } else if (type === 'continue' || type === 'swipe') waitingTurn.value = null;
    else if (waitingTurn.value && waitingTurn.value.userId !== null) {
      waitingTurn.value.phase = 'waiting'; waitingTurn.value.startedAt = Date.now(); waitingTurn.value.endedAt = undefined;
    }
    busy.value = true; validLatest.value = false; readSelected(); persist();
  }
  function rendered(messageId: number) {
    if (!isCurrent()) return;
    const messages = context().chat, message = messages[messageId], swipe = message?.swipe_id ?? 0;
    // Both native final render and MVU's refresh:'affected' follow its message-variable write.
    if (messageId === messages.length - 1 && message && !message.is_user && message.mes !== '...') {
      try {
        readStateAt(messageId);
        if (isCurrent() && context().chat[messageId] === message && (message.swipe_id ?? 0) === swipe) awaitingState = false;
      } catch { /* Keep the previous display until the saved state is available. */ }
    }
    scheduleRefresh();
  }
  function acceptSent(messageId: number) {
    if (!isCurrent()) return;
    const messages = context().chat, message = messages[messageId], waiting = waitingTurn.value;
    if (!message?.is_user || message.is_system) return;
    const submitted = pending ?? (waiting?.userId === null && waiting.replyId === undefined ? waiting : undefined);
    if (submitted && (submitted.key !== chatKey.value || messageId < submitted.after)) return;
    if (!submitted && messageId !== messages.findLastIndex(item => item.is_user && !item.is_system)) return;
    if (submitted) {
      const sameText = message.mes === submitted.text;
      if (sameText && draft.value === submitted.text) draft.value = '';
      pending = undefined; clearTimeout(sendTimer);
      notice.value = sameText ? '' : '酒馆已接收消息，但文本与草稿有差异（可能经过宏或扩展处理）；草稿保留，请核对后自行处理。';
    }
    if (!['continue', 'regenerate', 'swipe'].includes(generationType) && waiting?.userId !== messageId) {
      waitingTurn.value = { key: chatKey.value, text: message.mes, after: messageId, userId: messageId, startedAt: Date.now(), phase: 'waiting' };
    }
    persist(); scheduleRefresh();
  }
  function finished(stopped = false) {
    if (stopped && stopFailed) {
      busy.value = host.document.body.dataset.generating === 'true';
      clearTimeout(finishTimer);
      if (busy.value && waitingTurn.value) { waitingTurn.value.phase = waitingTurn.value.userId === null && waitingTurn.value.replyId === undefined ? 'sending' : 'waiting'; waitingTurn.value.endedAt = undefined; }
      notice.value = '停止请求未命中运行中的生成；请核对酒馆当前状态，正文和未发送草稿保留。';
      scheduleRefresh(); return;
    }
    cancelStream();
    busy.value = false;
    if (pending) { notice.value = '酒馆尚未确认接收这段行动；草稿保留，请核对原生输入框。'; pending = undefined; }
    else if (stopped) notice.value = '生成已停止；请核对当前回复与状态后再继续。';
    clearTimeout(sendTimer); clearTimeout(finishTimer);
    if (stopped && waitingTurn.value) { waitingTurn.value.phase = 'stopped'; waitingTurn.value.endedAt = Date.now(); persist(); }
    // ENDED precedes final message rendering and, on cancellation, STOPPED. Reconcile after that event stack.
    finishTimer = setTimeout(() => {
      if (!isCurrent()) return;
      refresh();
      if (waitingTurn.value && waitingTurn.value.phase !== 'stopped' && host.document.body.dataset.generating !== 'true') {
        waitingTurn.value.phase = waitingTurn.value.userId === null && waitingTurn.value.replyId === undefined ? 'unconfirmed' : 'failed';
        waitingTurn.value.endedAt = Date.now(); persist();
      }
      waitForState();
    }, 0);
  }
  function isReaderFullscreen() {
    const root = host.document.documentElement;
    return host.document.fullscreenElement === root && root.hasAttribute('data-dlnm-fullscreen');
  }
  function exitReaderFullscreen() {
    if (!host?.document.documentElement.hasAttribute('data-dlnm-fullscreen')) return;
    host.document.documentElement.removeAttribute('data-dlnm-fullscreen');
    if (host.document.fullscreenElement === host.document.documentElement) {
      void host.document.exitFullscreen().catch(() => { notice.value = '浏览器退出全屏失败，请按 Escape 退出。'; });
    }
  }
  function clearFullscreenCleanup() {
    const root = host.document.documentElement;
    host.clearTimeout(Number(root.getAttribute('data-dlnm-fullscreen-cleanup')));
    root.removeAttribute('data-dlnm-fullscreen-cleanup');
  }
  function returnToLight() {
    nativeMode = true; release(); exitReaderFullscreen();
    // Light UI follows current progress; retain the separate fullscreen reading selection.
    snapshot.value = null; stateMessageId.value = null;
    refresh(); waitForState();
  }
  async function openFullscreen(generation: number) {
    const root = host.document.documentElement;
    if (typeof root.requestFullscreen !== 'function' || !host.document.fullscreenEnabled) throw Error('当前浏览器未开放 Fullscreen API；人物状态与酒馆原生聊天继续可用。');
    if (host.document.fullscreenElement && !isReaderFullscreen()) throw Error('另一界面正在使用浏览器全屏，请先退出再打开阅读。');
    const sourceCss = document.getElementById('dlnm-nvl-style')?.textContent;
    if (!sourceCss?.trim()) throw Error('本卡样式缺失，请加载同一修订包的 HTML 和脚本。');
    const opener = host.document.activeElement as HTMLElement | null;
    const popup = host.document.createElement('dialog');
    if (typeof popup.showModal !== 'function') throw Error('此浏览器缺少全屏阅读层能力；人物状态与酒馆原生聊天继续可用。');
    popup.setAttribute('aria-label', '恶魔少女与黑之女仆 · 全屏阅读');
    popup.setAttribute('data-dlnm-nvl-dialog', '');
    popup.addEventListener('close', () => {
      if (opener?.isConnected && !host.document.querySelector('dialog[data-dlnm-nvl-dialog][open]')) opener.focus({ preventScroll: true });
    }, { once: true });
    popup.style.cssText = 'position:fixed!important;margin:0!important;padding:0!important;border:0!important;max-width:none!important;max-height:none!important;box-sizing:border-box!important;overflow:hidden!important;background:#111!important;color:#eee!important';
    // dialog is not an allowed shadow host; isolate styles inside an ordinary div.
    const surface = host.document.createElement('div');
    popup.append(surface);
    const shadow = surface.attachShadow({ mode: 'open' });
    const css = host.document.createElement('style');
    css.textContent = sourceCss;
    const target = host.document.createElement('div');
    shadow.append(css, target); dialog = popup;
    host.document.body.append(popup);
    const abandonIfStale = () => {
      if (generation === surfaceGeneration && isCurrent() && frame.isConnected) return false;
      const successor = [...host.document.querySelectorAll('dialog[data-dlnm-nvl-dialog]')].some(element => element !== popup);
      if (!successor) {
        root.removeAttribute('data-dlnm-fullscreen');
        // A pending request may have completed after the unmount timer already removed the marker.
        if (host.document.fullscreenElement === root) void host.document.exitFullscreen().catch(() => {});
      }
      return true;
    };
    // Request before any await: the entry-button click supplies transient user activation.
    if (!isReaderFullscreen()) {
      root.setAttribute('data-dlnm-fullscreen', '');
      try { await root.requestFullscreen({ navigationUI: 'hide' }); }
      catch {
        if (generation === surfaceGeneration) root.removeAttribute('data-dlnm-fullscreen');
        throw Error('浏览器未进入全屏；请点击“浏览器全屏阅读”重试，或继续使用人物状态与酒馆原生聊天。');
      }
    }
    if (abandonIfStale()) return false;
    const fullscreenChanged = () => {
      if (!isReaderFullscreen()) { root.removeAttribute('data-dlnm-fullscreen'); returnToLight(); }
    };
    host.document.addEventListener('fullscreenchange', fullscreenChanged);
    surfaceStops.push(() => host.document.removeEventListener('fullscreenchange', fullscreenChanged));
    const fit = () => {
      const viewport = host.visualViewport;
      const width = viewport?.width ?? host.innerWidth, height = viewport?.height ?? host.innerHeight;
      for (const [property, value] of Object.entries({ left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, width, height })) popup.style.setProperty(property, `${value}px`, 'important');
      target.style.setProperty('--dlnm-surface-height', `${height}px`);
    };
    fit();
    host.visualViewport?.addEventListener('resize', fit); host.visualViewport?.addEventListener('scroll', fit); host.addEventListener('resize', fit);
    surfaceStops.push(() => { host.visualViewport?.removeEventListener('resize', fit); host.visualViewport?.removeEventListener('scroll', fit); host.removeEventListener('resize', fit); });
    popup.addEventListener('cancel', event => { event.preventDefault(); void toggleHost(); });
    surfaceTarget.value = target; hosted.value = true;
    snapshot.value = null; stateMessageId.value = null; readSelected();
    await nextTick();
    if (abandonIfStale()) return false;
    popup.showModal();
    target.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    return true;
  }
  async function acquire() {
    if (!isCurrent() || !frame.isConnected || !row.isConnected) { notice.value = '当前阅读入口已失效，请在最新回复重新打开。'; return; }
    if (getCurrentMessageId() !== context().chat.findLastIndex(message => !message.is_user && !message.is_system && message.extra?.type !== 'narrator')) { notice.value = '请在最新角色回复打开阅读入口。'; return; }
    clearFullscreenCleanup();
    release();
    const generation = surfaceGeneration;
    nativeMode = false;
    try { if (!await openFullscreen(generation)) { if (generation === surfaceGeneration) release(); return; } }
    catch (cause) { if (generation !== surfaceGeneration) return; throw cause; }
    refresh(); waitForState();
  }
  async function toggleHost() {
    if (!connected.value || opening.value) return;
    opening.value = true;
    try {
      if (hosted.value) returnToLight();
      else await acquire();
    } catch (cause) { returnToLight(); notice.value = cause instanceof Error ? cause.message : '阅读入口接入失败，已恢复酒馆界面。'; }
    finally { opening.value = false; }
  }
  function send() {
    if (!canSend.value || !isCurrent() || pending) return;
    const text = draft.value;
    if (!text.trim()) return;
    if (text.trimStart().startsWith('/')) { notice.value = '此处发送叙事文本；斜杠命令请返回酒馆输入框执行。'; return; }
    const textarea = host.document.getElementById('send_textarea') as HTMLTextAreaElement | null, button = host.document.getElementById('send_but');
    if (!textarea || !button || host.document.body.dataset.generating === 'true') { notice.value = '酒馆正在处理或发送入口尚未就绪，草稿已保留。'; return; }
    if (textarea.value.trim() && textarea.value !== text) { notice.value = '酒馆输入框已有另一份草稿；请先返回酒馆处理，原内容保持不变。'; return; }
    if (context().onlineStatus === 'no_connection') { notice.value = '酒馆尚未连接模型；请先在酒馆连接，草稿已保留。'; return; }
    pending = { text, after: context().chat.length, key: chatKey.value };
    waitingTurn.value = { ...pending, userId: null, startedAt: Date.now(), phase: 'sending' };
    generationType = 'normal'; selectedId.value = WAITING_PAGE; following.value = true;
    textarea.value = text; textarea.dispatchEvent(new host.Event('input', { bubbles: true }));
    busy.value = true; notice.value = '';
    readSelected(); persist();
    // Native button owns its mutex, user-message creation and normal generation.
    button.click();
    armSendTimeout();
  }
  function armSendTimeout() {
    clearTimeout(sendTimer);
    const waiting = waitingTurn.value;
    if (!waiting || waiting.userId !== null || waiting.replyId !== undefined || waiting.phase !== 'sending') return;
    sendTimer = setTimeout(() => {
      if (!isCurrent() || waitingTurn.value !== waiting || waiting.userId !== null) return;
      notice.value = '发送尚未得到确认，本界面保留草稿；请返回酒馆核对输入框和真实消息，不自动重发。';
      waiting.phase = 'unconfirmed'; waiting.endedAt = Date.now();
      if (host.document.body.dataset.generating !== 'true') { pending = undefined; busy.value = false; }
      persist();
    }, Math.max(0, 15000 - (Date.now() - waiting.startedAt)));
  }
  function stop() {
    if (!isCurrent() || !busy.value) return;
    stopFailed = false;
    stopFailed = !context().stopGeneration();
    // ST emits GENERATION_STOPPED even when its return value is false.
    if (stopFailed) finished(true);
  }
  onMounted(async () => {
    try {
      if (typeof getChatMessages !== 'function' || typeof waitGlobalInitialized !== 'function') throw Error('请从酒馆卡片进入；独立网页没有聊天和 MVU 上下文。');
      host = window.parent as HostWindow;
      frame = host.document.getElementById(getIframeName()) as HTMLIFrameElement;
      row = frame?.closest('.mes') as HTMLElement; chat = host.document.getElementById('chat')!;
      if (!frame || frame.contentWindow !== window || !row || !chat?.contains(row)) throw Error('没有找到当前实例的酒馆消息容器，原生界面保持原样。');
      chatKey.value = identity();
      await Promise.race([waitGlobalInitialized('Mvu'), new Promise((_, reject) => { readyTimer = setTimeout(() => reject(Error('MVU 尚未就绪，请检查本卡脚本和资源地址。')), 15000); })]);
      clearTimeout(readyTimer);
      if (!isCurrent() || !frame.isConnected || frame.contentWindow !== window) return;
      if (!document.getElementById('dlnm-nvl-style')?.textContent?.trim()) throw Error('本卡 NVL 样式缺失；请导入修订卡并加载配套版本资源。');
      if (getCurrentMessageId() !== context().chat.findLastIndex(message => !message.is_user && !message.is_system && message.extra?.type !== 'narrator')) {
        superseded.value = true; return;
      }
      // Data ownership outlives opening/closing the reader. A replacement iframe retires the old subscriber.
      host.document.dispatchEvent(new CustomEvent(ownerEvent, { detail: ownerToken }));
      ownsStorage = readSaved();
      connected.value = true; host.document.addEventListener(ownerEvent, receiveOwner);
      busy.value = host.document.body.dataset.generating === 'true';
      stops.push(eventOn(tavern_events.MESSAGE_RECEIVED, scheduleRefresh).stop);
      stops.push(eventMakeLast(tavern_events.CHARACTER_MESSAGE_RENDERED, rendered).stop);
      for (const name of [tavern_events.MESSAGE_UPDATED, tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_SWIPED, tavern_events.MESSAGE_DELETED]) {
        stops.push(eventOn(name, () => {
          if (!isCurrent()) return;
          // No queued frame may paint into a different branch, edited reply or shifted message index.
          ignoredProcessor = context().streamingProcessor as Stream | null; cancelStream();
          const ownRegenerationDelete = name === tavern_events.MESSAGE_DELETED && busy.value && generationType === 'regenerate'
            && waitingTurn.value?.replyId === context().chat.length;
          if (name === tavern_events.MESSAGE_SWIPED || (name === tavern_events.MESSAGE_DELETED && !ownRegenerationDelete)) {
            waitingTurn.value = null; pending = undefined; clearTimeout(sendTimer);
          }
          if (!busy.value) { snapshot.value = null; stateMessageId.value = null; }
          scheduleRefresh();
        }).stop);
      }
      stops.push(eventOn(tavern_events.MESSAGE_SENT, (id: number) => { acceptSent(id); scheduleRefresh(); }).stop);
      stops.push(eventOn(tavern_events.GENERATION_AFTER_COMMANDS, started).stop);
      stops.push(eventOn(tavern_events.STREAM_TOKEN_RECEIVED, receiveToken).stop);
      stops.push(eventOn(tavern_events.GENERATION_ENDED, () => finished()).stop);
      stops.push(eventOn(tavern_events.GENERATION_STOPPED, () => finished(true)).stop);
      stops.push(eventOn(tavern_events.CHAT_CHANGED, changedChat).stop);
      stops.push(eventOn(`${Mvu.events.VARIABLE_UPDATE_ENDED}_for_zod`, scheduleRefresh).stop);
      stops.push(eventOn(Mvu.events.VARIABLE_INITIALIZED, waitForState).stop);
      awaitingState = busy.value;
      // Browser fullscreen starts only from a click; preserve it across latest-message iframe replacement.
      if (!nativeMode && isReaderFullscreen()) await acquire();
      else { refresh(); waitForState(); }
      armSendTimeout();
      const processor = context().streamingProcessor as Stream | null;
      if (busy.value && processor && typeof processor.result === 'string') receiveToken(processor.result);
    } catch (cause) { if (isCurrent()) exitReaderFullscreen(); retire(); notice.value = cause instanceof Error ? cause.message : '阅读界面初始化失败'; }
  });
  onUnmounted(() => {
    retire(); clearTimeout(readyTimer); host?.document.removeEventListener(ownerEvent, receiveOwner);
    if (!host?.document.documentElement.hasAttribute('data-dlnm-fullscreen')) return;
    // Give the replacement message iframe a bounded handoff; otherwise restore the browser.
    clearFullscreenCleanup();
    const cleanup = host.setTimeout(() => {
      if (host.document.documentElement.getAttribute('data-dlnm-fullscreen-cleanup') !== String(cleanup)) return;
      clearFullscreenCleanup();
      if (!host.document.querySelector('dialog[data-dlnm-nvl-dialog]')) exitReaderFullscreen();
    }, 2000);
    host.document.documentElement.setAttribute('data-dlnm-fullscreen-cleanup', String(cleanup));
  });
  return { pages: readingPages, selectedId, snapshot, stateMessageId, draft, busy, connected, opening, canSend, error, chatKey, hosted, superseded, surfaceTarget, following, select, follow, send, stop, refresh: retryState, toggleHost };
}
