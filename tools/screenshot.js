/* ==========================================================================
   用本机 Chrome / Edge 的无头模式给 README 生成页面截图。

   为什么要脚本：手工截图容易漏页、尺寸不统一；改版后一条命令就能更新。
   关键参数说明：
   - --force-prefers-reduced-motion：让 .reveal 卡片直接可见。
     无头环境下 IntersectionObserver 常常不投递回调，不加这个参数会截到空白卡片区。
   - --window-size：Chrome 在 Windows 下会把窗口宽度钳制到约 500px，
     所以移动端截图用 500 宽（仍低于 760 断点，走移动布局），不要写 390。
   - --virtual-time-budget：等数据脚本加载、页面渲染完成再截图。

   用法：node tools/screenshot.js [home|growth|tools|prompts|article|mobile ...]
   ========================================================================== */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var url = require('url');
var spawnSync = require('child_process').spawnSync;

var root = path.resolve(__dirname, '..');
var outDir = path.join(root, 'docs', 'screenshots');

var CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
];

var SHOTS = [
  { name: 'home', size: '1440,900', page: 'index.html', label: '首页' },
  { name: 'growth', size: '1440,1300', page: 'growth.html', label: 'AI 获客指南' },
  { name: 'tools', size: '1440,1500', page: 'tools.html', label: 'AI 工具导航' },
  { name: 'prompts', size: '1440,1500', page: 'prompts.html', label: 'AI 提示词库' },
  { name: 'article', size: '1440,1300', page: 'article-detail.html?id=restaurant-moments', label: '文章详情' },
  { name: 'mobile', size: '500,1000', page: 'index.html', label: '移动端首页' }
];

var browser = CANDIDATES.filter(function (p) { return fs.existsSync(p); })[0];
if (!browser) {
  console.error('找不到 Chrome / Edge，请手动指定浏览器路径后运行。');
  process.exit(1);
}

var wanted = process.argv.slice(2);
var list = wanted.length ? SHOTS.filter(function (s) { return wanted.indexOf(s.name) !== -1; }) : SHOTS;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

var profile = path.join(os.tmpdir(), 'abg-shot-profile');
var failed = 0;

list.forEach(function (shot) {
  var out = path.join(outDir, shot.name + '.png');
  var target = url.pathToFileURL(path.join(root, shot.page.split('?')[0])).href;
  if (shot.page.indexOf('?') !== -1) target += '?' + shot.page.split('?')[1];

  var args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-prefers-reduced-motion',
    '--user-data-dir=' + profile,
    '--window-size=' + shot.size,
    '--virtual-time-budget=6000',
    '--screenshot=' + out,
    target
  ];

  var res = spawnSync(browser, args, { stdio: 'ignore', timeout: 90000 });
  if (res.status === 0 && fs.existsSync(out)) {
    console.log('  ✓ ' + shot.label + ' → docs/screenshots/' + shot.name + '.png（' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB）');
  } else {
    failed++;
    console.log('  ✗ ' + shot.label + ' 截图失败');
  }
});

console.log('\n完成：' + (list.length - failed) + ' / ' + list.length + ' 张');
if (failed) process.exitCode = 1;