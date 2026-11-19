/* 一次性静态检查：链接、图片、锚点、重复 id、SEO 基础项、SVG 图标、JS 语法 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html')).sort();
const data = {};
['articles', 'tutorials-growth', 'tutorials-efficiency', 'cases', 'prompts', 'tools', 'websites', 'books'].forEach((n) => {
  data[n] = JSON.parse(read('assets/data/' + n + '.json'));
});

/* 动态生成的 id */
const dynIds = {
  'growth.html': (data['tutorials-growth'].tutorials || []).map((t) => 'tut-' + t.id),
  'efficiency.html': (data['tutorials-efficiency'].tutorials || []).map((t) => 'tut-' + t.id),
  'cases.html': (data.cases.cases || []).map((c) => 'case-' + c.id),
  'tools.html': (data.tools.tools || []).map((t) => t.id),
  'prompts.html': (data.prompts.prompts || []).map((p) => p.id),
  'books.html': (data.books.books || []).map((b) => b.id),
  'websites.html': (data.websites.sites || []).map((s) => s.id)
};
/* 动态生成的其他元素 id */
const dynExtra = { 'growth.html': ['promptTotal'], 'prompts.html': ['promptModal', 'promptModalBody'] };

const errors = [];
const warns = [];

/* sprite 图标 */
const sprite = read('assets/svg/sprite.svg');
const spriteIds = new Set((sprite.match(/id="(i-[a-z0-9-]+)"/g) || []).map((s) => s.slice(4, -1)));

/* 收集页面内 id */
function staticIds(html) {
  const ids = [];
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.push(m[1]);
  return ids;
}

const idMap = {};
pages.forEach((p) => {
  const html = read(p);
  const all = staticIds(html);
  idMap[p] = new Set(all.concat(dynIds[p] || [], dynExtra[p] || []));
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) errors.push(`[重复 id] ${p}: ${[...new Set(dup)].join(', ')}`);
});

pages.forEach((p) => {
  const html = read(p);

  /* 基础 SEO */
  if (!/<title>[^<]{6,}<\/title>/.test(html)) errors.push(`[title] ${p} 缺少或过短`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) errors.push(`[description] ${p} 缺少或过短`);
  if (!/<html lang="zh-CN">/.test(html)) errors.push(`[lang] ${p} 缺少 lang`);
  if (!/<meta charset="UTF-8">/.test(html)) errors.push(`[charset] ${p} 缺少 charset`);
  if (!/name="viewport"/.test(html)) errors.push(`[viewport] ${p} 缺少 viewport`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`[h1] ${p} 有 ${h1} 个 h1`);
  if (p !== '404.html' && !/rel="canonical"/.test(html)) warns.push(`[canonical] ${p} 缺少 canonical`);

  /* 本地链接 / 资源 */
  const attrRe = /(href|src)="([^"]+)"/g;
  let m;
  while ((m = attrRe.exec(html))) {
    const val = m[2];
    if (!val || /^(https?:|mailto:|tel:|data:|javascript:)/.test(val)) continue;
    if (val === '#') { warns.push(`[空链接] ${p}: href="#"`); continue; }
    if (val.charAt(0) === '#') {
      const id = decodeURIComponent(val.slice(1));
      if (id && !idMap[p].has(id)) errors.push(`[锚点] ${p}: ${val} 找不到目标`);
      continue;
    }
    const [filePart, hashPart] = val.split('#');
    const [fileName, queryPart] = filePart.split('?');
    if (!fileName) continue;
    if (!exists(decodeURIComponent(fileName))) {
      errors.push(`[文件] ${p}: ${val} 不存在`);
      continue;
    }
    if (hashPart) {
      const target = decodeURIComponent(fileName);
      if (target.endsWith('.html')) {
        const tIds = idMap[target] || new Set(staticIds(read(target)));
        if (!tIds.has(decodeURIComponent(hashPart))) errors.push(`[跨页锚点] ${p}: ${val} 目标页无此 id`);
      }
    }
    if (queryPart && fileName === 'article-detail.html') {
      const id = new URLSearchParams(queryPart).get('id');
      if (id && !(data.articles.articles || []).some((a) => a.id === id)) {
        errors.push(`[文章] ${p}: ${val} 的 id 不存在`);
      }
    }
  }

  /* SVG 图标引用 */
  const useRe = /sprite\.svg#(i-[a-z0-9-]+)/g;
  while ((m = useRe.exec(html))) {
    if (!spriteIds.has(m[1])) errors.push(`[图标] ${p}: sprite 缺少 ${m[1]}`);
  }

  /* 脚本 / 样式 */
  if (!/assets\/css\/style\.css/.test(html)) errors.push(`[css] ${p} 未引入 style.css`);
  if (!/assets\/js\/main\.js/.test(html)) errors.push(`[js] ${p} 未引入 main.js`);

  /* 占位内容 */
  if (/lorem ipsum|TODO|待填写|占位符/i.test(html)) warns.push(`[占位] ${p} 存在疑似占位文本`);
});

