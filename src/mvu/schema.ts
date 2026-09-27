import { z } from 'zod';

const boundedInteger = (maximum: number) => z.number().int().min(0).max(maximum);
const boundedText = (maximum: number) => z.string()
  .refine(value => value.trim().length > 0, 'must contain visible text')
  .refine(value => [...value].length <= maximum, `must contain at most ${maximum} characters`);

const colorName = boundedText(16);

export const Schema = z.strictObject({
  world: z.strictObject({
    day: z.number().int().refine(Number.isSafeInteger, 'must be a safe integer').min(1),
    period: z.enum(['清晨', '上午', '午后', '傍晚', '夜间', '深夜']),
    location: boundedText(80),
  }),
  noah: z.strictObject({
    stamina: boundedInteger(100),
    cleaning: boundedInteger(1000),
    cooking: boundedInteger(1000),
    laundry: boundedInteger(1000),
    etiquette: boundedInteger(1000),
    knowledge: boundedInteger(1000),
    charm: boundedInteger(1000),
    affection: boundedInteger(1000),
    sensitivity: boundedInteger(1000),
    desire: boundedInteger(100),
    colors: z.array(colorName).transform(colors => [...new Set(colors)]),
    clothing: boundedText(120),
    expression: boundedText(120),
  }),
  lilicia: z.strictObject({
    mana: boundedInteger(100),
    appearance: boundedText(120),
    clothing: boundedText(120),
    expression: boundedText(120),
    condition: boundedText(120),
  }),
  seraphina: z.strictObject({
    clothing: boundedText(120),
    expression: boundedText(120),
  }),
  tanuki: z.strictObject({
    expression: boundedText(120),
  }),
});

export type State = z.infer<typeof Schema>;

export const initialState: State = {
  world: { day: 1, period: '上午', location: '宅邸起居室' },
  noah: {
    stamina: 100,
    cleaning: 60,
    cooking: 60,
    laundry: 60,
    etiquette: 60,
    knowledge: 50,
    charm: 50,
    affection: 60,
    sensitivity: 40,
    desire: 0,
    colors: ['红', '绿', '蓝', '橙'],
    clothing: '女仆服',
    expression: '神态平静',
  },
  lilicia: {
    mana: 100,
    appearance: '平日模样',
    clothing: '居家便服',
    expression: '神态放松',
    condition: '无明显不适',
  },
  seraphina: {
    clothing: '修女服，戴头纱',
    expression: '神态平静',
  },
  tanuki: {
    expression: '神态平静',
  },
};
