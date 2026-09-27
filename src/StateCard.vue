<script setup lang="ts">
import { ref } from 'vue';
import NvlView from './NvlView.vue';
import CharacterStatus from './CharacterStatus.vue';
import { useNvl } from './nvl.ts';

const { pages, selectedId, snapshot, stateMessageId, draft, busy, connected, canSend, error,
  chatKey, hosted, opening, superseded, surfaceTarget, following, select, follow, send, stop, refresh, toggleHost } = useNvl();
const imageRevision = ref(0);
function refreshAll() { imageRevision.value++; refresh(); }
</script>

<template>
  <Teleport :to="surfaceTarget || 'body'" :disabled="!surfaceTarget">
  <NvlView v-if="hosted" v-model:draft="draft"
    :pages="pages" :selected-id="selectedId" :snapshot="snapshot" :state-message-id="stateMessageId" :following="following"
    :busy="busy" :connected="connected" :can-send="canSend" :error="error" :chat-key="chatKey" :image-revision="imageRevision"
    @select="select" @follow="follow" @send="send" @stop="stop" @refresh="refreshAll" @toggle-host="toggleHost" />
  </Teleport>
  <section v-if="!hosted && !superseded" class="nvl-entry" aria-label="人物状态轻前端">
    <header>
      <strong>人物与状态</strong>
      <div class="entry-actions">
        <button type="button" :disabled="!connected || opening" @click="toggleHost">浏览器全屏阅读</button>
        <button type="button" :disabled="!connected" @click="refreshAll">重新读取状态与图片</button>
      </div>
    </header>
    <CharacterStatus :snapshot="snapshot" :state-message-id="stateMessageId" :chat-key="chatKey" :image-revision="imageRevision" />
    <p v-if="error" role="status">{{ error }}</p>
  </section>
</template>

<style scoped>
.nvl-entry { box-sizing: border-box; display: grid; width: 100%; min-width: 0; background: #121212; color: #eee; font: 16px/1.6 sans-serif; overflow-wrap: anywhere; }
header { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); align-items: center; gap: .5rem; padding: .8rem; }
.entry-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr)); gap: .5rem; }
button { min-width: 0; min-height: 44px; border: 1px solid #777; padding: .5rem; background: #202020; color: inherit; font: inherit; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
button:focus-visible { outline: 3px solid #dedbd5; outline-offset: 2px; }
p { margin: 0; padding: .5rem .8rem; color: #f1d6d2; }
</style>
