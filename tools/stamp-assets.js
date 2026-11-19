/* ==========================================================================
   给 HTML 里的 CSS / JS 引用打上内容指纹（?v=<sha1 前 8 位>）。

   为什么需要：
   本地反复改样式或脚本时，浏览器可能继续用缓存里的旧文件，出现「改了没生效」。
   版本号取自文件内容，改一次变一次；没改则不变化，不影响缓存复用。

   用法：node tools/stamp-assets.js
   （可选）node tools/stamp-assets.js --check 只报告是否已是最新，不写文件
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var root = path.resolve(__dirname, '..');
var checkOnly = process.argv.indexOf('--check') !== -1;

var hashCache = {};
function hash8(relPath) {
  if (!hashCache[relPath]) {
    var abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) return null;
    hashCache[relPath] = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  }
  return hashCache[relPath];
}

var ASSET = '(assets\\/(?:css|js)\\/[^"?]+\\.(?:css|js))';
var stripRe = new RegExp('(href|src)="' + ASSET + '\\?v=[a-f0-9]+"', 'g');
var stampRe = new RegExp('(href|src)="' + ASSET + '"', 'g');

var htmlFiles = fs.readdirSync(root).filter(function (f) { return /\.html$/i.test(f); }).sort();
var stale = [];

htmlFiles.forEach(function (name) {
  var file = path.join(root, name);
  var html = fs.readFileSync(file, 'utf8');
  var before = html;

  /* 先去掉旧指纹，避免重复叠加 */
  html = html.replace(stripRe, '$1="$2"');
  /* 再按文件内容打新指纹 */
  html = html.replace(stampRe, function (all, attr, rel) {
    var h = hash8(rel);
    if (!h) return all;
    return attr + '="' + rel + '?v=' + h + '"';
  });

  if (html !== before) {
    stale.push(name);
    if (!checkOnly) fs.writeFileSync(file, html, 'utf8');
  }
});

if (checkOnly) {
  if (stale.length) {
    console.log('⚠ 以下页面资源指纹不是最新：' + stale.join(', '));
    console.log('  运行 node tools/stamp-assets.js 更新');
    process.exitCode = 1;
  } else {
    console.log('✓ 全部页面的 CSS/JS 指纹均为最新');
  }
} else {
  console.log('已更新资源指纹：' + stale.length + ' / ' + htmlFiles.length + ' 个页面');
  /* 打印本次指纹，方便对照 */
  ['assets/css/style.css', 'assets/css/responsive.css', 'assets/js/main.js', 'assets/js/ui.js'].forEach(function (rel) {
    var h = hash8(rel);
    if (h) console.log('  ' + rel + ' → v=' + h);
  });
}