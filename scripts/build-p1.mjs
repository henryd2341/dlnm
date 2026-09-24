// Retired native-variable probe. --check is historical validation only.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

if (!process.argv.includes('--check')) {
  console.error('Retired native-variable probe: use the MVU Zod route in docs/NEXT.md. Only --check remains for historical inspection.');
  process.exit(1);
}

const state = readFileSync(new URL('../src/p1-state.mjs', import.meta.url), 'utf8');
const host = readFileSync(new URL('../src/p1-host.js', import.meta.url), 'utf8');
const content = state.replace(/^export /gm, '') + '\n' + host.replace(/^import .*?;\r?\n/, '');
new Function(content); // Syntax check the exact concatenated payload before writing.
const data = {
  name: 'DLNM-P1-香气链路',
  description: '专用日常聊天链路测试。用简短中文回应普通宅邸行动，只根据当前实际行动调整体力。遵循当前有效状态与尾部变化格式。此卡仅为P1技术检查，不是完成的同人首版。',
  personality: '平和、简洁，不替玩家做决定。',
  scenario: '宅邸起居室中的普通日常交流。',
  first_mes: 'DLNM_P1_START\n这是独立的P1链路测试聊天。先用检查面板初始化，再输入一次简单的日常行动。',
  mes_example: '', creator_notes: 'P1 checkpoint only; no final art, complete state, or P4 story. Uses existing Tavern Helper. No remote imports in the card-owned script.',
  system_prompt: '', post_history_instructions: '', alternate_greetings: [], tags: ['DLNM-P1-test'],
  creator: 'Local project', character_version: 'p1.2',
  extensions: { tavern_helper: { variables: {}, scripts: [{
    type: 'script', enabled: true, name: 'DLNM-P1-香气链路', id: 'dlnm-p1-scent-v1',
    content, info: '仅处理同名专用测试卡。页面出现P1面板才代表脚本实际运行。',
    button: { enabled: false, buttons: [] }, data: {}, export_with: { data: true, button: true },
  }] } },
};
const card = { spec: 'chara_card_v2', spec_version: '2.0', data };
const serialized = JSON.stringify(card, null, 2) + '\n';
const sha = createHash('sha256').update(serialized).digest('hex');
assert.equal(JSON.parse(serialized).data.extensions.tavern_helper.scripts[0].content, content);
console.log(`LEGACY probe build check PASS: ${Buffer.byteLength(serialized)} bytes, SHA256 ${sha}; not MVU Zod acceptance.`);
