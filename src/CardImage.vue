<script setup lang="ts">
import { ref, watch } from 'vue';
import { currentImageContext, imageSource, loadImage, openImageLookup } from './image-loader.ts';

const props = defineProps<{ names: string[]; label: string; chatKey: string; revision: number; scene?: boolean; note?: string }>();
const src = ref(''), message = ref(''), selected = ref('');
watch([() => props.names.join('|'), () => props.chatKey, () => props.revision, () => props.note], async (_, __, onCleanup) => {
  const controller = new AbortController(), { signal } = controller;
  onCleanup(() => controller.abort());
  src.value = ''; selected.value = ''; message.value = '';
  const names = [...props.names], chatKey = props.chatKey;
  if (!names.length) { message.value = props.note || '暂无对应图片'; return; }
  message.value = '正在读取图片…';
  try {
    const host = window.parent;
    const lookup = await openImageLookup(host, chatKey, signal);
    const failures: string[] = [];
    for (const [index, name] of names.entries()) {
      try {
        const url = await lookup(name);
        if (!url) { failures.push(`${name} 缺失`); continue; }
        await loadImage(url, signal);
        if (signal.aborted) return;
        currentImageContext(host, chatKey);
        src.value = url; selected.value = name;
        message.value = index > 0 ? `${[...new Set(failures)].join('；')}；暂用 ${name}` : '';
        return;
      } catch (cause) {
        if (signal.aborted) return;
        failures.push(cause instanceof Error ? cause.message : '图片读取失败');
      }
    }
    message.value = `暂无可用图片：${[...new Set(failures)].join('；')}`;
  } catch (cause) { if (!signal.aborted) message.value = cause instanceof Error ? cause.message : '图片读取失败'; }
}, { immediate: true, flush: 'sync' });
function expired() { src.value = ''; message.value = '图片地址已失效，请点击重新读取'; }
</script>

<template>
  <figure class="card-image" :class="{ 'scene-image': scene }">
    <img v-if="src" :key="src" :src="src" :alt="`${label} · ${selected}`" @error="expired" />
    <div v-else class="image-placeholder" role="img" :aria-label="`${label}暂无图片`">{{ label }}</div>
    <figcaption>
      <span>{{ imageSource === 'development' ? '开发占位图' : '当前角色图包' }}</span>
      <span v-if="note && names.length"> · {{ note }}</span>
      <span v-if="message" role="status"> · {{ message }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.card-image { box-sizing: border-box; min-width: 0; margin: 0; background: #111; }
img, .image-placeholder { box-sizing: border-box; display: block; width: 100%; height: auto; padding: .25rem; object-fit: contain; }
.image-placeholder { display: grid; place-content: center; aspect-ratio: 3 / 4; color: #aaa; border: 1px dashed #555; }
figcaption { min-height: 2.5em; padding: .25rem .5rem; color: #b9b6b0; font: .7rem/1.4 sans-serif; overflow-wrap: anywhere; }
.scene-image { position: relative; min-height: 520px; height: 100%; filter: grayscale(1); }
.scene-image img, .scene-image .image-placeholder { position: sticky; top: 0; height: min(100dvh, 760px); min-height: 520px; padding: 0; object-fit: cover; }
.scene-image::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #050505d9, #111a 48%, #050505de), linear-gradient(0deg, #060606de, transparent 45%, #090909b3); }
.scene-image figcaption { position: absolute; z-index: 1; top: .5rem; right: .5rem; max-width: calc(100% - 1rem); background: #111d; }
</style>
