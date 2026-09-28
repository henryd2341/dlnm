import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { devOrigin, hostOrigins, assetBaseUrl, imageSource } from './delivery.config.mjs';
import { developmentImages } from './src/images.ts';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist', import.meta.url));
const address = new URL(devOrigin);
const source = process.env.DLNM_IMAGE_SOURCE || imageSource;
if (!['development', 'gremlin'].includes(source)) throw Error('Unknown DLNM_IMAGE_SOURCE');
const images = source === 'development' ? developmentImages.map(image => {
  const bytes = readFileSync(new URL(`./public/${image.source}`, import.meta.url));
  return { ...image, bytes, path: `n4-images/${image.name}` };
}) : [];

export default defineConfig(({ command, mode }) => ({
  // Serve only packaged assets, not project sources or local reference files.
  root: command === 'serve' ? distRoot : projectRoot,
  base: command === 'serve' ? '/' : new URL(assetBaseUrl).pathname,
  publicDir: false,
  plugins: [vue(), {
    name: 'dlnm-selected-images',
    generateBundle() {
      if (mode === 'schema') return;
      for (const image of images) this.emitFile({ type: 'asset', fileName: image.path, source: image.bytes });
      this.emitFile({ type: 'asset', fileName: 'image-manifest.json', source: JSON.stringify({
        source, images: developmentImages.map(image => {
          const asset = images.find(item => item.name === image.name);
          return { ...image, ...(asset ? { path: asset.path, bytes: asset.bytes.length } : {}) };
        }),
      }, null, 2) + '\n' });
    },
  }],
  define: {
    'process.env.NODE_ENV': '"production"',
    __DLNM_IMAGE_SOURCE__: JSON.stringify(source),
    __DLNM_DEV_IMAGES__: JSON.stringify(Object.fromEntries(images.map(image => [image.name, new URL(image.path, assetBaseUrl).href]))),
  },
  server: {
    host: address.hostname,
    port: Number(address.port || 80),
    strictPort: true,
    cors: { origin: hostOrigins },
    fs: { strict: true, allow: [distRoot] },
  },
  build: {
    outDir: distRoot,
    emptyOutDir: false,
    rolldownOptions: { output: { assetFileNames: '[name][extname]', chunkFileNames: '[name].js' } },
    lib: {
      entry: mode === 'schema' ? 'src/mvu/register.ts' : 'src/state-entry.ts',
      cssFileName: 'state',
      formats: ['iife'], name: 'DLNM', fileName: () => `${mode === 'schema' ? 'schema' : 'state'}.js`,
    },
  },
}));
