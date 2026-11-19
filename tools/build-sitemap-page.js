/* ==========================================================================
   生成人类可读的 sitemap.html（站点地图页面）。

   为什么需要：
   sitemap.xml 是给搜索引擎读的 XML，浏览器打开只会显示源码树，
   访客看到一片标签会以为站点出错。sitemap.html 用站点样式把同样的
   信息排成页面，页脚「站点地图」指向它；XML 仍保留在根目录给爬虫。

   做法：以 about.html 为模板（复用 sprite、页头、页脚、脚本），
   替换 head 的 SEO 信息与 <main> 内容。文章清单从 articles.json 读取，
   新增文章后重跑即可。

   用法：node tools/build-sitemap-page.js
   ========================================================================== */
'use strict';

var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var read = function (p) { return fs.readFileSync(path.join(root, p), 'utf8'); };

/* 主要栏目：href / 名称 / 一句话说明 */
var PAGES = [
  ['index.html', '首页', '九个模块的总览：今天能做什么、能省多少时间、别人是怎么做的'],
  ['growth.html', 'AI 获客指南', '11 篇获客教程：门头照、朋友圈、短视频、小红书，按行业与场景拆步骤'],
  ['efficiency.html', 'AI 降本增效', '15 个提效场景：客服、记账、排班、采购、复盘，一项一项省时间'],
  ['cases.html', '行业实战案例', '10 个行业方案：餐饮、零售、美业、教培、维修、工作室等'],
  ['tools.html', 'AI 工具导航', '38 款工具、11 个分类，标明适用场景、价格与上手门槛'],
  ['prompts.html', 'AI 提示词库', '27 条提示词，按场景与标签筛选，复制即可用'],
  ['websites.html', 'AI 网站资源库', '31 个网站资源：设计、视频、建站、表格与办公'],
  ['books.html', 'AI 书籍推荐', '21 本书、7 个分类，按「读完能做什么」来挑'],
  ['articles.html', '实战文章', '14 篇一线经营文章：获客、降本、工具与经营方法'],
  ['about.html', '关于我们', '站点定位、六条内容原则，以及内容是怎么做出来的']
];

var CAT_ORDER = ['获客实战', '降本增效', '工具实战', '经营方法'];

