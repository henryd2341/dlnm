import type { State } from './mvu/schema.ts';

export const characterExpressions = {
  noah: ['default', 'blush', 'nervous', 'sad', 'serious', 'sleepy', 'smile', 'surprised', 'tired_smile', 'worried'],
  lilicia: ['default', 'blush', 'command', 'sad', 'serious', 'sleepy', 'smile', 'surprised', 'tease', 'worried'],
  seraphina: ['default', 'smile'],
  tanuki: ['default', 'sad', 'smile', 'surprised', 'worried'],
} as const;
export type CharacterId = keyof typeof characterExpressions;
// First supported match wins. These are literal single-character tests, not sentiment analysis.
export const expressionRules = [
  ['tired_smile', '疲惫累'], ['command', '命令斥'], ['tease', '逗戏调'],
  ['blush', '红羞'], ['nervous', '紧慌怯'], ['worried', '忧虑愁'],
  ['sad', '悲伤哭泣'], ['serious', '严肃认'], ['surprised', '惊讶愕'],
  ['sleepy', '困睡眠'], ['smile', '喜欢乐笑'],
] as const;
const includesAny = (text: string, characters: string) => [...characters].some(character => text.includes(character));

export function portraitNames(character: CharacterId, value: { clothing?: string; expression: string }): string[] {
  const clothing = value.clothing ?? '';
  const suffix = character === 'tanuki' ? '' : character === 'seraphina'
    ? includesAny(clothing, '纱巾') ? '_sisterveil' : ''
    : includesAny(clothing, '睡内') ? '_underwear' : '';
  const expression = expressionRules.find(([name, keys]) =>
    (characterExpressions[character] as readonly string[]).includes(name) && includesAny(value.expression, keys))?.[0] ?? 'default';
  return [...new Set([`${expression}${suffix}`, `default${suffix}`, 'default'])].map(name => `${character}__${name}.png`);
}

const scenes = [
  { name: 'living', file: 'bg01_living', aliases: ['宅邸起居室', '起居室', '客厅'] },
  { name: 'hall_outside', file: 'bg02_hall_outside', aliases: ['宅邸外观', '宅邸门外', '宅邸正门'] },
  { name: 'rouka', file: 'bg03_rouka', aliases: ['宅邸走廊', '走廊', '廊道'] },
];
export function sceneImage(world: State['world'] | undefined): { names: string[]; note: string } {
  if (!world) return { names: [], note: '尚无有效场景状态' };
  const scene = scenes.find(item => item.aliases.includes(world.location.trim()));
  if (!scene) return { names: [], note: `“${world.location}”尚无对应场景图` };
  const time = ['清晨', '上午', '午后'].includes(world.period) ? 'day' : 'night';
  return { names: [`bg__${scene.name}_${time}.png`], note: world.period === '傍晚' ? '暂无黄昏专图，暂用夜景' : '' };
}

// Explicit allowlist: no arbitrary paths or entire-public-directory publishing.
export const developmentImages = [
  ...Object.entries(characterExpressions).flatMap(([character, expressions]) => {
    const suffixes = character === 'tanuki' ? [''] : character === 'seraphina' ? ['', '_sisterveil'] : ['', '_underwear'];
    return expressions.flatMap(expression => suffixes.map(suffix => ({
      name: `${character}__${expression}${suffix}.png`, source: `character/${character}/${expression}${suffix}.png`,
    })));
  }),
  ...scenes.flatMap(scene => ['day', 'night'].map(time => ({
    name: `bg__${scene.name}_${time}.png`, source: `background/${scene.file}_${time}.png`,
  }))),
];
