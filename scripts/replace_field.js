/* 通用：按 window.NEW_DATA 的 key，正则替换 variant-detail.js 指定字段
 * 用法：node scripts/replace_field.js scripts/_acc.js accidents
 */
const fs = require('fs');
const path = require('path');
const partFile = process.argv[2];
const field = process.argv[3] || 'events';
if (!partFile) { console.error('usage: node scripts/replace_field.js <part.js> [field]'); process.exit(1); }
global.window = {};
require(path.resolve(process.cwd(), partFile));
const NEW = global.window[field === 'accidents' ? 'NEW_ACCIDENTS' : 'NEW_EVENTS'];
if (!NEW) { console.error('part file did not set window.NEW_EVENTS / NEW_ACCIDENTS'); process.exit(1); }
let S = fs.readFileSync('js/variant-detail.js', 'utf8');
let count = 0, miss = [];
for (const key of Object.keys(NEW)) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('("' + esc + '":\\s*\\{[\\s\\S]*?)' + field + ':\\s*\\[[^\\]]*\\]');
  if (!re.test(S)) { miss.push(key); continue; }
  S = S.replace(re, '$1' + field + ': ' + JSON.stringify(NEW[key]));
  count++;
}
fs.writeFileSync('js/variant-detail.js', S);
console.log('replaced field=' + field + ':', count, '| missing:', JSON.stringify(miss));
