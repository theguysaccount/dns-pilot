import { build } from 'esbuild';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const result = await build({ entryPoints: ['src/server.mjs'], outfile: 'dist/server.mjs', bundle: true, platform: 'node', target: 'node20', format: 'esm', metafile: true, legalComments: 'linked', banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' } });
const roots = new Set();
for (const file of Object.keys(result.metafile.inputs).filter(f => f.includes('node_modules/'))) {
  // Nearest package.json can be a format marker in dist; walk up until a named package.
  let dir = resolve(dirname(file));
  while (dir !== dirname(dir)) {
    const manifest = dir + '/package.json';
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest)).name) { roots.add(dir); break; }
    dir = dirname(dir);
  }
}
const notices = [];
for (const dir of [...roots].sort()) {
  const p = JSON.parse(readFileSync(dir + '/package.json'));
  const licenses = readdirSync(dir).filter(f => /^(license|licence|copying|notice)(\.|$)/i.test(f));
  if (!licenses.length) throw new Error(`Missing dependency license for ${p.name}`);
  notices.push(`${p.name} ${p.version} (${p.license})\n${licenses.map(f => readFileSync(dir + '/' + f, 'utf8')).join('\n')}`);
}
writeFileSync('dist/third-party-licenses.txt', notices.join('\n\n' + '='.repeat(72) + '\n\n'));