var articles = JSON.parse(read('assets/data/articles.json')).articles || [];
var groups = {};
var catList = [];
articles.forEach(function (a) {
  if (!groups[a.category]) { groups[a.category] = []; catList.push(a.category); }
  groups[a.category].push(a);
});
catList.sort(function (a, b) {
  var ia = CAT_ORDER.indexOf(a); var ib = CAT_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var cards = PAGES.map(function (p) {
  return '        <div class="value-card">\n' +
    '          <h3><a href="' + p[0] + '">' + esc(p[1]) + '</a></h3>\n' +
    '          <p>' + esc(p[2]) + '</p>\n' +
    '        </div>';
}).join('\n');

var artGroups = catList.map(function (cat) {
  var items = groups[cat].map(function (a) {
    return '            <li><a href="article-detail.html?id=' + encodeURIComponent(a.id) + '">' + esc(a.title) + '</a></li>';
  }).join('\n');
  return '        <div class="value-card">\n' +
    '          <h3>' + esc(cat) + '（' + groups[cat].length + ' 篇）</h3>\n' +
    '          <ul>\n' + items + '\n          </ul>\n' +
    '        </div>';
}).join('\n');

var mainInner = [
  '  <nav class="breadcrumb" aria-label="面包屑">',
  '    <div class="container">',
  '      <ol>',
  '        <li><a href="index.html">首页</a></li>',
  '        <li><span aria-current="page">站点地图</span></li>',
  '      </ol>',
  '    </div>',
  '  </nav>',
  '',
  '  <section class="page-hero">',
  '    <div class="container page-hero__inner">',
  '      <div>',
  '        <p class="eyebrow">站点地图</p>',
  '        <h1>所有页面，一页看全</h1>',
  '        <p class="page-hero__lede">全站 12 个页面、' + articles.length + ' 篇实战文章，按用途分组列出。想快速定位，也可以直接用右上角的搜索。</p>',
  '        <div class="page-hero__meta">',
  '          <span class="badge">12 个页面</span>',
  '          <span class="badge badge--amber">' + articles.length + ' 篇文章</span>',
  '          <span class="badge badge--gray">持续更新</span>',
  '        </div>',
  '      </div>',
  '      <div class="page-hero__art">',
  '        <img src="assets/svg/hero-growth.svg" width="760" height="640" alt="把全站页面整理成一张地图的插画" loading="lazy" decoding="async">',
  '      </div>',
  '    </div>',
  '  </section>',
  '',
  '  <div class="container" style="padding-top:clamp(28px,4vw,44px)">',
  '    <section class="section" style="padding-top:0">',
  '      <div class="section-head">',
  '        <p class="eyebrow">主要栏目</p>',
  '        <h2>八个内容栏目，加一个关于页</h2>',
  '      </div>',
  '      <div class="grid grid-2">',
  cards,
  '      </div>',
  '    </section>',
  '',
  '    <section class="section">',
  '      <div class="section-head">',
  '        <p class="eyebrow">实战文章</p>',
  '        <h2>' + articles.length + ' 篇文章，按主题分组</h2>',
  '      </div>',
  '      <div class="grid grid-2">',
  artGroups,
  '      </div>',
  '    </section>',
  '',
  '    <section class="section">',
  '      <div class="section-head">',
  '        <p class="eyebrow">附录</p>',
  '        <h2>给搜索引擎与脚本读的文件</h2>',
  '      </div>',
  '      <div class="prose">',
  '        <ul>',
  '          <li><a href="sitemap.xml">sitemap.xml</a>：标准 XML 站点地图，提交给搜索引擎用。浏览器打开 XML 会显示源码，这是正常现象，不是页面坏了。</li>',
  '          <li><a href="robots.txt">robots.txt</a>：抓取规则，声明允许抓取的路径与站点地图位置。</li>',
  '        </ul>',
  '      </div>',
  '    </section>',
  '  </div>'
].join('\n');

var src = read('about.html');

src = src.replace(/<title>[\s\S]*?<\/title>/, '<title>站点地图：全站页面与文章一览 · AI经营增长指南</title>');
src = src.replace(/<meta name="description" content="[\s\S]*?">/,
  '<meta name="description" content="AI经营增长指南站点地图，列出 12 个栏目页面与 ' + articles.length + ' 篇实战文章的直达链接，方便快速找到需要的内容。">');
src = src.replace(/<meta name="keywords" content="[\s\S]*?">/,
  '<meta name="keywords" content="站点地图,网站导航,AI经营增长指南">');
src = src.replace(/<link rel="canonical" href="[\s\S]*?">/,
  '<link rel="canonical" href="https://yuxin.run/ai-biz-growth/sitemap.html">');
src = src.replace(/<meta property="og:title" content="[\s\S]*?">/,
  '<meta property="og:title" content="站点地图：全站页面与文章一览">');
src = src.replace(/<meta property="og:description" content="[\s\S]*?">/,
  '<meta property="og:description" content="12 个栏目页面与 ' + articles.length + ' 篇实战文章，一页看全。">');
src = src.replace(/<meta property="og:url" content="[\s\S]*?">/,
  '<meta property="og:url" content="https://yuxin.run/ai-biz-growth/sitemap.html">');
src = src.replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/,
  '$1\n{"@context":"https://schema.org","@type":"WebPage","name":"站点地图","description":"全站页面与文章一览","inLanguage":"zh-CN","url":"https://yuxin.run/ai-biz-growth/sitemap.html"}\n$2');

src = src.replace(/<main id="main">[\s\S]*?<\/main>/, '<main id="main">\n' + mainInner + '\n</main>');

/* 本页不再属于任何一级栏目：去掉模板里 about 链接当前的 aria-current
   （页头的小按钮和侧边抽屉各一处） */
src = src.replace(/href="about\.html" aria-current="page"/g, 'href="about.html"');

/* 页脚「站点地图」指向本页 */
src = src.replace(/href="sitemap\.xml">站点地图</, 'href="sitemap.html">站点地图<');

fs.writeFileSync(path.join(root, 'sitemap.html'), src, 'utf8');

console.log('  ✓ sitemap.html 已生成：' + PAGES.length + ' 个页面链接 / ' + articles.length + ' 篇文章（' + catList.length + ' 个分类）');
console.log('提示：改动 articles.json 或栏目列表后，重新执行 node tools/build-sitemap-page.js');