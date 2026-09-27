<script setup lang="ts">
import { computed } from 'vue';
import type { State } from './mvu/schema.ts';
import CardImage from './CardImage.vue';
import { portraitNames } from './images.ts';

const props = defineProps<{ snapshot: State | null; stateMessageId: number | null; chatKey: string; imageRevision: number }>();
const traitGroups = computed(() => props.snapshot ? [
  { label: '技能', color: '橙', items: [['清洁', props.snapshot.noah.cleaning, 1000], ['料理', props.snapshot.noah.cooking, 1000], ['洗涤', props.snapshot.noah.laundry, 1000]] },
  { label: '教养', color: '蓝', items: [['礼仪', props.snapshot.noah.etiquette, 1000], ['知识', props.snapshot.noah.knowledge, 1000]] },
  { label: '人格', color: '绿', items: [['魅力', props.snapshot.noah.charm, 1000], ['亲爱', props.snapshot.noah.affection, 1000]] },
  { label: '本能', color: '红', items: [['感度', props.snapshot.noah.sensitivity, 1000], ['欲求', props.snapshot.noah.desire, 100]] },
] as const : []);
function hasColor(color: string) {
  return props.snapshot?.noah.colors.some(value => value === color || value === `${color}色`) ?? false;
}
</script>

<template>
  <section class="character-status" aria-label="人物与状态">
    <div v-if="snapshot" class="character-grid">
      <section class="character-card" aria-label="诺雅的状态">
        <h2>诺雅</h2>
        <CardImage :names="portraitNames('noah', snapshot.noah)" label="诺雅" :chat-key="chatKey" :revision="imageRevision" />
        <div class="primary-meter">
          <span>体力</span><b>{{ snapshot.noah.stamina }} / 100</b>
          <meter min="0" max="100" :value="snapshot.noah.stamina" aria-label="诺雅体力"></meter>
        </div>
        <details>
          <summary>诺雅详情</summary>
          <div class="character-details">
            <dl><div><dt>服装</dt><dd>{{ snapshot.noah.clothing }}</dd></div><div><dt>神态</dt><dd>{{ snapshot.noah.expression }}</dd></div></dl>
            <div class="traits-grid">
              <section v-for="group in traitGroups" :key="group.label" class="trait-group">
                <h3 :class="['color-label', `tone-${group.color}`, { active: hasColor(group.color) }]">{{ group.label }} · {{ group.color }}</h3>
                <dl><div v-for="item in group.items" :key="item[0]"><dt>{{ item[0] }}</dt><dd>{{ item[1] }} / {{ item[2] }}</dd></div></dl>
              </section>
            </div>
            <p class="colors">已获得颜色：{{ snapshot.noah.colors.length ? snapshot.noah.colors.join('、') : '暂无' }}</p>
          </div>
        </details>
      </section>
      <section class="character-card" aria-label="莉莉希雅的状态">
        <h2>莉莉希雅</h2>
        <CardImage :names="portraitNames('lilicia', snapshot.lilicia)" label="莉莉希雅" :chat-key="chatKey" :revision="imageRevision" />
        <div class="primary-meter">
          <span>魔力</span><b>{{ snapshot.lilicia.mana }} / 100</b>
          <meter min="0" max="100" :value="snapshot.lilicia.mana" aria-label="莉莉希雅魔力"></meter>
        </div>
        <details>
          <summary>莉莉希雅详情</summary>
          <div class="character-details">
            <dl class="description-list">
              <div><dt>外貌</dt><dd>{{ snapshot.lilicia.appearance }}</dd></div>
              <div><dt>服装</dt><dd>{{ snapshot.lilicia.clothing }}</dd></div>
              <div><dt>神态</dt><dd>{{ snapshot.lilicia.expression }}</dd></div>
              <div><dt>状态</dt><dd>{{ snapshot.lilicia.condition }}</dd></div>
            </dl>
          </div>
        </details>
      </section>
      <section class="character-card" aria-label="塞拉菲娜的状态">
        <h2>塞拉菲娜</h2>
        <CardImage :names="portraitNames('seraphina', snapshot.seraphina)" label="塞拉菲娜" :chat-key="chatKey" :revision="imageRevision" />
        <dl><div><dt>服装</dt><dd>{{ snapshot.seraphina.clothing }}</dd></div><div><dt>神态</dt><dd>{{ snapshot.seraphina.expression }}</dd></div></dl>
      </section>
      <section class="character-card" aria-label="狸猫的状态">
        <h2>狸猫</h2>
        <CardImage :names="portraitNames('tanuki', snapshot.tanuki)" label="狸猫" :chat-key="chatKey" :revision="imageRevision" />
        <dl><div><dt>神态</dt><dd>{{ snapshot.tanuki.expression }}</dd></div></dl>
      </section>
      <details class="state-source">
        <summary>状态来源</summary>
        <p>消息 {{ stateMessageId ?? '未标记' }} · 已保存的有效人物数据</p>
      </details>
    </div>
    <p v-else class="empty-state" role="status">当前没有通过校验的有效人物状态，体力与魔力暂不显示数值。</p>
  </section>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }
.character-status { container-type: inline-size; min-width: 0; color: #f3f1ed; background: #121212; font: 16px/1.65 "Noto Serif SC", "Songti SC", "Microsoft YaHei", serif; overflow-wrap: anywhere; }
.character-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: .8rem; padding: .8rem; }
@container (min-width: 30rem) { .character-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.character-card { display: grid; align-content: start; min-width: 0; gap: .5rem; padding: .75rem; border: 1px solid #393939; background: #1c1c1c; }
h2 { margin: 0; font-size: 1rem; }
.primary-meter { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .2rem .4rem; font-size: .85rem; }
meter { grid-column: 1 / -1; width: 100%; height: .65rem; appearance: none; border: 0; border-radius: 2px; background: #4a4a4a; }
meter::-webkit-meter-bar { border: 0; border-radius: 2px; background: #4a4a4a; }
meter::-webkit-meter-optimum-value { background: #dedbd5; }
meter::-moz-meter-bar { background: #dedbd5; }
details { min-width: 0; }
summary { min-height: 44px; padding: .55rem .2rem; cursor: pointer; font-size: .85rem; }
summary:focus-visible { outline: 3px solid #dedbd5; outline-offset: 2px; }
.character-details { display: grid; grid-template-columns: minmax(0, 1fr); gap: .8rem; padding-top: .4rem; }
.traits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); gap: .7rem; }
.trait-group { min-width: 0; }
.trait-group h3 { margin: 0 0 .3rem; padding-left: .45rem; border-left: 4px solid #747474; color: #aaa; font-size: .8rem; }
dl { margin: 0; font-size: .8rem; }
dl > div { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .5rem; border-bottom: 1px dotted #3c3c3c; }
dd { min-width: 0; margin: 0; text-align: right; }
.color-label.active.tone-橙 { border-color: #d68135; color: #e6a15f; }
.color-label.active.tone-蓝 { border-color: #4f83ae; color: #80acd0; }
.color-label.active.tone-绿 { border-color: #568b61; color: #83b18b; }
.color-label.active.tone-红 { border-color: #a94f48; color: #d57a72; }
.colors, .state-source { margin: 0; color: #aaa7a1; font-size: .8rem; }
.state-source { grid-column: 1 / -1; }
.state-source p { margin: 0 0 .5rem; }
.empty-state { margin: 0; padding: 1rem; color: #aaa7a1; }
</style>
