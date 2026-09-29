import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetBaseUrl } from '../delivery.config.mjs';
import { createCard } from '../src/card.ts';
import { createLiveLoader } from './live-loader.mjs';
import { developmentImages } from '../src/images.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const base = 'https://henryd2341.github.io/dlnm/';
assert.equal(assetBaseUrl, base, 'release must use the public Pages address');

function files(directory: string, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    assert.equal(entry.isSymbolicLink(), false, `release contains a symlink: ${entry.name}`);
    const name = prefix + entry.name;
    return entry.isDirectory() ? files(resolve(directory, entry.name), name + '/') : [name];
  });
}
const expected = ['README.md', 'dlnm.json', 'image-manifest.json', 'index.html', 'live/state.html', 'schema.js', 'state.css', 'state.js'];
assert.deepEqual(files(resolve(root, 'artifacts/release')).sort(), expected.sort(), 'publish only the current release allowlist');
for (const name of expected) {
  const content = read(`artifacts/release/${name}`);
  assert.ok(content.trim(), `${name} is empty`);
  assert.ok(!content.includes('\uFFFD'), `${name} contains invalid UTF-8 replacement text`);
}
for (const name of ['image-manifest.json', 'live/state.html', 'schema.js', 'state.css', 'state.js']) {
  assert.equal(read(`artifacts/release/${name}`), read(`dist/${name}`), `${name} is stale`);
}
assert.equal(read('artifacts/release/README.md'), read('README.md'));
for (const path of ['artifacts/dlnm-gremlin.json', 'artifacts/dlnm-sync.json']) {
  assert.equal(read(path), read('artifacts/release/dlnm.json'));
}
const manifest = JSON.parse(read('artifacts/release/image-manifest.json'));
assert.equal(manifest.source, 'gremlin');
assert.deepEqual(manifest.images, developmentImages, 'Gremlin manifest lists names, not copied development assets');
assert.equal(new Set(manifest.images.map((image: { name: string }) => image.name)).size, 55);

const schema = read('dist/schema.js');
const state = read('dist/state.js');
new Function(schema);
new Function(state);
const card = JSON.parse(read('artifacts/release/dlnm.json'));
const scripts = card.data.extensions.tavern_helper.scripts;
assert.equal(scripts.length, 3);
assert.equal(scripts[0].content, schema, 'embed the schema that was built for this card');
assert.match(scripts[1].content, /MagVarUpdate@183d8ade3b9a3369e824a55cb13b4ddf91aada50\/artifact\/bundle\.js/);
assert.ok(scripts[1].content.includes(JSON.stringify(card.data.name)));
new Function(scripts[1].content);
assert.equal(scripts[2].id, 'dlnm-latest-message-only');
assert.equal(scripts[2].enabled, true);
new Function(scripts[2].content);
assert.deepEqual(card, createCard({
  schemaScript: schema,
  loaderScript: scripts[1].content,
  stateHtml: createLiveLoader(new URL('live/state.html', base).href),
}), 'packed card, worldbook, initial values, scripts and regexes must match maintained source');
const replacement = card.data.extensions.regex_scripts.find((item: { id: string }) => item.id === 'dlnm-state-display').replaceString;
const encoded = /atob\("([A-Za-z0-9+/=]+)"\)/.exec(replacement)![1];
const loader = Buffer.from(encoded, 'base64').toString('utf8');
assert.equal(loader, createLiveLoader(new URL('live/state.html', base).href));
assert.ok(!loader.includes('127.0.0.1') && !loader.includes('localhost'));
const html = read('artifacts/release/live/state.html');
assert.ok(html.includes(`src="${base}state.js"`));
assert.ok(html.includes(`id="dlnm-nvl-style">${read('dist/state.css').replace(/<\/style/gi, '<\\/style')}`));
assert.ok(!state.includes('n4-images/') && !state.includes('127.0.0.1:5173'));
assert.ok(state.includes('IllustrationGremlin'));
assert.match(read('artifacts/release/index.html'), /href="\.\/dlnm\.json"/);
console.log('Release checks passed: 8 allowlisted files, fixed Pages URLs, Gremlin-only assets, embedded schema, source/card/worldbook parity.');
