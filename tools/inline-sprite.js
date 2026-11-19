/* ==========================================================================
   把 assets/svg/sprite.svg 内联进每个 HTML 的 <body> 之后，并把
   <use href="assets/svg/sprite.svg#i-x"> 改写为 <use href="#i-x">。

   原因：
   1. 外部文件引用（跨文档 <use>）在 file:// 协议下会被浏览器拦截，图标全部不显示；
   2. 内联后少一次请求，首屏更快；
   3. 图标仍是纯本地 SVG，不依赖任何 CDN 或图标字体。

   用法：node tools/inline-sprite.js
   维护：改完 assets/svg/sprite.svg 后重新执行本脚本即可同步全部页面。
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var START = '<!-- SVG SPRITE:start 由 tools/inline-sprite.js 生成，请勿手改 -->';
var END = '<!-- SVG SPRITE:end -->';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

var sprite = fs.readFileSync(path.join(root, 'assets', 'svg', 'sprite.svg'), 'utf8').trim();
/* 内联时改用 0×0 裁剪而不是 display:none：symbol 仍属于渲染树，
   个别浏览器对隐藏容器里的 symbol 处理不一致，这样更保险。 */
sprite = sprite.replace(
  /^<svg\b([^>]*?)\sstyle="display:none"/,
  '<svg$1 style="position:absolute;width:0;height:0;overflow:hidden"'
);
var block = START + '\n' + sprite + '\n' + END;
var blockRe = new RegExp(escapeRegExp(START) + '[\\s\\S]*?' + escapeRegExp(END), 'g');

var files = fs.readdirSync(root).filter(function (f) {
  return /\.html$/i.test(f);
}).sort();

var changed = 0;
var skipped = [];
var symbolCount = (sprite.match(/<symbol\b/g) || []).length;

files.forEach(function (name) {
  var file = path.join(root, name);
  var html = fs.readFileSync(file, 'utf8');
  var before = html;

  // 1) 移除上一次生成的内联块，保证幂等
  html = html.replace(blockRe, '');

  // 2) 插到 <body ...> 之后
  var bodyTag = html.match(/<body[^>]*>/i);
  if (!bodyTag) {
    skipped.push(name);
    return;
  }
  html = html.replace(bodyTag[0], bodyTag[0] + '\n' + block);

  // 3) 外部 sprite 引用改为同文档引用
  var refs = 0;
  html = html.replace(/href="assets\/svg\/sprite\.svg#([A-Za-z0-9_-]+)"/g, function (_, id) {
    refs++;
    return 'href="#' + id + '"';
  });

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
    console.log('  ✓ ' + name + '（改写 ' + refs + ' 处图标引用）');
  } else {
    console.log('  · ' + name + ' 无变化');
  }
});

console.log('\n内联 sprite：' + files.length + ' 个页面，更新 ' + changed + ' 个，含 ' + symbolCount + ' 个 symbol');
if (skipped.length) console.log('跳过（找不到 <body>）：' + skipped.join(', '));

// 自检：页面里是否还残留外部 sprite 引用
var remaining = [];
files.forEach(function (name) {
  var html = fs.readFileSync(path.join(root, name), 'utf8');
  var n = (html.match(/assets\/svg\/sprite\.svg#/g) || []).length;
  if (n) remaining.push(name + ' 残留 ' + n + ' 处');
});
if (remaining.length) {
  console.log('⚠ 仍有外部引用：' + remaining.join('；'));
  process.exitCode = 1;
} else {
  console.log('✓ 全部页面已改为同文档引用');
}