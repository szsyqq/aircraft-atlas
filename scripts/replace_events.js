/* 通用：按 window.NEW_EVENTS 的 key，正则替换 variant-detail.js 每款的 events 字段
 * 用法：node scripts/replace_events.js scripts/_ne_xxx.js
 */
const fs = require('fs');
const path = require('path');
const partFile = process.argv[2];
if (!partFile) { console.error('usage: node scripts/replace_events.js <part.js>'); process.exit(1); }
global.window = {};
require(path.resolve(process.cwd(), partFile));
const NEW = global.window.NEW_EVENTS;
if (!NEW) { console.error('part file did not set window.NEW_EVENTS'); process.exit(1); }
let S = fs.readFileSync('js/variant-detail.js', 'utf8');
let count = 0, miss = [];
for (const key of Object.keys(NEW)) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('("' + esc + '":\\s*\\{[\\s\\S]*?)events:\\s*\\[[^\\]]*\\]');
  if (!re.test(S)) { miss.push(key); continue; }
  S = S.replace(re, '$1events: ' + JSON.stringify(NEW[key]));
  count++;
}
fs.writeFileSync('js/variant-detail.js', S);
console.log('replaced:', count, '| missing:', JSON.stringify(miss));
