import { initialState } from './mvu/schema.ts';

// ponytail: only this card's two mapping levels; use a YAML library if the schema gains deeper nesting.
export const initialYaml = Object.entries(initialState).map(([group, values]) =>
  `${group}:\n${Object.entries(values).map(([key, value]) => Array.isArray(value)
    ? `  ${key}:\n${value.map(item => `    - ${JSON.stringify(item)}`).join('\n')}`
    : `  ${key}: ${JSON.stringify(value)}`).join('\n')}`).join('\n');

function entry(id: number, name: string, content: string, enabled = true) {
  return {
    id, keys: [], secondary_keys: [], comment: name, content,
    constant: true, selective: false, insertion_order: 100 - id,
    enabled, position: 'before_char', extensions: {},
  };
}

const fieldRules = `【作用范围】仅约束本卡 MVU stat_data 的 19 个既有字段；初始值只取 [initvar] 条目，不在此重复。
数值：world.day 为正安全整数且不得倒退；noa.stamina、noa.desire、lilixia.mana 为 0..100 整数；noa.cleaning、noa.cooking、noa.laundry、noa.etiquette、noa.knowledge、noa.charm、noa.affection、noa.sensitivity 为 0..1000 整数。
长期数值只在有对应经历时增加：日常练习 +1..3，明确进展 +4..8，显著突破 +9..15。体力、魔力、欲求按实际事件增减：轻微 1..5，明显 6..15，大幅 16..30。无每消息自动消耗或增长；最终值不得越界。
文本：world.period 仅清晨、上午、午后、傍晚、夜间、深夜；world.location 为 1..80 字符非空文本；lilixia.appearance、lilixia.clothing、lilixia.expression、lilixia.condition 为 1..120 字符非空文本。
数组：noa.colors 仅追加 1..16 字符非空颜色名；重复同色有效但不重复保存。莉莉希雅没有好感度字段，不新增字段。`;

const outputRules = `【作用范围】每次回复末尾输出一次本卡 MVU JSONPatch；正文不得伪造状态或身份。
格式：回复尾部放唯一 UpdateVariable 块；块内先写 Analyze 简短故事事实依据，再写 JSONPatch 操作数组，不写隐藏思考。
路径相对于 stat_data。只允许 replace（替换既有字段）、delta（数值增量）、insert（向 colors 尾部追加）；不要输出 RFC 6902 的其他操作。没有变化时 JSONPatch 写 []，缺块不等于空数组。
示例：
<UpdateVariable><Analyze>普通闲谈，没有状态变化</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>
<UpdateVariable><Analyze>完成一次清洁练习并消耗少量体力</Analyze><JSONPatch>[{"op":"delta","path":"/noa/cleaning","value":2},{"op":"delta","path":"/noa/stamina","value":-2}]</JSONPatch></UpdateVariable>
<UpdateVariable><Analyze>行动后进入午后</Analyze><JSONPatch>[{"op":"replace","path":"/world/period","value":"午后"}]</JSONPatch></UpdateVariable>
<UpdateVariable><Analyze>一次有意义的经历中首次辨认出紫色</Analyze><JSONPatch>[{"op":"insert","path":"/noa/colors/-","value":"紫"}]</JSONPatch></UpdateVariable>`;

export function createCardContent() {
  return {
    name: 'DLNM-P1-香气链路',
    description: '原作结局后的同人续篇专用测试卡。玩家扮演诺雅，模型负责莉莉希雅与环境。',
    personality: '莉莉希雅会主动表达愿望与关心，同时尊重诺雅的决定。',
    scenario: '续篇第 1 日上午，宅邸起居室。两人共同生活，莉莉希雅提出寻找共用香气的邀请。',
    first_mes: `续篇第 1 日上午，宅邸起居室。莉莉希雅向诺雅提出了寻找两人共用香气的邀请；你可以接受、推迟或改变计划。\n\n<UpdateVariable><Analyze>开场初值由世界书载入，本轮没有额外变化</Analyze><JSONPatch>[]</JSONPatch></UpdateVariable>\n\n<StatusPlaceHolderImpl/>`,
    mes_example: '',
    creator_notes: '成品 A 已获用户接受；N3 Grid 人物轻前端待手验，图片接入留 N4。变量初始化与保存链沿用已确认版本。卡内容由命令行推送，NA 世界书按本地源码整本覆盖；前端由固定地址异步加载，构建后刷新即可获取新版。内嵌组件存在不代表宿主已完成世界书链接、角色正则许可或远程脚本执行。本卡 Schema 和界面从配置的 Vite 地址载入，需保持开发服务运行。沿用 P1 卡名以保持脚本识别和组件身份；保留旧 R2 世界书，旧聊天不自动迁移。',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: ['DLNM', 'P2', 'MVU', 'NVL'],
    creator: 'DLNM',
    character_version: 'p2-nvl-na',
    character_book: {
      name: 'DLNM-P1-香气链路-世界书-NA',
      description: 'DLNM P1 专用卡的初始化、状态上下文和更新合同。导入卡片后仍须由宿主导入并链接此世界书。',
      extensions: {},
      entries: [
        entry(0, '[initvar] DLNM 初始状态（禁用，不进入提示）', initialYaml, false),
        entry(1, 'DLNM 已确认关系与宅邸日常', `【作用范围】仅提供已确认的续篇关系与日常边界。
玩家扮演诺雅；模型描写环境、莉莉希雅及其他人物，不替诺雅决定。诺雅与莉莉希雅明确处于恋人关系，重心是互相依偎与共同生活。莉莉希雅可以主动提出愿望、邀请和烦恼，但不替代玩家选择。首版以宅邸日常和自然外出为主，不强制采购、收集颜色或成长。`),
        entry(2, 'DLNM 当前已校验状态', `【作用范围】只向模型提供父桥接脚本注册的、当前所选消息分支的已校验 MVU 状态；不要原样复述。\n<dlnm_state>\n{{dlnm_state}}\n</dlnm_state>`),
        entry(3, 'DLNM 19 字段与变化规则', fieldRules),
        entry(4, 'DLNM MVU JSONPatch 输出规则', outputRules),
        entry(5, 'DLNM 正文呈现约定', `【作用范围】仅决定正文排版，不改变状态字段与更新合同。
可少量使用 Markdown 段落、加粗、斜体、列表、引用、代码块及常规链接；不要把整个回复写成 HTML 文档，不输出前端脚本、iframe 或加载器。
允许以闭合 span 少量染色，例如：<span style="color: red">炉火映在杯沿。</span>、<span style="color: #9bc7ff">月光落在窗边。</span>。只写 color；优先选择黑底上清楚可读的亮色，不使用透明色、背景、定位、事件属性或其他样式。
染色只是正文呈现，不代表诺雅获得新颜色，不修改 noa.colors，不自动发放奖励。显示颜色与游戏颜色分别处理。
每轮尾部仍只输出一个完整 UpdateVariable 块；Analyze 写简短事实依据，JSONPatch 保持原格式与真实状态变化，不在技术块中插入 HTML。`),
      ],
    },
  };
}
