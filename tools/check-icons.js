/* 校验 JS 里 icon('i-xxx') 用到的 id 都能在 sprite 中找到 */
'use strict';
var fs = require('fs');
var path = require('path');
var root = path.resolve(__dirname, '..');

var sprite = fs.readFileSync(path.join(root, 'assets/svg/sprite.svg'), 'utf8');
var ids = new Set((sprite.match(/id="i-[a-z0-9-]+"/g) || []).map(function (s) { return s.slice(4, -1); }));

var miss = [];
var used = new Set();
var jsDir = path.join(root, 'assets', 'js');
fs.readdirSync(jsDir).forEach(function (f) {
  var text = fs.readFileSync(path.join(jsDir, f), 'utf8');
  var re = /icon\(\s*'([^']+)'/g;
  var m;
  while ((m = re.exec(text))) {
    used.add(m[1]);
    if (!ids.has(m[1])) miss.push(f + ' → ' + m[1]);
  }
});

console.log('sprite symbol：' + ids.size + ' 个；JS 实际用到：' + used.size + ' 个');
console.log(miss.length ? '✗ 缺失：' + miss.join('，') : '✓ JS 中的 icon() 引用全部存在');
if (miss.length) process.exitCode = 1;