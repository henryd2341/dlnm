<script setup lang="ts">
import NvlView from './NvlView.vue';
import { useNvl } from './nvl.ts';

const { pages, selectedId, snapshot, stateMessageId, draft, busy, connected, canSend, error,
  chatKey, hosted, opening, mode, surfaceTarget, following, select, follow, send, stop, refresh, toggleHost } = useNvl();
</script>

<template>
  <Teleport :to="surfaceTarget || 'body'" :disabled="!surfaceTarget">
  <NvlView v-if="hosted" v-model:draft="draft"
    :pages="pages" :selected-id="selectedId" :snapshot="snapshot" :state-message-id="stateMessageId" :following="following"
    :busy="busy" :connected="connected" :can-send="canSend" :error="error" :chat-key="chatKey" :hosted="hosted" :mode="mode"
    @select="select" @follow="follow" @send="send" @stop="stop" @refresh="refresh" @toggle-host="toggleHost()"
    @change-mode="toggleHost($event)" />
  </Teleport>
  <section v-if="!hosted" class="nvl-entry" aria-label="NVL 阅读入口">
    <button type="button" :disabled="!connected || opening" @click="toggleHost('fullscreen')">浏览器全屏阅读</button>
    <button type="button" :disabled="!connected || opening" @click="toggleHost('panel')">面板模式</button>
    <button type="button" :disabled="!connected" @click="refresh">重新读取状态</button>
    <p>点击进入浏览器全屏，Escape 退出；面板模式仅在手动选择时启用。</p>
    <p v-if="error" role="status">{{ error }}</p>
  </section>
</template>

<style scoped>
.nvl-entry { padding: 1rem; background: #181818; color: #eee; font: 16px/1.6 sans-serif; }
button { min-height: 44px; padding: .5rem 1rem; font: inherit; cursor: pointer; }
</style>
