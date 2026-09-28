import { cardName, createCardContent } from './card-content.ts';

type CardParts = { schemaScript: string; loaderScript: string; stateHtml: string };

function script(id: string, name: string, content: string) {
  return {
    type: 'script', enabled: true, name, id, content,
    info: `仅用于“${cardName}”角色卡。`,
    button: { enabled: false, buttons: [] },
    data: {},
    export_with: { data: true, button: true },
  };
}

function regex(id: string, scriptName: string, findRegex: string, replaceString: string, mode: 'display' | 'prompt') {
  return {
    id, scriptName, findRegex, replaceString, trimStrings: [], placement: [2], disabled: false,
    markdownOnly: mode === 'display', promptOnly: mode === 'prompt', runOnEdit: true,
    substituteRegex: 0, minDepth: null, maxDepth: null,
  };
}

function safeHtmlReplacement(html: string) {
  // ST interprets $1/$<name> before returning the replacement. Base64 preserves the complete built HTML byte-for-byte.
  const bytes = new TextEncoder().encode(html);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  const encoded = btoa(binary);
  // Tavern Helper recognizes HTML markers before decoding; keep the doctype outside Base64.
  const iframeLoader = `<!DOCTYPE html>\n<script>document.write(new TextDecoder().decode(Uint8Array.from(atob("${encoded}"),c=>c.charCodeAt(0))));<\/script>`;
  return `\`\`\`html\n${iframeLoader}\n\`\`\``;
}

export function createCard({ schemaScript, loaderScript, stateHtml }: CardParts) {
  for (const [name, value] of Object.entries({ schemaScript, loaderScript, stateHtml })) {
    if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be nonempty text`);
  }

  const content = createCardContent();

  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      ...content,
      extensions: {
        world: content.character_book.name,
        regex_scripts: [
          regex('dlnm-hide-update-display', 'DLNM · 显示时隐藏完整变量块', '/(?:\\r?\\n)?<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/g', '', 'display'),
          regex('dlnm-hide-history-prompt', 'DLNM · 提示中隐藏历史变量块与占位符', '/(?:\\r?\\n)?<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>|<StatusPlaceHolderImpl\\/>/g', '', 'prompt'),
          { ...regex('dlnm-state-display', 'DLNM · 最新回复 NVL 阅读入口', '/<StatusPlaceHolderImpl\\/>|$/', '\n\n' + safeHtmlReplacement(stateHtml), 'display'), maxDepth: 0 },
        ],
        tavern_helper: {
          variables: {},
          scripts: [
            script('dlnm-mvu-schema', 'DLNM · MVU Zod Schema', schemaScript),
            script('dlnm-mvu-runtime-loader', 'DLNM · MVU 运行组件加载器', loaderScript),
          ],
        },
      },
    },
  };
}
