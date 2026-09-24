import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { devOrigin, hostOrigins } from './delivery.config.mjs';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const distRoot = fileURLToPath(new URL('./dist', import.meta.url));
const address = new URL(devOrigin);

export default defineConfig(({ command, mode }) => ({
  // Serve only packaged assets, not project sources or local reference files.
  root: command === 'serve' ? distRoot : projectRoot,
  publicDir: false,
  plugins: [vue()],
  define: { 'process.env.NODE_ENV': '"production"' },
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
    lib: {
      entry: mode === 'schema' ? 'src/mvu/register.ts' : 'src/state-entry.ts',
      cssFileName: 'state',
      formats: ['iife'], name: 'DLNM', fileName: () => `${mode === 'schema' ? 'schema' : 'state'}.js`,
    },
  },
}));
