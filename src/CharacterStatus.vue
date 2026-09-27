<script setup lang="ts">
import { computed } from 'vue';
import type { State } from './mvu/schema.ts';

const props = defineProps<{ snapshot: State | null; stateMessageId: number | null }>();
const traitGroups = computed(() => props.snapshot ? [
  { label: '技能', color: '橙', items: [['清洁', props.snapshot.noa.cleaning, 1000], ['料理', props.snapshot.noa.cooking, 1000], ['洗涤', props.snapshot.noa.laundry, 1000]] },
  { label: '教养', color: '蓝', items: [['礼仪', props.snapshot.noa.etiquette, 1000], ['知识', props.snapshot.noa.knowledge, 1000]] },
  { label: '人格', color: '绿', items: [['魅力', props.snapshot.noa.charm, 1000], ['亲爱', props.snapshot.noa.affection, 1000]] },
  { label: '本能', color: '红', items: [['感度', props.snapshot.noa.sensitivity, 1000], ['欲求', props.snapshot.noa.desire, 100]] },
] as const : []);
function hasColor(color: string) {
  return props.snapshot?.noa.colors.some(value => value === color || value === `${color}色`) ?? false;
}
</script>

<template>
  <section class="character-status" aria-label="人物与状态">
    <div v-if="snapshot" class="character-grid">
      <section class="character-card" aria-label="诺雅的状态">
        <h2>诺雅</h2>
        <div class="primary-meter">
          <span>体力</span><b>{{ snapshot.noa.stamina }} / 100</b>
          <meter min="0" max="100" :value="snapshot.noa.stamina" aria-label="诺雅体力"></meter>
        </div>
        <details>
          <summary>诺雅详情</summary>
          <div class="character-details">
            <div class="portrait portrait-noa" role="img" aria-label="诺雅头像占位"><span>头像占位</span><b>诺雅</b></div>
            <div class="traits-grid">
              <section v-for="group in traitGroups" :key="group.label" class="trait-group">
                <h3 :class="['color-label', `tone-${group.color}`, { active: hasColor(group.color) }]">{{ group.label }} · {{ group.color }}</h3>
                <dl><div v-for="item in group.items" :key="item[0]"><dt>{{ item[0] }}</dt><dd>{{ item[1] }} / {{ item[2] }}</dd></div></dl>
              </section>
            </div>
            <p class="colors">已获得颜色：{{ snapshot.noa.colors.length ? snapshot.noa.colors.join('、') : '暂无' }}</p>
          </div>
        </details>
      </section>
      <section class="character-card" aria-label="莉莉希雅的状态">
        <h2>莉莉希雅</h2>
        <div class="primary-meter">
          <span>魔力</span><b>{{ snapshot.lilixia.mana }} / 100</b>
          <meter min="0" max="100" :value="snapshot.lilixia.mana" aria-label="莉莉希雅魔力"></meter>
        </div>
        <details>
          <summary>莉莉希雅详情</summary>
          <div class="character-details">
            <div class="portrait portrait-lilixia" role="img" aria-label="莉莉希雅头像占位"><span>头像占位</span><b>莉莉希雅</b></div>
            <dl class="description-list">
              <div><dt>外貌</dt><dd>{{ snapshot.lilixia.appearance }}</dd></div>
              <div><dt>服装</dt><dd>{{ snapshot.lilixia.clothing }}</dd></div>
              <div><dt>神态</dt><dd>{{ snapshot.lilixia.expression }}</dd></div>
              <div><dt>状态</dt><dd>{{ snapshot.lilixia.condition }}</dd></div>
            </dl>
          </div>
        </details>
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
.character-status { min-width: 0; color: #f3f1ed; background: #121212; font: 16px/1.65 "Noto Serif SC", "Songti SC", "Microsoft YaHei", serif; overflow-wrap: anywhere; }
.character-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); align-items: start; gap: .8rem; padding: .8rem; }
.character-card { display: grid; min-width: 0; gap: .5rem; padding: .75rem; border: 1px solid #393939; background: #1c1c1c; }
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
.portrait { position: relative; width: 82px; max-width: 100%; height: 116px; display: grid; place-content: center; overflow: hidden; border: 1px solid #6a6863; background: linear-gradient(135deg, #555, #151515 70%); text-align: center; }
.portrait::before { content: ""; width: 34px; height: 34px; margin: auto; border: 2px solid #a5a39e; border-radius: 50%; }
.portrait::after { content: ""; width: 58px; height: 48px; margin-top: -2px; border: 2px solid #888681; border-bottom: 0; border-radius: 50% 50% 0 0; }
.portrait span { position: absolute; inset: .2rem .2rem auto; color: #ccc; font-size: .62rem; }
.portrait b { position: absolute; inset: auto 0 0; padding: .2rem; background: #111d; font-size: .76rem; }
.portrait-lilixia { background: linear-gradient(215deg, #717171, #1b1b1b 68%); }
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
