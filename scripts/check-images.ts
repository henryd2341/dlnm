// Optional after explicit test permission: node scripts/check-images.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computed, reactive, watch } from 'vue';
import { portraitNames, sceneImage, developmentImages, expressionRules } from '../src/images.ts';
import { currentImageContext, findImage, bounded } from '../src/image-loader.ts';
const portrait = (expression: string, clothing = '女仆服') => portraitNames('noah', { expression, clothing });
assert.deepEqual(portrait('羞涩地微笑', '睡衣'), ['noah__blush_underwear.png', 'noah__default_underwear.png', 'noah__default.png']);
assert.equal(portrait('微怒')[0], 'noah__default.png');
assert.equal(portrait('微笑')[0], 'noah__smile.png');
assert.equal(portrait('不喜欢')[0], 'noah__smile.png'); // Deliberate literal matching, not negation parsing.
assert.equal(portrait('疲惫地微笑')[0], 'noah__tired_smile.png');
assert.equal(portrait('神态平静', '未穿内衣')[0], 'noah__default_underwear.png');
assert.equal(portraitNames('seraphina', { expression: '脸红', clothing: '修女服，戴头纱' })[0], 'seraphina__default_sisterveil.png');
assert.equal(portraitNames('seraphina', { expression: '开心地微笑', clothing: '修女服' })[0], 'seraphina__smile.png');
assert.equal(portraitNames('tanuki', { expression: '忧虑', clothing: '睡衣' })[0], 'tanuki__worried.png');
assert.equal(portraitNames('lilicia', { expression: '严令', clothing: '便服' })[0], 'lilicia__command.png');
assert.equal(expressionRules.find(([name]) => name === 'smile')?.[1], '喜欢乐笑');
assert.equal(sceneImage({ day: 1, period: '上午', location: '客厅' }).names[0], 'bg__living_day.png');
assert.match(sceneImage({ day: 1, period: '傍晚', location: '宅邸起居室' }).note, /夜景/);
assert.equal(sceneImage({ day: 1, period: '夜间', location: '瑟雷妮亚' }).names.length, 0);
assert.equal(sceneImage(undefined).names.length, 0);
const sceneLocations = [
  ['living', '客厅'], ['hall_outside', '宅邸正门'], ['rouka', '走廊'],
  ['liliciaroom', '莉莉希雅的卧室'], ['noahroom', '诺雅的房间'], ['kitchen', '厨房'],
  ['bathroom', '浴室'], ['garden', '庭院'], ['library', '书库'], ['entrance', '玄关大厅'],
];
const backgrounds = [];
for (const [name, location] of sceneLocations) {
  for (const period of ['清晨', '上午', '午后', '傍晚', '夜间'] as const) {
    const time = ['傍晚', '夜间'].includes(period) ? 'night' : 'day';
    const image = `bg__${name}_${time}.png`;
    assert.deepEqual(sceneImage({ day: 1, period, location: `宅邸内·${location}窗边` }).names, [image]);
    backgrounds.push(image);
  }
}
assert.deepEqual(
  developmentImages.filter(image => image.source.startsWith('background/')).map(image => image.name).sort(),
  [...new Set(backgrounds)].sort(),
);
const lastScene = sceneImage({ day: 1, period: '上午', location: '厨房' });
for (const location of ['瑟雷妮亚', '', '   ']) {
  assert.equal(sceneImage({ day: 1, period: '夜间', location }, lastScene), lastScene);
}
assert.equal(sceneImage(undefined, lastScene), lastScene);
assert.deepEqual(sceneImage({ day: 1, period: '夜间', location: '花园深处' }, lastScene).names, ['bg__garden_night.png']);
assert.equal(developmentImages.length, 69);
assert.equal(new Set(developmentImages.map(image => image.name)).size, 69);
for (const image of developmentImages) {
  assert.match(image.name, /^(?:noah|lilicia|seraphina|tanuki|bg)__[a-z0-9_]+\.png$/);
  assert.match(image.source, /^(?:character|background)\/[a-z0-9_/]+\.png$/);
  assert.doesNotMatch(image.source, /(?:^|\/)\.\.(?:\/|$)/);
}
const item = { character: 'CARD', fileName: 'noah__default.png', relativePath: 'folder/noah__default.png' };
assert.equal(findImage([item], item.fileName), item);
assert.equal(findImage([item], 'tanuki__default.png'), undefined);
assert.throws(() => findImage([item, item], item.fileName), /重名/);
assert.throws(() => findImage([{ ...item, relativePath: '../noah__default.png' }], item.fileName), /路径/);
const host = { SillyTavern: { getContext: () => ({ characterId: 0, groupId: null, getCurrentChatId: () => 'new-chat' }) } } as never;
currentImageContext(host, '[0,"new-chat"]');
assert.throws(() => currentImageContext(host, '[0,"old-chat"]'), /聊天/);
const controller = new AbortController();
controller.abort();
await assert.rejects(bounded(new Promise(() => {}), controller.signal), /取消/);
const loader = readFileSync(new URL('../src/image-loader.ts', import.meta.url), 'utf8');
assert.doesNotMatch(loader, /\.revokeUrl\(|\.clearCache\(|replaceVariables|setChatMessages/);
const imageComponent = readFileSync(new URL('../src/CardImage.vue', import.meta.url), 'utf8');
assert.match(imageComponent, /object-fit: contain/);
assert.match(imageComponent, /onCleanup\(\(\) => controller\.abort\(\)\)/);
// Exercise the view's actual getter with Vue: unknown locations retain names/note,
// so CardImage neither clears the image nor aborts an in-flight load.
const view = readFileSync(new URL('../src/NvlView.vue', import.meta.url), 'utf8');
const sceneGetter = view.match(/const scene = computed<[^\n]+>\(\s*([\s\S]*?)\s*\);/)![1].replace(/,\s*$/, '');
const props = reactive<{ snapshot: { world: Parameters<typeof sceneImage>[0] } | null; chatKey: string }>({
  snapshot: { world: { day: 1, period: '上午', location: '厨房' } }, chatKey: 'chat-a',
});
const scene = new Function('computed', 'sceneImage', 'props', `return computed(${sceneGetter});`)(computed, sceneImage, props);
let imageReloads = 0;
const stop = watch([() => scene.value.names.join('|'), () => props.chatKey, () => scene.value.note],
  () => imageReloads++, { immediate: true, flush: 'sync' });
const first = scene.value;
props.snapshot!.world = { day: 1, period: '夜间', location: '未知地点' };
assert.deepEqual(scene.value, first);
props.snapshot = null;
assert.deepEqual(scene.value, first);
assert.equal(imageReloads, 1, 'unknown/missing state must not restart the background load');
props.chatKey = 'chat-b';
assert.deepEqual(scene.value.names, [], 'another chat must not inherit the previous background');
props.snapshot = { world: { day: 1, period: '夜间', location: '宅邸花园深处' } };
assert.deepEqual(scene.value.names, ['bg__garden_night.png']);
stop();
console.log('N4 image checks passed; browser/Gremlin/manual acceptance still separate.');
