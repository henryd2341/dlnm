import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { readStateAt } from './mvu/bridge.ts';
import type { State } from './mvu/schema.ts';

export type NvlPage = { id: number; swipe: number; name: string; text: string; prompt: string };
export function visibleBody(text: string) {
  return text.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '').replace(/<StatusPlaceHolderImpl\/>/g, '').trim();
}
export function pagesFromMessages(messages: ChatMessage[], swipes: number[]): NvlPage[] {
  let prompt = '';
  return messages.flatMap(message => {
    if (message.is_hidden || message.role === 'system') return [];
    if (message.role === 'user') { prompt = message.message; return []; }
    return [{ id: message.message_id, swipe: swipes[message.message_id] ?? 0, name: message.name, text: visibleBody(message.message), prompt }];
  });
}

type HostWindow = Window & typeof globalThis & { SillyTavern?: { getContext(): typeof SillyTavern } };
const ownerEvent = 'dlnm:nvl-owner';

export function useNvl() {
  const pages = ref<NvlPage[]>([]), selectedId = ref(-1);
  const snapshot = ref<State | null>(null), stateMessageId = ref<number | null>(null);
  const draft = ref(''), busy = ref(false), connected = ref(false), hosted = ref(false), chatKey = ref('');
  const opening = ref(false);
  const mode = ref<'fullscreen' | 'panel'>('fullscreen'), surfaceTarget = shallowRef<HTMLElement | null>(null);
  const notice = ref(''), stateError = ref('等待酒馆与 MVU'), initDetails = ref(''), validLatest = ref(false);
  const error = computed(() => [notice.value, stateError.value, initDetails.value].filter(Boolean).join(' '));
  const canSend = computed(() => hosted.value && connected.value && validLatest.value && !busy.value && selectedId.value === pages.value.at(-1)?.id);
  let host: HostWindow, frame: HTMLIFrameElement, row: HTMLElement, chat: HTMLElement;
  let style: HTMLStyleElement | undefined, observer: ResizeObserver | undefined;
  let dialog: HTMLDialogElement | undefined, surfaceGeneration = 0;
  let closed = false, nativeMode = false, following = true, ownsStorage = false;
  let timer: ReturnType<typeof setTimeout> | undefined, readyTimer: ReturnType<typeof setTimeout> | undefined, sendTimer: ReturnType<typeof setTimeout> | undefined;
  let stateTimer: ReturnType<typeof setTimeout> | undefined, stateDeadline = 0;
  let pending: { text: string; after: number; key: string } | undefined;
  const stops: (() => void)[] = [];

  function context() {
    const value = host.SillyTavern?.getContext();
    if (!value || value.groupId || getCurrentCharacterName() !== 'DLNM-P1-香气链路') throw Error('请在本卡的单角色聊天中打开阅读界面');
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
    try { host.sessionStorage.setItem(`dlnm:nvl:${chatKey.value}`, JSON.stringify({ draft: draft.value, selectedId: selectedId.value, following, native: nativeMode, mode: mode.value })); }
    catch { notice.value = '浏览器草稿存储不可用；当前草稿仍在，请在关闭或刷新前自行复制。'; }
  }
  function readSaved() {
    try {
      const saved = JSON.parse(host.sessionStorage.getItem(`dlnm:nvl:${chatKey.value}`) || '{}');
      selectedId.value = Number.isSafeInteger(saved.selectedId) ? saved.selectedId : -1;
      following = saved.following !== false;
      nativeMode = saved.native === true;
      mode.value = saved.mode === 'panel' ? 'panel' : 'fullscreen';
      draft.value = typeof saved.draft === 'string' ? saved.draft : '';
      return true;
    } catch { notice.value = '本地阅读记录读取失败，原记录保留；本次草稿仅留在界面，请在退出前自行复制。'; return false; }
  }
  watch(draft, persist, { flush: 'sync' });
  function readSelected() {
    snapshot.value = null; stateMessageId.value = null; validLatest.value = false;
    try {
      const result = readStateAt(selectedId.value), messages = context().chat, latest = messages.at(-1);
      snapshot.value = result.state; stateMessageId.value = result.messageId;
      initDetails.value = '';
      validLatest.value = !result.pending && selectedId.value === messages.length - 1 && !!latest && !latest.is_user;
      stateError.value = result.pending ? '状态待同步：本轮保留原状态，请返回酒馆修复或重生成。'
        : latest?.is_user ? '行动已送出，等待当前回复；如生成失败，请返回酒馆继续处理。'
        : selectedId.value !== pages.value.at(-1)?.id ? '正在回看历史，人物状态跟随本轮；返回最新后再发送。' : '';
    } catch (cause) { stateError.value = cause instanceof Error ? cause.message : '读取当前回复的 MVU 状态失败；正文、草稿和原状态保留。'; }
  }
  async function diagnoseInit() {
    const key = chatKey.value, id = selectedId.value;
    try {
      const book = getCharWorldbookNames('current').primary;
      if (!book) { initDetails.value = '本角色未绑定主世界书；请在酒馆导入并链接修订包内的世界书，保留原卡与聊天。'; return; }
      const entries = await getWorldbook(book);
      if (!isCurrent() || key !== chatKey.value || id !== selectedId.value || snapshot.value) return;
      const init = entries.find(entry => entry.name.toLowerCase().includes('[initvar]') && entry.name.includes('DLNM'));
      if (!init) { initDetails.value = `已绑定“${book}”，但未找到本卡的 [initvar] 条目；请核对卡包与世界书版本。`; return; }
      if (!init.content.trim()) { initDetails.value = `“${book}”的 [initvar] 内容为空；修订包提供完整 YAML 初值，保留旧书并链接 R2 世界书。`; return; }
      if (book !== 'DLNM-P1-香气链路-世界书-R2') { initDetails.value = `当前绑定的是“${book}”，不是本包的 R2 世界书；保留旧书，导入并链接包内带 -R2 的世界书。`; return; }
      const data = Mvu.getMvuData({ type: 'message', message_id: id });
      initDetails.value = Object.hasOwn(data.initialized_lorebooks ?? {}, book)
        ? `“${book}”已被 MVU 标记初始化，本楼数据仍缺失或不符合本卡字段；原存档保留，不自动重置。请先保留旧聊天，再以修订卡新建独立开场核对。`
        : `已找到“${book}”的 [initvar]（提示禁用属正常），但本楼尚无可用初值；请核对 MVU 启用、世界书内容和两个脚本的加载提示。`;
    } catch (cause) {
      if (isCurrent() && key === chatKey.value && id === selectedId.value && !snapshot.value) initDetails.value = `初值只读诊断：${cause instanceof Error ? cause.message : '读取世界书失败'}。`;
    }
  }
  function waitForState() {
    clearTimeout(stateTimer); stateDeadline = Date.now() + 15000;
    if (!snapshot.value) void diagnoseInit();
    const poll = () => {
      if (!connected.value || !isCurrent()) return;
      readSelected();
      if (snapshot.value) return;
      if (Date.now() < stateDeadline) stateTimer = setTimeout(poll, 250);
      else { stateError.value += ' 自动初始化未完成；不需要发送聊天消息，请检查下方组件诊断。'; void diagnoseInit(); }
    };
    // Initialization events precede setChatMessages persistence, so always reread after the event stack.
    stateTimer = setTimeout(poll, 0);
  }
  function retryState() { notice.value = ''; initDetails.value = ''; refresh(); waitForState(); }
  function changedChat() {
    exitReaderFullscreen();
    release(); closed = true; connected.value = false;
    pages.value = []; snapshot.value = null; stateMessageId.value = null; draft.value = '';
    notice.value = '聊天已切换；草稿已按原聊天保留，请使用当前聊天的阅读入口。';
  }
  function refresh() {
    if (!isCurrent()) { changedChat(); return; }
    try {
      // ponytail: one linear scan per settled event; use a bounded index if real-host profiling requires it.
      pages.value = pagesFromMessages(getChatMessages('0-{{lastMessageId}}'), context().chat.map(message => message.swipe_id ?? 0));
      if (following || !pages.value.some(page => page.id === selectedId.value)) { selectedId.value = pages.value.at(-1)?.id ?? -1; following = true; }
      readSelected(); persist();
    } catch (cause) { notice.value = cause instanceof Error ? cause.message : '读取聊天失败'; }
  }
  function scheduleRefresh() {
    clearTimeout(timer);
    // MVU end hooks precede storage; leave the current event stack before reading.
    timer = setTimeout(() => { if (hosted.value) refresh(); }, 0);
  }
  function select(id: number) {
    if (!isCurrent() || !pages.value.some(page => page.id === id)) return;
    selectedId.value = id; following = id === pages.value.at(-1)?.id;
    initDetails.value = ''; readSelected(); persist(); if (!snapshot.value) waitForState();
  }
  function release() {
    surfaceGeneration++;
    persist(); ownsStorage = false; clearTimeout(timer); clearTimeout(sendTimer); clearTimeout(stateTimer);
    stops.splice(0).forEach(stop => stop()); observer?.disconnect(); observer = undefined;
    style?.remove(); style = undefined;
    const previousDialog = dialog;
    dialog = undefined; surfaceTarget.value = null;
    previousDialog?.close();
    // Let Teleport move/unmount its own nodes before removing the old target.
    if (previousDialog) void nextTick(() => previousDialog.remove());
    if (frame?.hasAttribute('data-dlnm-nvl-frame')) {
      frame.removeAttribute('data-dlnm-nvl-frame'); row.removeAttribute('data-dlnm-nvl-row');
      chat.removeAttribute('data-dlnm-nvl-chat'); chat.style.removeProperty('--dlnm-reader-height');
      host.document.getElementById('form_sheld')?.removeAttribute('data-dlnm-nvl-input');
    }
    hosted.value = false;
  }
  function receiveOwner(event: Event) {
    if ((event as CustomEvent).detail !== frame.id) release();
  }
  function acceptSent(messageId: number) {
    if (!pending || !isCurrent() || pending.key !== chatKey.value || messageId < pending.after || !context().chat[messageId]?.is_user) return;
    const sameText = context().chat[messageId].mes === pending.text;
    if (sameText && draft.value === pending.text) draft.value = '';
    pending = undefined; clearTimeout(sendTimer);
    notice.value = sameText ? '' : '酒馆已接收消息，但文本与草稿有差异（可能经过宏或扩展处理）；草稿保留，请核对后自行处理。';
    persist(); scheduleRefresh();
  }
  function finished(stopped = false) {
    busy.value = false;
    if (pending) { notice.value = '酒馆尚未确认接收这段行动；草稿保留，请核对原生输入框。'; pending = undefined; }
    else if (stopped) notice.value = '生成已停止；请核对当前回复与状态后再继续。';
    clearTimeout(sendTimer); scheduleRefresh();
  }
  function resize() { if (hosted.value) chat.style.setProperty('--dlnm-reader-height', `${Math.max(260, chat.clientHeight)}px`); }
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
  async function openFullscreen(generation: number) {
    const root = host.document.documentElement;
    if (typeof root.requestFullscreen !== 'function' || !host.document.fullscreenEnabled) throw Error('当前浏览器未开放 Fullscreen API；请手动选择面板模式。');
    if (host.document.fullscreenElement && !isReaderFullscreen()) throw Error('另一界面正在使用浏览器全屏，请先退出再打开阅读。');
    const sourceCss = document.getElementById('dlnm-nvl-style')?.textContent;
    if (!sourceCss?.trim()) throw Error('本卡样式缺失，请加载同一修订包的 HTML 和脚本。');
    const opener = host.document.activeElement as HTMLElement | null;
    const popup = host.document.createElement('dialog');
    if (typeof popup.showModal !== 'function') throw Error('此浏览器缺少全屏阅读层能力；可手动选择面板模式。');
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
        throw Error('浏览器未进入全屏；请点击“浏览器全屏阅读”重试，或手动选择面板模式。');
      }
    }
    if (abandonIfStale()) return false;
    const fullscreenChanged = () => {
      if (!isReaderFullscreen()) { root.removeAttribute('data-dlnm-fullscreen'); nativeMode = true; release(); }
    };
    host.document.addEventListener('fullscreenchange', fullscreenChanged);
    stops.push(() => host.document.removeEventListener('fullscreenchange', fullscreenChanged));
    const fit = () => {
      const viewport = host.visualViewport;
      const width = viewport?.width ?? host.innerWidth, height = viewport?.height ?? host.innerHeight;
      for (const [property, value] of Object.entries({ left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, width, height })) popup.style.setProperty(property, `${value}px`, 'important');
      target.style.setProperty('--dlnm-surface-height', `${height}px`);
    };
    fit();
    host.visualViewport?.addEventListener('resize', fit); host.visualViewport?.addEventListener('scroll', fit); host.addEventListener('resize', fit);
    stops.push(() => { host.visualViewport?.removeEventListener('resize', fit); host.visualViewport?.removeEventListener('scroll', fit); host.removeEventListener('resize', fit); });
    popup.addEventListener('cancel', event => { event.preventDefault(); void toggleHost(); });
    surfaceTarget.value = target; hosted.value = true;
    await nextTick();
    if (abandonIfStale()) return false;
    popup.showModal();
    target.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    return true;
  }
  async function acquire(requestedMode?: 'fullscreen' | 'panel') {
    if (!isCurrent() || !frame.isConnected || !row.isConnected) { notice.value = '当前阅读入口已失效，请在最新回复重新打开。'; return; }
    if (getCurrentMessageId() !== context().chat.findLastIndex(message => !message.is_user && !message.is_system && message.extra?.type !== 'narrator')) { notice.value = '请在最新角色回复打开阅读入口。'; return; }
    clearFullscreenCleanup();
    release();
    const generation = surfaceGeneration;
    host.document.dispatchEvent(new CustomEvent(ownerEvent, { detail: frame.id }));
    // Previous owner saves first; retired frames never overwrite the new owner's draft.
    ownsStorage = readSaved();
    if (requestedMode) mode.value = requestedMode;
    nativeMode = false;
    if (mode.value === 'fullscreen') {
      try { if (!await openFullscreen(generation)) { if (generation === surfaceGeneration) release(); return; } }
      catch (cause) { if (generation !== surfaceGeneration) return; throw cause; }
    } else {
    frame.setAttribute('data-dlnm-nvl-frame', ''); row.setAttribute('data-dlnm-nvl-row', ''); chat.setAttribute('data-dlnm-nvl-chat', '');
    host.document.getElementById('form_sheld')?.setAttribute('data-dlnm-nvl-input', '');
    style = host.document.createElement('style');
    style.textContent = `
      #chat[data-dlnm-nvl-chat]{display:block!important;overflow:hidden!important;padding:0!important}
      #chat[data-dlnm-nvl-chat]>.mes:not([data-dlnm-nvl-row]){display:none!important}
      #chat[data-dlnm-nvl-chat]>.mes[data-dlnm-nvl-row]{display:block!important;margin:0!important;padding:0!important;border:0!important;width:100%!important;min-height:0!important}
      [data-dlnm-nvl-row]>.mesAvatarWrapper,[data-dlnm-nvl-row]>.avatar{display:none!important}
      [data-dlnm-nvl-row]>.mes_block{width:100%!important;padding:0!important;margin:0!important}
      [data-dlnm-nvl-row]>.mes_block>:not(.mes_text){display:none!important}
      [data-dlnm-nvl-row] .mes_text{font-size:0!important;margin:0!important;padding:0!important}
      [data-dlnm-nvl-row] .mes_text>:not([data-dlnm-nvl-frame]):not(:has([data-dlnm-nvl-frame])){display:none!important}
      iframe[data-dlnm-nvl-frame]{width:100%!important;height:var(--dlnm-reader-height,70vh)!important;border:0!important;display:block!important}
      #form_sheld[data-dlnm-nvl-input]{display:none!important}`;
    host.document.head.append(style); hosted.value = true;
    observer = new ResizeObserver(resize); observer.observe(chat); resize();
    }
    busy.value = host.document.body.dataset.generating === 'true';
    for (const name of [tavern_events.MESSAGE_RECEIVED, tavern_events.MESSAGE_UPDATED, tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_SWIPED, tavern_events.MESSAGE_DELETED, tavern_events.CHARACTER_MESSAGE_RENDERED]) stops.push(eventOn(name, scheduleRefresh).stop);
    stops.push(eventOn(tavern_events.MESSAGE_SENT, acceptSent).stop);
    stops.push(eventOn(tavern_events.GENERATION_STARTED, (_type, _options, dryRun) => { if (!dryRun) busy.value = true; }).stop);
    stops.push(eventOn(tavern_events.GENERATION_ENDED, () => finished()).stop);
    stops.push(eventOn(tavern_events.GENERATION_STOPPED, () => finished(true)).stop);
    stops.push(eventOn(tavern_events.CHAT_CHANGED, changedChat).stop);
    stops.push(eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, scheduleRefresh).stop);
    stops.push(eventOn(Mvu.events.VARIABLE_INITIALIZED, waitForState).stop);
    refresh(); waitForState();
  }
  async function toggleHost(requestedMode?: 'fullscreen' | 'panel') {
    if (!connected.value || opening.value) return;
    opening.value = true;
    try {
      if (hosted.value && !requestedMode) { nativeMode = true; release(); exitReaderFullscreen(); }
      else {
        if (requestedMode === 'panel') { release(); exitReaderFullscreen(); }
        await acquire(requestedMode);
      }
    } catch (cause) { release(); exitReaderFullscreen(); notice.value = cause instanceof Error ? cause.message : '阅读入口接入失败，已恢复酒馆界面。'; }
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
    textarea.value = text; textarea.dispatchEvent(new host.Event('input', { bubbles: true }));
    busy.value = true; notice.value = '';
    // Native button owns its mutex, user-message creation and normal generation.
    button.click();
    sendTimer = setTimeout(() => {
      if (!pending || !isCurrent()) return;
      notice.value = '发送尚未得到确认，本界面保留草稿；请返回酒馆核对输入框和真实消息，不自动重发。';
      if (host.document.body.dataset.generating !== 'true') { pending = undefined; busy.value = false; }
    }, 15000);
  }
  function stop() { if (isCurrent() && busy.value) context().stopGeneration(); }
  onMounted(async () => {
    try {
      if (typeof getChatMessages !== 'function' || typeof waitGlobalInitialized !== 'function') throw Error('请从酒馆卡片进入；独立网页没有聊天和 MVU 上下文。');
      host = window.parent as HostWindow;
      frame = host.document.getElementById(getIframeName()) as HTMLIFrameElement;
      row = frame?.closest('.mes') as HTMLElement; chat = host.document.getElementById('chat')!;
      if (!frame || !row || !chat?.contains(row)) throw Error('没有找到已知酒馆消息容器，原生界面保持原样。');
      chatKey.value = identity();
      await Promise.race([waitGlobalInitialized('Mvu'), new Promise((_, reject) => { readyTimer = setTimeout(() => reject(Error('MVU 尚未就绪，请检查本卡脚本和资源地址。')), 15000); })]);
      clearTimeout(readyTimer);
      if (!isCurrent()) return;
      if (!document.getElementById('dlnm-nvl-style')?.textContent?.trim()) throw Error('本卡 NVL 样式缺失；请导入修订卡并加载配套版本资源。');
      readSaved();
      connected.value = true; host.document.addEventListener(ownerEvent, receiveOwner);
      // Browser fullscreen starts only from a click; preserve it across latest-message iframe replacement.
      if (!nativeMode && (mode.value === 'panel' || isReaderFullscreen())) await acquire();
      else { refresh(); waitForState(); }
    } catch (cause) { release(); if (isCurrent()) exitReaderFullscreen(); notice.value = cause instanceof Error ? cause.message : '阅读界面初始化失败'; }
  });
  onUnmounted(() => {
    release(); closed = true; clearTimeout(readyTimer); host?.document.removeEventListener(ownerEvent, receiveOwner);
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
  return { pages, selectedId, snapshot, stateMessageId, draft, busy, connected, opening, canSend, error, chatKey, hosted, mode, surfaceTarget, select, send, stop, refresh: retryState, toggleHost };
}