/* JS 内引用的图标 */
fs.readdirSync(path.join(root, 'assets/js')).filter((f) => f.endsWith('.js')).forEach((f) => {
  const src = read('assets/js/' + f);
  const re = /icon\('(i-[a-z0-9-]+)'/g;
  let m;
  while ((m = re.exec(src))) {
    if (!spriteIds.has(m[1])) errors.push(`[图标] ${f}: sprite 缺少 ${m[1]}`);
  }
});

/* 数据脚本与 JSON 是否同步（file:// 直接打开时读的是 .js，过期会显示旧内容） */
Object.keys(data).forEach((name) => {
  const jsPath = 'assets/data/' + name + '.js';
  if (!exists(jsPath)) {
    errors.push(`[数据脚本] 缺少 ${jsPath}，请运行 node tools/build-data-js.js`);
    return;
  }
  const expect = 'window.ABG_DATA[' + JSON.stringify(name) + '] = ' + JSON.stringify(data[name]) + ';';
  if (read(jsPath).indexOf(expect) === -1) {
    errors.push(`[数据脚本] ${name}.js 与 ${name}.json 不一致，请运行 node tools/build-data-js.js`);
  }
});

/* 站点地图：sitemap.xml / sitemap.html / sitemap.xsl 的覆盖范围 */
if (!exists('sitemap.xsl')) errors.push('[站点地图] 缺少 sitemap.xsl');
const xml = exists('sitemap.xml') ? read('sitemap.xml') : '';
if (!xml) errors.push('[站点地图] 缺少 sitemap.xml');
else if (xml.indexOf('href="sitemap.xsl"') === -1) errors.push('[站点地图] sitemap.xml 未引用 sitemap.xsl');
const locs = (xml.match(/<loc>https:\/\/aibizgrowth\.cn\/([^<]+)<\/loc>/g) || [])
  .map((s) => s.replace(/^<loc>https:\/\/aibizgrowth\.cn\//, '').replace(/<\/loc>$/, ''));
/* 404 与 sitemap 自身不应出现在站点地图里；article-detail 是单模板，
   真实地址带 ?id= 参数，由下面的文章循环单独校验 */
const mustHave = pages.filter((p) => p !== '404.html' && p !== 'sitemap.html' && p !== 'article-detail.html');
mustHave.forEach((p) => { if (!locs.includes(p)) errors.push(`[站点地图] sitemap.xml 缺少 ${p}`); });
data.articles.articles.forEach((a) => {
  if (!locs.includes('article-detail.html?id=' + a.id)) errors.push(`[站点地图] sitemap.xml 缺少文章 ${a.id}`);
});
if (!exists('sitemap.html')) {
  errors.push('[站点地图] 缺少 sitemap.html，请运行 node tools/build-sitemap-page.js');
} else {
  const sm = read('sitemap.html');
  mustHave.forEach((p) => { if (sm.indexOf('href="' + p + '"') === -1) errors.push(`[站点地图] sitemap.html 未链接 ${p}`); });
  data.articles.articles.forEach((a) => {
    if (sm.indexOf('article-detail.html?id=' + a.id) === -1) errors.push(`[站点地图] sitemap.html 未链接文章 ${a.id}`);
  });
}

/* 404 页不提供常规入口：只有服务器返回 404 时才自动展示 */
pages.forEach((p) => {
  if (read(p).indexOf('href="404.html"') !== -1) errors.push(`[404] ${p}: 仍有指向 404.html 的链接`);
});

/* 数据完整性 */
const count = {
  文章: data.articles.articles.length,
  获客教程: data['tutorials-growth'].tutorials.length,
  提效场景: data['tutorials-efficiency'].tutorials.length,
  行业方案: data.cases.cases.length,
  提示词: data.prompts.prompts.length,
  工具: data.tools.tools.length,
  网站: data.websites.sites.length,
  书籍: data.books.books.length
};

/* 唯一 id 与必填字段 */
const required = {
  articles: ['id', 'title', 'summary', 'category', 'tags', 'date', 'author', 'content'],
  'tutorials-growth': ['id', 'title', 'desc', 'tags', 'steps', 'prompt', 'checklist'],
  'tutorials-efficiency': ['id', 'title', 'desc', 'tags', 'steps', 'prompt', 'checklist'],
  cases: ['id', 'name', 'painPoints', 'scenes', 'tools', 'flow', 'prompt', 'plan'],
  prompts: ['id', 'title', 'category', 'scene', 'prompt', 'method', 'input', 'output', 'tips'],
  tools: ['id', 'name', 'vendor', 'category', 'desc', 'audience', 'use', 'price', 'url', 'difficulty', 'scene'],
  websites: ['id', 'name', 'category', 'use', 'scene', 'url', 'tip'],
  books: ['id', 'title', 'author', 'category', 'core', 'fit', 'learn', 'relate']
};
const keyOf = { articles: 'articles', 'tutorials-growth': 'tutorials', 'tutorials-efficiency': 'tutorials', cases: 'cases', prompts: 'prompts', tools: 'tools', websites: 'sites', books: 'books' };
Object.keys(required).forEach((name) => {
  const arr = data[name][keyOf[name]] || [];
  const ids = arr.map((x) => x.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) errors.push(`[数据] ${name} 重复 id: ${[...new Set(dup)].join(',')}`);
  arr.forEach((x, i) => {
    required[name].forEach((k) => {
      const v = x[k];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
        errors.push(`[数据] ${name}[${i}](${x.id || '?'}) 缺少 ${k}`);
      }
    });
  });
});

/* 工具 / 网站官网链接格式 */
data.tools.tools.forEach((t) => { if (!/^https:\/\//.test(t.url)) errors.push(`[URL] 工具 ${t.id}: ${t.url}`); });
data.websites.sites.forEach((s) => { if (!/^https:\/\//.test(s.url)) errors.push(`[URL] 网站 ${s.id}: ${s.url}`); });
data.books.books.forEach((b) => {
  if (!data.books.meta.categories.includes(b.category)) errors.push(`[分类] 书籍 ${b.id} 分类不在 meta 中: ${b.category}`);
});
data.tools.tools.forEach((t) => {
  if (!data.tools.meta.categories.includes(t.category)) errors.push(`[分类] 工具 ${t.id} 分类不在 meta 中: ${t.category}`);
});

console.log('页面：' + pages.join(', '));
console.log('内容量：' + Object.keys(count).map((k) => k + ' ' + count[k]).join(' / '));
console.log('SVG 图标数：' + spriteIds.size);
if (warns.length) { console.log('\n— 提醒 (' + warns.length + ') —'); warns.forEach((w) => console.log('  ' + w)); }
if (errors.length) { console.log('\n— 错误 (' + errors.length + ') —'); errors.forEach((e) => console.log('  ' + e)); process.exitCode = 1; }
else console.log('\n✓ 静态检查通过：无死链、无缺失资源、无重复 id、字段完整。');