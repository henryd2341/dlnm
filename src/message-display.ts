type Showdown = { Converter: new (options?: Record<string, unknown>) => { makeHtml(text: string): string } };
type SanitizeHook = (node: Element, data: { attrName: string; attrValue: string; keepAttr: boolean }) => void;
type Purifier = {
  isSupported: boolean;
  addHook(name: 'uponSanitizeAttribute' | 'afterSanitizeAttributes', hook: SanitizeHook): void;
  sanitize(html: string, options: Record<string, unknown>): string;
};
type PurifierFactory = ((host: Window) => Purifier) & Partial<Purifier>;
type HostLibraries = { showdown?: Showdown; DOMPurify?: PurifierFactory };
type DisplayHost = Window & {
  CSS?: { supports(property: string, value: string): boolean };
  URL: new (url: string) => URL;
  showdown?: Showdown;
  DOMPurify?: PurifierFactory;
  SillyTavern?: { libs?: HostLibraries };
};

const TECHNICAL_TAGS = 'UpdateVariable|Analyze|JSONPatch';
const CARD_LOADER = /(?:^|\n)[ \t]*```html[^\n]*\n(?=<!doctype html>\s*<script>document\.write\(new TextDecoder\(\)\.decode\(Uint8Array\.from\(atob\(")[\s\S]*?(?:\n[ \t]*```|$)/gi;
const RAW_CARD_LOADER = /<!doctype html>\s*<script>document\.write\(new TextDecoder\(\)\.decode\(Uint8Array\.from\(atob\("[\s\S]*?(?:<\/script>|$)/gi;

function stripTechnicalCodeContainers(text: string) {
  const markers = ['updatevariable', 'analyze', 'jsonpatch', 'statusplaceholderimpl'];
  const containsTechnicalTag = (value: string) => [...value.matchAll(/<([a-z]+)/gi)].some(match => {
    const tag = match[1]!.toLowerCase();
    return tag.length >= 4 && markers.some(marker => marker.startsWith(tag) || tag.startsWith(marker));
  });
  const fenced = text.replace(/(?:^|\n)[ \t]{0,3}(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?(?:\n[ \t]{0,3}\1[ \t]*(?=\n|$)|$))/g, block => {
    if (!containsTechnicalTag(block)) return block;
    return block.startsWith('\n') ? '\n' : '';
  });
  return fenced.replace(/(`+)([^\n]*?)\1/g, code => containsTechnicalTag(code) ? '' : code);
}

function stripPartialMarkerTail(text: string) {
  const start = text.lastIndexOf('<');
  if (start < 0) return text;
  const tail = text.slice(start + 1).replace(/[\s/]/g, '').toLowerCase();
  const markers = ['updatevariable', 'analyze', 'jsonpatch', 'statusplaceholderimpl'];
  return tail && markers.some(marker => marker.startsWith(tail)) ? text.slice(0, start) : text;
}

/** Removes this card's display-only technical tail, including copies wrapped as Markdown code. */
export function visibleBody(text: string): string {
  if (typeof text !== 'string') throw new TypeError('消息正文必须是文本');
  const body = stripTechnicalCodeContainers(text.replace(CARD_LOADER, '\n').replace(RAW_CARD_LOADER, ''));
  const complete = new RegExp(`<UpdateVariable\\b[^>]*>[\\s\\S]*?<\\/UpdateVariable\\s*>`, 'gi');
  const inner = new RegExp(`<(?:Analyze|JSONPatch)\\b[^>]*>[\\s\\S]*?<\\/(?:Analyze|JSONPatch)\\s*>`, 'gi');
  const partialTail = new RegExp(`<(?:${TECHNICAL_TAGS})\\b[^>]*>[\\s\\S]*$`, 'i');
  const leftover = new RegExp(`<\\/?(?:${TECHNICAL_TAGS})\\b[^>]*>`, 'gi');
  return stripPartialMarkerTail(body
    .replace(complete, '')
    .replace(inner, '')
    .replace(partialTail, '')
    .replace(leftover, '')
    .replace(/<StatusPlaceHolderImpl\s*\/?\s*>/gi, '')).trim();
}

function contrast(rgb: number[]) {
  const luminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const channel = (value: number) => {
    const unit = value / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };
  const foreground = luminance(rgb.map(channel));
  const background = luminance([17, 17, 17].map(channel));
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

function brighterSameHue([red, green, blue]: number[]) {
  const [r, g, b] = [red / 255, green / 255, blue / 255];
  const maximum = Math.max(r, g, b), minimum = Math.min(r, g, b), delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  if (delta < 0.02) return '#e6e6e6';
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = maximum === r ? ((g - b) / delta) % 6 : maximum === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = Math.round((hue * 60 + 360) % 360);
  return `hsl(${hue} ${Math.round(saturation * 100)}% 72%)`;
}

function safeReadableColor(host: DisplayHost, value: string) {
  const color = value.trim();
  if (color.length > 64 || /(?:var|url|expression)\s*\(|--|\/|transparent|currentcolor/i.test(color)) return '';
  if (!/^(?:#[\da-f]{3}|#[\da-f]{6}|[a-z]+|(?:rgb|hsl)\([^)]{1,48}\))$/i.test(color)) return '';
  if (!host.CSS?.supports('color', color)) return '';

  const probe = host.document.createElement('span');
  probe.style.cssText = `position:fixed;visibility:hidden;color:${color}`;
  host.document.documentElement.append(probe);
  try {
    const match = host.getComputedStyle(probe).color.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)(?:\D+([\d.]+))?\s*\)$/i);
    if (!match || (match[4] !== undefined && Number(match[4]) < 1)) return '';
    const rgb = match.slice(1, 4).map(Number);
    return contrast(rgb) >= 4.5 ? color : brighterSameHue(rgb);
  } finally {
    probe.remove();
  }
}

function safeLink(host: DisplayHost, value: string) {
  const href = value.trim();
  if (!/^(?:https?:|mailto:)/i.test(href) || /[\u0000-\u001f\u007f]/.test(href)) return '';
  try {
    const parsed = new host.URL(href);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

/** Builds the sole Markdown -> sanitized HTML display path from the host's existing libraries. */
export function createMessageRenderer(host: Window): (text: string) => string {
  const target = host as DisplayHost;
  const libraries = target.SillyTavern?.libs;
  const showdown = libraries?.showdown ?? target.showdown;
  const purifierFactory = libraries?.DOMPurify ?? target.DOMPurify;
  if (typeof showdown?.Converter !== 'function') throw new Error('消息显示初始化失败：宿主未提供 showdown.Converter');
  if (typeof purifierFactory !== 'function') throw new Error('消息显示初始化失败：宿主未提供 DOMPurify 工厂');
  if (!target.document?.documentElement || !target.CSS?.supports || typeof target.getComputedStyle !== 'function') {
    throw new Error('消息显示初始化失败：宿主缺少颜色校验所需的浏览器能力');
  }

  const purifier = purifierFactory(host);
  if (!purifier?.isSupported || typeof purifier.addHook !== 'function' || typeof purifier.sanitize !== 'function') {
    throw new Error('消息显示初始化失败：DOMPurify 独立实例不可用');
  }
  const converter = new showdown.Converter({ simpleLineBreaks: true });
  let lastColor = '', lastSafeColor = '';

  purifier.addHook('uponSanitizeAttribute', (node, data) => {
    const tag = node.tagName.toLowerCase();
    const attribute = data.attrName.toLowerCase();
    if (attribute === 'style') {
      const match = /^\s*color\s*:\s*([^;]+)\s*;?\s*$/i.exec(data.attrValue);
      const candidate = tag === 'span' && match ? match[1]! : '';
      const color = candidate === lastColor ? lastSafeColor : safeReadableColor(target, candidate);
      if (candidate !== lastColor) [lastColor, lastSafeColor] = [candidate, color];
      data.keepAttr = Boolean(color);
      if (color) data.attrValue = `color: ${color}`;
      return;
    }
    if (attribute === 'href') {
      const href = tag === 'a' ? safeLink(target, data.attrValue) : '';
      data.keepAttr = Boolean(href);
      if (href) data.attrValue = href;
      return;
    }
    data.keepAttr = tag === 'a' && attribute === 'title';
  });
  purifier.addHook('afterSanitizeAttributes', node => {
    if (node.tagName?.toLowerCase() === 'a' && node.hasAttribute('href')) {
      // Fixed trusted values: a story link must not navigate away from the host or its message iframe.
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return (text: string) => purifier.sanitize(converter.makeHtml(visibleBody(text)), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'style', 'target', 'rel'],
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });
}
