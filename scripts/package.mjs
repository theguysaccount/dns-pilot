import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
const roots = ['.codex-plugin', '.mcp.json', 'skills', 'bin', 'dist', 'assets', 'docs', 'src', 'test', 'scripts', 'hosted', 'submission', 'public', 'tsconfig.hosted.json', 'wrangler.example.jsonc', 'README.md', 'LICENSE', 'package.json', 'package-lock.json'];
const files = [];
function collect(path) { for (const e of readdirSync(path, { withFileTypes: true })) { const f = `${path}/${e.name}`; if (e.isDirectory()) collect(f); else if (e.isFile()) files.push(f); else throw new Error('Unexpected non-file in release.'); } }
for (const root of roots) { const stat = lstatSync(root); if (stat.isDirectory()) collect(root); else if (stat.isFile()) files.push(root); else throw new Error('Unexpected release root.'); }
if (files.some(f => /(^|\/)(\.env|node_modules|artifacts)(\/|$)/.test(f))) throw new Error('Unsafe release file.');
mkdirSync('artifacts', { recursive: true });
const archive = `artifacts/namecheap-dns-${JSON.parse(readFileSync('package.json')).version}.zip`;
// -FS removes stale entries if rebuilding an existing archive.
execFileSync('/usr/bin/zip', ['-q', '-FS', archive, ...files]);
writeFileSync(`${archive}.sha256`, createHash('sha256').update(readFileSync(archive)).digest('hex') + '  ' + archive.split('/').pop() + '\n');
writeFileSync('artifacts/release-files.json', JSON.stringify(files.sort(), null, 2) + '\n');
console.log(archive);
