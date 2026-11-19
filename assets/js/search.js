/* ==========================================================================
   AI经营增长指南 · search.js
   站内搜索：聚合文章、工具、提示词、教程、行业方案、书籍、网站与静态页面
   索引在第一次打开搜索时加载，避免影响首屏。
   ========================================================================== */
(function () {
  'use strict';

  /* 用转发函数而不是在解析期取值：即使加载顺序变化，也只有真正调用时才取实现，
     避免“esc is not a function”把整个搜索结果吞掉。 */
  var ABG = window.ABG || {};
  var esc = function (s) { return (ABG.escapeHtml || String)(s); };
  var icon = function (id, cls) { return ABG.icon ? ABG.icon(id, cls) : ''; };

  var overlay = document.getElementById('searchOverlay');
  if (!overlay) return;

  var input = document.getElementById('searchInput');
  var box = document.getElementById('searchResults');
  var closeBtn = overlay.querySelector('[data-search-close]');

  var index = null;
  var pending = null;
  var lastFocus = null;
  var activeIndex = -1;

  /* ---------- 把各类数据压平成统一索引 ---------- */
  function pushType(list, type, label) {
    return function (data) {
      var arr = data[list] || [];
      return arr.map(function (item) {
        return {
          type: type,
          label: label,
          title: item.title || item.name,
          desc: item.summary || item.desc || item.oneline || item.use || item.core || '',
          keywords: [item.category, item.author, item.vendor, (item.tags || []).join(' ')].filter(Boolean).join(' '),
          url: route(type, item)
        };
      });
    };
  }

  function route(type, item) {
    switch (type) {
      case 'article': return 'article-detail.html?id=' + encodeURIComponent(item.id);
      case 'tool': return 'tools.html#' + encodeURIComponent(item.id);
      case 'prompt': return 'prompts.html#' + encodeURIComponent(item.id);
      case 'growth': return 'growth.html#tut-' + encodeURIComponent(item.id);
      case 'efficiency': return 'efficiency.html#tut-' + encodeURIComponent(item.id);
      case 'case': return 'cases.html#case-' + encodeURIComponent(item.id);
      case 'book': return 'books.html#' + encodeURIComponent(item.id);
      case 'website': return 'websites.html#' + encodeURIComponent(item.id);
      default: return 'index.html';
    }
  }

  var PAGES = [
    { title: '首页', desc: '让不会 AI 的小老板，也能用 AI 做生意', url: 'index.html', keywords: '首页 入门 开始' },
    { title: 'AI 获客指南', desc: '短视频、小红书、朋友圈、私域、搜索等 11 个获客教程', url: 'growth.html', keywords: '获客 流量 客户' },
    { title: 'AI 降本增效', desc: '文案、海报、客服、表格、复盘等 15 个提效场景', url: 'efficiency.html', keywords: '效率 成本 自动化' },
    { title: '行业实战案例', desc: '餐饮、奶茶、服装、装修等 10 个行业的 AI 经营方案', url: 'cases.html', keywords: '行业 案例 方案' },
    { title: 'AI 提示词库', desc: '可直接复制的经营提示词', url: 'prompts.html', keywords: '提示词 模板 复制' },
    { title: 'AI 工具导航', desc: '38 款工具，按用途分类，标注价格待核实', url: 'tools.html', keywords: '工具 软件 导航' },
    { title: 'AI 网站资源库', desc: '平台后台、政策文件、数据趋势与素材工具', url: 'websites.html', keywords: '网站 资源 平台' },
    { title: 'AI 书籍推荐', desc: '19 本经核实的 AI 与经营类书籍', url: 'books.html', keywords: '书籍 读书 学习' },
    { title: '实战文章', desc: '围绕真实经营问题的方法与案例', url: 'articles.html', keywords: '文章 教程 实战' },
    { title: '关于我们', desc: '这个站点为什么存在，内容原则是什么', url: 'about.html', keywords: '关于 联系 原则' }
  ].map(function (p) {
    return { type: 'page', label: '页面', title: p.title, desc: p.desc, keywords: p.keywords, url: p.url };
  });

  function buildIndex() {
    if (index) return Promise.resolve(index);
    if (pending) return pending;
    var load = ABG.data.load;

    pending = Promise.all([
      load('articles.json').then(pushType('articles', 'article', '文章')),
      load('tools.json').then(pushType('tools', 'tool', '工具')),
      load('prompts.json').then(pushType('prompts', 'prompt', '提示词')),
      load('tutorials-growth.json').then(pushType('tutorials', 'growth', '获客教程')),
      load('tutorials-efficiency.json').then(pushType('tutorials', 'efficiency', '提效教程')),
      load('cases.json').then(pushType('cases', 'case', '行业方案')),
      load('books.json').then(pushType('books', 'book', '书籍')),
      load('websites.json').then(pushType('sites', 'website', '网站'))
    ]).then(function (groups) {
      index = groups.reduce(function (a, b) { return a.concat(b); }, []).concat(PAGES);
      return index;
    })['catch'](function (err) {
      pending = null;
      throw err;
    });

    return pending;
  }

  /* ---------- 标题高亮 ---------- */
  function mark(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    var safeQ = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(safeQ, 'gi'), function (m) { return '<mark>' + m + '</mark>'; });
  }

  /* ---------- 搜索 ---------- */
  function search(q) {
    var kw = q.trim().toLowerCase();
    if (!kw) return [];
    var words = kw.split(/\s+/).filter(Boolean);
    var results = [];

    index.forEach(function (item) {
      var title = (item.title || '').toLowerCase();
      var all = (title + ' ' + (item.desc || '') + ' ' + (item.keywords || '')).toLowerCase();
      var score = 0;
      var matchedAll = true;

      words.forEach(function (w) {
        var hit = all.indexOf(w) !== -1;
        if (!hit) { matchedAll = false; return; }
        score += 1;
        if (title.indexOf(w) === 0) score += 6;
        else if (title.indexOf(w) !== -1) score += 4;
        if (item.type === 'page') score += 1;
      });

      if (matchedAll) results.push({ item: item, score: score });
    });

    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 12).map(function (r) { return r.item; });
  }

  /* ---------- 渲染 ---------- */
  var SUGGESTS = ['短视频', '朋友圈', '小红书', '客服', '复盘', '海报', '餐饮', '提示词'];

  function renderHints() {
    box.innerHTML =
      '<div class="search-group-title">试试这些关键词</div>' +
      '<div class="search-suggest">' + SUGGESTS.map(function (s) {
        return '<button class="chip" type="button" data-suggest="' + esc(s) + '">' + esc(s) + '</button>';
      }).join('') + '</div>' +
      '<div class="search-group-title" style="margin-top:20px">可以去这些地方</div>' +
      PAGES.slice(0, 5).map(function (p) {
        return '<a class="search-item" href="' + p.url + '"><span class="search-item__title">' + esc(p.title) +
          '</span><span class="search-item__desc">' + esc(p.desc) + '</span></a>';
      }).join('');
  }

  function renderResults(q) {
    var list = search(q);
    if (!list.length) {
      box.innerHTML =
        '<div class="search-empty"><strong>没有找到「' + esc(q) + '」相关的内容</strong>' +
        '<p class="small">试试更短的词，比如「短视频」「客服」「餐饮」，或者从下面这些分类进入。</p>' +
        '<div class="search-suggest">' + PAGES.slice(0, 6).map(function (p) {
          return '<a class="chip" href="' + p.url + '">' + esc(p.title) + '</a>';
        }).join('') + '</div></div>';
      return;
    }

    var groups = [];
    list.forEach(function (item) {
      var g = groups.filter(function (x) { return x.label === item.label; })[0];
      if (!g) { g = { label: item.label, items: [] }; groups.push(g); }
      g.items.push(item);
    });

    box.innerHTML = groups.map(function (g) {
      return '<div class="search-group-title">' + esc(g.label) + ' · ' + g.items.length + '</div>' +
        g.items.map(function (item) {
          return '<a class="search-item" href="' + item.url + '">' +
            '<span class="search-item__type">' + esc(item.label) + '</span>' +
            '<span class="search-item__title">' + mark(item.title, q.trim()) + '</span>' +
            '<span class="search-item__desc">' + esc(item.desc).slice(0, 90) + '</span>' +
          '</a>';
        }).join('');
    }).join('');
  }

  /* ---------- 开关 ---------- */
  function open() {
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 40);
    if (!index) {
      box.innerHTML = '<div class="search-empty"><strong>正在准备搜索内容…</strong></div>';
      buildIndex().then(function () {
        if (input.value.trim()) renderResults(input.value); else renderHints();
      })['catch'](function () {
        box.innerHTML = '<div class="search-empty"><strong>搜索数据加载失败</strong><p class="small">' +
          '刷新页面重试；如果仍失败，确认 assets/data/ 下的数据文件完整。</p></div>';
      });
    } else {
      if (input.value.trim()) renderResults(input.value); else renderHints();
    }
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-search-open]');
    if (trigger) { e.preventDefault(); open(); }
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  box.addEventListener('click', function (e) {
    var s = e.target.closest('[data-suggest]');
    if (s) {
      input.value = s.getAttribute('data-suggest');
      var go = function () { renderResults(input.value); };
      if (index) go(); else buildIndex().then(go)['catch'](function () {});
    }
  });

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var q = input.value.trim();
      if (!q) { renderHints(); return; }
      if (!index) {
        buildIndex().then(function () { renderResults(q); })['catch'](function () {});
        return;
      }
      renderResults(q);
    }, 140);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) { close(); return; }

    var isTyping = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (!overlay.classList.contains('is-open')) {
      if ((e.key === '/' && !isTyping) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        open();
      }
      return;
    }

    if (e.key === 'Enter') {
      var first = box.querySelector('.search-item');
      if (first) location.href = first.getAttribute('href');
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = Array.prototype.slice.call(box.querySelectorAll('.search-item'));
      if (!items.length) return;
      e.preventDefault();
      activeIndex = e.key === 'ArrowDown'
        ? Math.min(activeIndex + 1, items.length - 1)
        : Math.max(activeIndex - 1, 0);
      items.forEach(function (el, i) { el.style.background = i === activeIndex ? 'var(--bg)' : ''; });
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  });

  ABG.openSearch = open;
  window.ABG = ABG;
})();