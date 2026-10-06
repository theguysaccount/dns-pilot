import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='submission/namecheap-dns',files=[];
function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())collect(file);else if(entry.isFile())files.push(path.relative(root,file));else throw new Error('Non-file in submission package');}}
collect(root);
const manifest=JSON.parse(fs.readFileSync(root+'/.codex-plugin/plugin.json'));
if(manifest.interface.shortDescription.length>30)throw new Error('Directory subtitle must be 30 characters or fewer');
const config=JSON.parse(fs.readFileSync(root+'/.mcp.json'));if(Object.keys(config.mcpServers).length!==1)throw new Error('Public package must use one controlled MCP endpoint');
for(const name of files)if(/(^|\/)(\.env|\.private|node_modules)|\.log$/.test(name))throw new Error('Unsafe inclusion');
fs.mkdirSync('artifacts',{recursive:true});
const target=path.resolve(`artifacts/dns-pilot-hosted-${manifest.version}.zip`);execFileSync('/usr/bin/zip',['-q','-FS',target,...files],{cwd:root});
fs.writeFileSync(target+'.sha256',createHash('sha256').update(fs.readFileSync(target)).digest('hex')+'  '+path.basename(target)+'\n');console.log(target);
