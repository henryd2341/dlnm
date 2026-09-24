import { P1_INITIAL, parseP1Reply, settleP1 } from './p1-state.mjs';

// RETIRED 2026-09-23: do not import/run this native-variable probe. Follow the MVU Zod route.
(() => {
  const CARD = 'DLNM-P1-香气链路';
  const MARKER = 'DLNM_P1_START';
  const REVISION = 'p1.2';
  const root = window.parent.document;
  const ctx = () => SillyTavern.getContext();
  const require = (value, message) => { if (!value) throw new Error(message); };
  const panel = root.createElement('section');
  panel.id = 'dlnm-p1-panel';
  panel.setAttribute('aria-label', 'DLNM P1 链路检查');
  panel.style.cssText = 'padding:8px;border:1px solid currentColor;max-height:38vh;overflow:auto;flex-shrink:0;background:var(--SmartThemeBlurTintColor,#222);';
  // Fixed trusted markup only. Model and saved data are always assigned as text.
  panel.innerHTML = `<strong>DLNM P1 · 最小链路检查 ${REVISION}</strong>
    <p data-status role="status" aria-live="polite">正在检查测试对象…</p>
    <button type="button" data-init>初始化本测试聊天</button>
    <button type="button" data-refresh>读取已存状态</button>
    <button type="button" data-replay>重放结算检查（零调用）</button>
    <label style="display:block">测试输入<textarea data-draft rows="2" style="width:100%;box-sizing:border-box"></textarea></label>
    <button type="button" data-send disabled>发送并生成</button>
    <pre data-receipt style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
    <details><summary>最新正文（清单另存于原消息）</summary><div data-body style="white-space:pre-wrap"></div></details>`;
  const el = selector => panel.querySelector(selector);
  const draft = el('[data-draft]');
  let busy = false, stopped = false, destroyed = false, targetVerified = false, uninject = () => {};
  let receipt = {}, lastState = null, lastValidated = null, draftKey = '', endedSignals = 0;
  const listeners = [];
  const status = message => { el('[data-status]').textContent = message; };
  const show = () => { el('[data-receipt]').textContent = JSON.stringify(receipt, null, 2); };
  const identity = (chatKey, messages) => JSON.stringify([chatKey, messages.map(({ id, swipe, role, text }) => [id, swipe, role, text])]);

  function capture() {
    const c = ctx();
    require(!destroyed && !c.groupId && c.characters[c.characterId]?.name === CARD, '已离开专用测试卡，停止处理');
    targetVerified = true;
    const chatKey = `${c.characters[c.characterId].avatar}:${c.getCurrentChatId()}`;
    require(c.getCurrentChatId() && c.chat.length, '测试聊天尚未就绪');
    const messages = getChatMessages(`0-${c.chat.length - 1}`, { include_swipes: true }).map(m => ({
      id: m.message_id, swipe: m.swipe_id, role: m.role,
      text: m.swipes[m.swipe_id], data: JSON.parse(JSON.stringify(m.swipes_data[m.swipe_id] ?? {})),
    }));
    require(messages[0]?.text.includes(MARKER), '不是本卡 P1 开场，保留原聊天');
    return { chatKey, messages, identity: identity(chatKey, messages) };
  }
  const unchanged = captured => require(capture().identity === captured.identity, '聊天、分支或正文已变化；本次处理取消');
  async function hash(text) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function source(captured, index) {
    const message = captured.messages[index];
    return { chatKey: captured.chatKey, messageId: message.id, swipeId: message.swipe,
      contentHash: await hash(message.text),
      parentHash: await hash(JSON.stringify(captured.messages.slice(0, index).map(({ id, swipe, role, text }) => [id, swipe, role, text]))),
    };
  }
  function write(captured, index, record) {
    unchanged(captured);
    const message = captured.messages[index];
    updateVariablesWith(variables => {
      unchanged(captured); // synchronous updater: no await between identity check and write
      require(!variables.dlnm || variables.dlnm.scope === 'p1-probe', '已有其他版本状态，保留原记录');
      return { ...variables, dlnm: record };
    }, { type: 'message', message_id: message.id });
    unchanged(captured);
    require(JSON.stringify(getVariables({ type: 'message', message_id: message.id }).dlnm) === JSON.stringify(record), '写后回读不一致');
  }
  async function readChain(captured, through = captured.messages.length) {
    const opening = captured.messages[0].data.dlnm;
    require(opening?.scope === 'p1-probe' && opening.schemaVersion === 1 && opening.status === 'valid', '此测试聊天待初始化，或开场状态待同步');
    const openingSource = await source(captured, 0);
    require(JSON.stringify(opening.source) === JSON.stringify(openingSource), '开场来源已变化，暂停推进');
    require(JSON.stringify(opening.state) === JSON.stringify(P1_INITIAL), '开场基线损坏，保留原数据');
    let state = opening.state;
    for (let i = 1; i < through; i++) {
      const message = captured.messages[i];
      if (message.role !== 'assistant') continue;
      const old = message.data.dlnm;
      require(old, `回复 ${message.id} 状态待同步`);
      const result = settleP1(state, message.text, await source(captured, i), old);
      require(!result.changed, `回复 ${message.id} 的依据已变化，暂停推进`);
      state = result.record.state;
    }
    unchanged(captured);
    return state;
  }
  async function refresh() {
    const captured = capture();
    lastState = await readChain(captured);
    lastValidated = captured.identity;
    draftKey = `dlnm:p1:draft:${captured.chatKey}`;
    receipt = { ...receipt, revision: REVISION, chatKey: captured.chatKey, messages: captured.messages.length,
      selectedMessage: captured.messages.at(-1).id, selectedSwipe: captured.messages.at(-1).swipe,
      state: lastState, endedSignals, persistence: '已回读；耐久保存另做刷新重开验证' };
    const last = captured.messages.findLast(message => message.role === 'assistant' && message.id > 0);
    el('[data-body]').textContent = last ? parseP1Reply(last.text).body : 'P1 技术测试开场，不是最终剧情。';
    el('[data-send]').disabled = busy || captured.messages.at(-1).role !== 'assistant';
    status('有效状态已读取');
    show();
  }
  async function initialize() {
    const captured = capture();
    require(captured.messages.length === 1 && !captured.messages[0].data.dlnm, '仅为没有状态的新测试聊天初始化；已有数据保持');
    const record = { schemaVersion: 1, scope: 'p1-probe', status: 'valid', state: structuredClone(P1_INITIAL), source: await source(captured, 0) };
    write(captured, 0, record);
    await ctx().saveChat();
    unchanged(captured);
    await refresh();
  }
  async function commitReply(allowNew = false) {
    const captured = capture();
    const index = captured.messages.length - 1;
    require(index > 0 && captured.messages[index].role === 'assistant', '尚无完整助手回复');
    require(!stopped, '本轮已中止，保留正文但暂停结算');
    require(allowNew || captured.messages[index].data.dlnm?.status === 'valid', '重放只复核已完成结算的回复，不将未知结束状态当作完成');
    const base = await readChain(captured, index);
    const { record, changed } = settleP1(base, captured.messages[index].text, await source(captured, index), captured.messages[index].data.dlnm);
    unchanged(captured);
    if (changed) write(captured, index, record);
    await ctx().saveChat();
    unchanged(captured);
    receipt = { ...receipt, lastCommitChanged: changed, contentHash: record.source.contentHash, parentHash: record.source.parentHash };
    await refresh();
  }
  async function send() {
    const captured = capture();
    require(captured.messages.at(-1).role === 'assistant', '上一输入尚无有效回复；保留草稿，不重复发送');
    const base = await readChain(captured);
    const input = draft.value.trim();
    require(input.length > 0, '请先输入测试行动');
    const model = root.querySelector('#custom_model_id')?.value;
    const profile = root.querySelector('#connection_profiles')?.selectedOptions?.[0]?.textContent;
    require(model === 'z-ai/glm-5.3-flash' && profile?.trim() === 'NIM APIs OpenSource', '当前模型/配置不在测试授权内');
    require(ctx().onlineStatus !== 'no_connection', '指定连接不可用；停止测试');
    const nativeDraft = root.querySelector('#send_textarea');
    require(!nativeDraft?.value.trim(), '原生输入框另有草稿，先保留并停止本次发送');
    stopped = false;
    const prompt = `DLNM_P1_STATE ${JSON.stringify(base)}\n本轮仅验证普通日常与体力状态。正文开头写出你读到的当前体力数值。简短回应输入，不添加其他系统。末尾独占行 <lily_delta>，其后 JSON {"version":1,"changes":[...]}，再独占行 </lily_delta>。changes仅允许noa.stamina的add操作，键恰好op/path/value/grade/reason；value非零整数，minor绝对值1-5，moderate6-15，major16-30，结果0-100。没有变化写空数组。仅已完成的行动有变化，不自动扣除。`;
    receipt = { ...receipt, suppliedState: structuredClone(base), outboundPromptObserved: false, model, profile: profile.trim() };
    show();
    ({ uninject } = injectPrompts([{ id: 'dlnm-p1-state', role: 'system', position: 'in_chat', depth: 0, content: prompt, should_scan: false }], { once: false }));
    unchanged(captured);
    await createChatMessages([{ role: 'user', message: input }], { refresh: 'affected' });
    const afterInput = capture();
    require(identity(afterInput.chatKey, afterInput.messages.slice(0, -1)) === captured.identity && afterInput.messages.at(-1).role === 'user' && afterInput.messages.at(-1).text === input, '输入创建后上下文发生变化；停止生成');
    await ctx().saveChat();
    unchanged(afterInput);
    status('正在用指定模型生成；不自动重试');
    await ctx().generate('normal');
    const afterReply = capture();
    require(identity(afterReply.chatKey, afterReply.messages.slice(0, -1)) === afterInput.identity, '生成期间聊天或输入已变化，丢弃迟到处理');
    await commitReply(true);
    draft.value = '';
    sessionStorage.removeItem(draftKey);
  }
  async function run(action) {
    if (busy || destroyed) return;
    busy = true;
    panel.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try { await action(); }
    catch (error) { lastValidated = null; status(`状态待同步：${error.message}`); receipt.error = error.message; show(); }
    finally {
      uninject(); uninject = () => {};
      busy = false;
      panel.querySelectorAll('button').forEach(button => { button.disabled = false; });
      el('[data-send]').disabled = !lastValidated;
    }
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    uninject();
    listeners.forEach(listener => listener.stop());
    panel.remove();
  }
  try {
    capture();
    targetVerified = true;
    require(!root.getElementById(panel.id), '检测到已有 P1 面板，跳过重复挂载');
    require(root.querySelector('#send_form'), '当前宿主缺少已核对的输入区挂载点');
    root.querySelector('#send_form').before(panel);
    el('[data-init]').onclick = () => run(initialize);
    el('[data-refresh]').onclick = () => run(refresh);
    el('[data-replay]').onclick = () => run(commitReply);
    el('[data-send]').onclick = () => run(send);
    draftKey = `dlnm:p1:draft:${capture().chatKey}`;
    draft.value = sessionStorage.getItem(draftKey) ?? '';
    draft.oninput = () => sessionStorage.setItem(draftKey, draft.value);
    listeners.push(eventOn(tavern_events.GENERATION_STOPPED, () => { if (busy) stopped = true; }));
    listeners.push(eventOn(tavern_events.GENERATION_ENDED, () => { endedSignals++; }));
    listeners.push(eventOn(tavern_events.CHAT_COMPLETION_PROMPT_READY, event => {
      if (!busy || event.dryRun || !receipt.suppliedState) return;
      const expected = `DLNM_P1_STATE ${JSON.stringify(receipt.suppliedState)}`;
      receipt.outboundPromptObserved = event.chat.some(message => {
        if (typeof message.content === 'string') return message.content.includes(expected);
        return Array.isArray(message.content) && message.content.some(part => part.type === 'text' && part.text?.includes(expected));
      });
      receipt.promptDryRun = false;
      // Only our marker's presence is retained; never log/export the full prompt.
      show();
    }));
    listeners.push(eventOn(tavern_events.CHAT_CHANGED, destroy));
    window.addEventListener('pagehide', destroy, { once: true });
    run(refresh);
  } catch (error) {
    console.error('DLNM P1 mount:', error);
    if (targetVerified && !root.getElementById(panel.id)) root.querySelector('#send_form')?.before(panel);
    status(`P1 接入待检查：${error.message}`);
    el('[data-send]').disabled = true;
  }
})();
