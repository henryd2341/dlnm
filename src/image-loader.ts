declare const __DLNM_IMAGE_SOURCE__: 'development' | 'gremlin';
declare const __DLNM_DEV_IMAGES__: Record<string, string>;
export const imageSource = typeof __DLNM_IMAGE_SOURCE__ === 'undefined' ? 'development' : __DLNM_IMAGE_SOURCE__;
const developmentUrls: Record<string, string> = typeof __DLNM_DEV_IMAGES__ === 'undefined' ? {} : __DLNM_DEV_IMAGES__;

type ImageInfo = { character: string; relativePath: string; fileName: string };
type Gremlin = {
  isAvailable(): boolean;
  getCurrentCharacterName(): string | null;
  listImages(character?: string | null): Promise<ImageInfo[]>;
  getImageUrl(character: string, relativePath: string): Promise<string | null>;
};
type MediaHost = Window & { IllustrationGremlin?: Gremlin; SillyTavern?: { getContext(): typeof SillyTavern } };

export function currentImageContext(host: MediaHost, chatKey: string) {
  const context = host.SillyTavern?.getContext();
  if (!context || context.groupId || !chatKey || JSON.stringify([context.characterId, context.getCurrentChatId()]) !== chatKey) {
    throw Error('聊天已切换或尚未就绪，请使用当前聊天入口');
  }
}

export function bounded<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const finish = (error: unknown, value?: T) => {
      clearTimeout(timer); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value as T);
    };
    const abort = () => finish(new Error('图片读取已取消'));
    const timer = setTimeout(() => finish(new Error('图片读取超时，请重新读取')), 10000);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => finish(null, value), error => finish(error));
    if (signal.aborted) abort();
  });
}

export function findImage(images: ImageInfo[], name: string): ImageInfo | undefined {
  const matches = images.filter(image => image.fileName === name);
  if (matches.length > 1) throw Error(`图包有重名图片：${name}；请保留唯一逻辑名`);
  const image = matches[0];
  if (image && (!image.character || typeof image.relativePath !== 'string'
    || /^(?:[\\/]|[a-z]+:)/i.test(image.relativePath) || image.relativePath.split(/[\\/]/).some(part => !part || part === '..' || part === '.')
    || image.relativePath.split(/[\\/]/).at(-1) !== name)) throw Error('图包返回的图片路径异常');
  return image;
}

export async function openImageLookup(host: MediaHost, chatKey: string, signal: AbortSignal) {
  const current = () => { if (signal.aborted) throw Error('图片读取已取消'); currentImageContext(host, chatKey); };
  current();
  if (imageSource === 'development') return async (name: string) => { current(); return developmentUrls[name] ?? null; };
  // Optional extension may load after this iframe. Bounded discovery; never install or reconfigure it.
  for (let attempt = 0; !host.IllustrationGremlin && attempt < 20; attempt++) {
    await bounded(new Promise<void>(resolve => setTimeout(resolve, 250)), signal); current();
  }
  const api = host.IllustrationGremlin;
  if (!api || typeof api.listImages !== 'function' || typeof api.getImageUrl !== 'function'
    || typeof api.getCurrentCharacterName !== 'function' || typeof api.isAvailable !== 'function') {
    throw Error('请自行安装 Illustration-Gremlin，并为当前角色导入图包后重新读取');
  }
  if (!api.isAvailable()) throw Error('Illustration-Gremlin 图片目录尚未就绪，请在扩展中配置后重新读取');
  const character = api.getCurrentCharacterName();
  if (!character) throw Error('图片扩展尚未识别当前角色');
  const images = await bounded(api.listImages(character), signal);
  current();
  if (!Array.isArray(images)) throw Error('图片扩展返回的清单格式异常');
  return async (name: string) => {
    current();
    if (api !== host.IllustrationGremlin || api.getCurrentCharacterName() !== character) throw Error('图片扩展角色已切换');
    const image = findImage(images, name);
    if (!image) return null;
    // Use the exact current-character record; never search other characters or resolve placeholders.
    const url = await bounded(api.getImageUrl(image.character, image.relativePath), signal);
    current();
    if (api.getCurrentCharacterName() !== character) throw Error('图片扩展角色已切换');
    if (url !== null && (typeof url !== 'string' || !url.startsWith('blob:'))) throw Error('图片扩展返回了非 Blob 图片地址');
    // Gremlin owns/caches these URLs. Revoking on component teardown would break sibling views.
    return url;
  };
}

export async function loadImage(url: string, signal: AbortSignal): Promise<void> {
  const image = new Image();
  try {
    await bounded(new Promise<void>((resolve, reject) => {
      image.onload = () => resolve(); image.onerror = () => reject(Error('图片文件加载失败'));
      image.src = url;
    }), signal);
  } finally { image.onload = null; image.onerror = null; image.removeAttribute('src'); }
}
