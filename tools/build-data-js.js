/* ==========================================================================
   把 assets/data/*.json 同步输出为同名 .js（window.ABG_DATA）。

   为什么需要：
   fetch() 在 file:// 协议下会被浏览器同源策略拦截，用户直接双击 HTML
   打开时列表会显示「内容加载失败」。改成普通 <script src> 加载的 JS 数据
   文件后，file:// 也能正常渲染，HTTP 服务器下同样可用。

   约定：
   - JSON 仍是唯一数据源，所有内容只在 .json 里编辑；
   - .js 是构建产物，改完 JSON 必须重新执行本脚本；
   - tools/check.js 会校验两者是否一致。

   用法：node tools/build-data-js.js
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var dataDir = path.join(root, 'assets', 'data');

var files = fs.readdirSync(dataDir).filter(function (f) { return /\.json$/i.test(f); }).sort();
var total = 0;

var HEADER = '/* 由 tools/build-data-js.js 从 {json} 生成，请勿手改。\n' +
  '   页面优先读取 window.ABG_DATA：file:// 直接打开也能显示，fetch 仅作兜底。 */\n' +
  'window.ABG_DATA = window.ABG_DATA || {};\n';

files.forEach(function (file) {
  var name = file.replace(/\.json$/i, '');
  var json = fs.readFileSync(path.join(dataDir, file), 'utf8');
  var parsed = JSON.parse(json); /* 顺带校验 JSON 合法性 */

  var body = HEADER.replace('{json}', file) +
    'window.ABG_DATA[' + JSON.stringify(name) + '] = ' + JSON.stringify(parsed) + ';\n';

  var out = path.join(dataDir, name + '.js');
  fs.writeFileSync(out, body, 'utf8');
  total += Buffer.byteLength(body, 'utf8');
  console.log('  ✓ ' + file + ' → ' + name + '.js（' + (Buffer.byteLength(body, 'utf8') / 1024).toFixed(1) + ' KB）');
});

console.log('\n数据脚本已生成：' + files.length + ' 个，合计 ' + (total / 1024).toFixed(1) + ' KB');
console.log('提示：改动 assets/data/*.json 后需要重新执行 node tools/build-data-js.js');