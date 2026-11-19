/* ==========================================================================
   AI经营增长指南 · ui.js
   数据加载 + 卡片渲染 + 通用筛选。页面脚本复用这里的函数，保证视觉一致。
   ========================================================================== */
(function () {
  'use strict';

  window.ABG = window.ABG || {};
  var ABG = window.ABG;

  var esc = function (s) { return ABG.escapeHtml(s); };
  var icon = function (id, cls) { return ABG.icon(id, cls); };

  /* ---------- 数据加载（数据脚本优先，fetch 兜底） ----------
     每个 assets/data/*.json 都有同名 .js（window.ABG_DATA），
     这样 file:// 直接双击打开也能渲染，不依赖 HTTP 服务器。 */
  var cache = {};
  var scripts = {};

  function loadScript(src) {
    if (!scripts[src]) {
      scripts[src] = new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = function () { resolve(); };
        el.onerror = function () { delete scripts[src]; reject(new Error('数据脚本加载失败：' + src)); };
        document.head.appendChild(el);
      });
    }
    return scripts[src];
  }

  /* 数据到手后页面脚本会在同一轮里渲染卡片，下一轮事件循环再把新出现的
     .reveal 交给 IntersectionObserver；否则卡片会一直停在 opacity:0，
     看起来就像「数据没加载出来」。
     另外对视口内的卡片直接标记显示：不依赖 IO 回调时序，任何环境下
     首屏可见的卡片都不会空白（transition 仍在，依旧有淡入效果）。 */
  function revealSoon() {
    setTimeout(function () {
      if (window.ABG && window.ABG.reveal) window.ABG.reveal();
      var nodes = document.querySelectorAll('.reveal:not(.is-in)');
      for (var i = 0; i < nodes.length; i++) {
        var r = nodes[i].getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) nodes[i].classList.add('is-in');
      }
    }, 0);
  }

  function load(name) {
    if (cache[name]) return cache[name];
    var key = name.replace(/\.json$/, '');

    var promise;
    if (window.ABG_DATA && window.ABG_DATA[key]) {
      promise = Promise.resolve(window.ABG_DATA[key]);
    } else {
      promise = loadScript('assets/data/' + key + '.js').then(function () {
        if (window.ABG_DATA && window.ABG_DATA[key]) return window.ABG_DATA[key];
        throw new Error('数据脚本未注册：' + key + '.js');
      })['catch'](function (err) {
        /* 数据脚本缺失（例如只改了 JSON 忘了重建）时退回 fetch；
           file:// 下 fetch 必然失败，直接把原始错误抛出去。 */
        if (location.protocol === 'file:') throw err;
        return fetch('assets/data/' + name, { cache: 'no-cache' }).then(function (res) {
          if (!res.ok) throw new Error('数据加载失败：' + name);
          return res.json();
        });
      });
    }

    /* 失败后清掉缓存，刷新或重试时还能再试一次 */
    cache[name] = promise.then(function (data) {
      revealSoon();
      return data;
    })['catch'](function (err) {
      delete cache[name];
      throw err;
    });
    return cache[name];
  }

  function fail(box, msg) {
    if (!box) return;
    box.innerHTML = '<div class="empty-state">' + icon('i-warning') +
      '<strong>内容加载失败</strong><p class="small">' + esc(msg || '数据没能加载出来。请刷新页面重试；如果仍失败，检查 assets/data/ 下的文件是否完整。') + '</p></div>';
  }

  /* ---------- 渲染助手 ---------- */
  function tagList(tags, cls) {
    if (!tags || !tags.length) return '';
    return '<div class="' + (cls || 'flex') + '">' + tags.map(function (t) {
      return '<span class="badge badge--gray">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }

  function factRow(items) {
    return '<div class="fact-row">' + items.map(function (it) {
      return '<div class="fact"><div class="small muted">' + esc(it.k) + '</div><strong>' + esc(it.v) + '</strong></div>';
    }).join('') + '</div>';
  }

  /* ---------- 文章卡片 ---------- */
  function articleCard(a) {
    var searchKey = (a.title + ' ' + a.summary + ' ' + (a.tags || []).join(' ')).toLowerCase();
    return '<article class="article-card reveal" data-id="' + esc(a.id) + '" data-cat="' + esc(a.category) +
      '" data-tags="' + esc((a.tags || []).join(',')) + '" data-key="' + esc(searchKey) + '">' +
      '<div class="article-card__cover">' +
        '<span class="badge article-card__badge">' + esc(a.category) + '</span>' +
        '<svg aria-hidden="true" focusable="false"><use href="#' + (a.coverIcon || 'i-book') + '"></use></svg>' +
      '</div>' +
      '<div class="article-card__body">' +
        '<h3><a href="article-detail.html?id=' + encodeURIComponent(a.id) + '">' + esc(a.title) + '</a></h3>' +
        '<p class="article-card__desc">' + esc(a.summary) + '</p>' +
        '<div class="article-card__foot">' +
          '<span>' + esc(a.date) + ' · ' + esc(a.readingTime) + ' 分钟</span>' +
          '<button class="save-btn" type="button" data-fav="' + esc(a.id) + '" aria-pressed="false" aria-label="收藏文章" title="收藏">' + icon('i-bookmark') + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- 教程卡片（跳转到教程锚点） ---------- */
  function tutCard(t, track) {
    var page = track === 'efficiency' || t.track === 'efficiency' ? 'efficiency.html' : 'growth.html';
    return '<a class="tut-card reveal" href="' + page + '#tut-' + esc(t.id) + '">' +
      '<div class="tut-card__top">' +
        '<div class="icon-tile">' + icon(t.icon || 'i-sparkles') + '</div>' +
        '<span class="badge ' + (t.level === '低' ? 'badge--teal' : '') + '">难度 ' + esc(t.level) + '</span>' +
      '</div>' +
      '<h3>' + esc(t.title) + '</h3>' +
      '<p class="tut-card__desc">' + esc(t.desc) + '</p>' +
      '<div class="tut-card__tags">' + (t.tags || []).map(function (x) {
        return '<span class="badge badge--gray">' + esc(x) + '</span>';
      }).join('') + '</div>' +
      '<div class="tut-card__meta"><span>约 ' + esc(t.time) + '</span><span>成本 ' + esc(t.cost) + '</span></div>' +
    '</a>';
  }

  /* ---------- 教程详情（折叠面板，十个要素全展开） ---------- */
  function tutItem(t, index) {
    var list = function (arr) {
      return '<ul>' + (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    };
    var steps = '<ol class="steps">' + (t.steps || []).map(function (s) {
      return '<li><strong>' + esc(s.t) + '</strong><p>' + esc(s.d) + '</p></li>';
    }).join('') + '</ol>';

    var searchKey = (t.title + ' ' + t.subtitle + ' ' + t.desc + ' ' + (t.tags || []).join(' ')).toLowerCase();
    return '<details class="tut-item" id="tut-' + esc(t.id) + '" data-tags="' + esc((t.tags || []).join(',')) + '" data-key="' + esc(searchKey) + '">' +
      '<summary>' +
        '<span class="tut-item__index">' + (index < 9 ? '0' : '') + (index + 1) + '</span>' +
        '<div>' +
          '<h3>' + esc(t.title) + '</h3>' +
          '<p>' + esc(t.subtitle) + ' · 约 ' + esc(t.time) + ' · 难度 ' + esc(t.level) + '</p>' +
        '</div>' +
      '</summary>' +
      '<div class="tut-body">' +
        '<h4>适合哪些商家</h4><p>' + esc(t.audience) + '</p>' +
        '<h4>解决什么经营问题</h4><p>' + esc(t.problem) + '</p>' +
        '<h4>开始前准备什么</h4>' + list(t.prepare) +
        '<h4>推荐使用哪些 AI 工具</h4>' + list(t.tools) +
        '<h4>详细操作步骤</h4>' + steps +
        '<h4>可直接复制的提示词</h4>' +
          '<div class="prompt-block">' +
            '<div class="prompt-block__bar"><strong>' + esc(t.title) + ' 提示词</strong>' +
            '<button class="copy-btn" type="button" data-copy="' + esc(t.prompt) + '">' + icon('i-copy') + '<span>复制</span></button></div>' +
            '<pre>' + esc(t.prompt) + '</pre>' +
          '</div>' +
        '<h4>实际案例</h4><p>' + esc(t.case) + '</p>' +
        '<h4>常见错误与避坑</h4>' + list(t.mistakes) +
        '<h4>如何衡量效果</h4>' + list(t.metrics) +
        '<h4>行动清单</h4><ul class="checklist">' + (t.checklist || []).map(function (x) {
          return '<li>' + esc(x) + '</li>';
        }).join('') + '</ul>' +
        factRow([
          { k: '预算参考', v: t.cost },
          { k: '时间投入', v: t.time },
          { k: '上手难度', v: t.level }
        ]) +
      '</div>' +
    '</details>';
  }

  /* ---------- 行业方案卡片 ---------- */
  function industryCard(c) {
    return '<a class="industry-card reveal" href="cases.html#case-' + esc(c.id) + '">' +
      '<div class="industry-card__head">' +
        '<div class="industry-card__icon">' + icon(c.icon || 'i-store') + '</div>' +
        '<div><h3>' + esc(c.name) + '</h3><p class="small muted mb-0">' + esc(c.oneline) + '</p></div>' +
      '</div>' +
      '<div class="industry-card__body">' +
        '<p>' + esc(c.painPoints[0]) + '</p>' +
        '<div class="industry-card__tags">' +
          (c.scenes || []).slice(0, 2).map(function (s) {
            return '<span class="badge badge--gray">' + esc(s.t) + '</span>';
          }).join('') +
        '</div>' +
        '<div class="industry-card__foot">' +
          '<span class="small muted">预算 ' + esc(c.budget) + '</span>' +
          '<span class="badge badge--amber">看完整方案</span>' +
        '</div>' +
      '</div>' +
    '</a>';
  }

  /* ---------- 工具卡片 ---------- */
  function toolCard(t) {
    var initial = (t.name || '?').slice(0, 1);
    return '<article class="tool-card reveal" id="' + esc(t.id) + '" data-cat="' + esc(t.category) + '" data-key="' +
      esc((t.name + ' ' + t.vendor + ' ' + t.desc + ' ' + t.use + ' ' + (t.audience || '')).toLowerCase()) + '">' +
      '<div class="tool-card__head">' +
        '<div class="tool-logo" aria-hidden="true">' + esc(t.logo || initial) + '</div>' +
        '<div>' +
          '<h3 class="tool-card__name"><a href="' + esc(t.url) + '" target="_blank" rel="noopener nofollow">' + esc(t.name) + '</a></h3>' +
          '<span class="tool-card__vendor">' + esc(t.vendor) + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="tool-card__desc">' + esc(t.desc) + '</p>' +
      '<dl class="tool-card__rows">' +
        '<div class="tool-card__row"><dt>适用</dt><dd>' + esc(t.audience) + '</dd></div>' +
        '<div class="tool-card__row"><dt>用途</dt><dd>' + esc(t.use) + '</dd></div>' +
        '<div class="tool-card__row"><dt>成本</dt><dd>' + esc(t.price) + '</dd></div>' +
        '<div class="tool-card__row"><dt>难度</dt><dd>' + esc(t.difficulty) + '</dd></div>' +
      '</dl>' +
      '<div class="tool-card__foot">' +
        '<span class="badge badge--gray">' + esc(t.category) + '</span>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(t.url) + '" target="_blank" rel="noopener nofollow">访问官网' + icon('i-external') + '</a>' +
      '</div>' +
    '</article>';
  }

  /* ---------- 提示词卡片 ---------- */
  function promptCard(p) {
    return '<article class="prompt-card reveal" id="' + esc(p.id) + '" data-cat="' + esc(p.category) + '" data-tags="' + esc((p.tags || []).join(',')) + '">' +
      '<div class="prompt-card__head">' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="prompt-card__scene">' + esc(p.scene) + '</p>' +
      '</div>' +
      '<div class="prompt-card__body">' +
        '<div class="prompt-preview">' + esc(p.prompt) + '</div>' +
        '<div class="prompt-card__foot">' +
          '<button class="btn btn-primary btn-sm" type="button" data-copy="' + esc(p.prompt) + '">' + icon('i-copy') + '复制提示词</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-prompt-detail="' + esc(p.id) + '">用法与示例</button>' +
          '<span class="badge badge--gray">' + esc(p.level) + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- 书籍卡片 ---------- */
  function bookCard(b) {
    return '<article class="book-card reveal" id="' + esc(b.id) + '" data-cat="' + esc(b.category) + '">' +
      '<div class="book-cover" aria-hidden="true">' +
        '<span class="book-cover__title">' + esc(b.title) + '</span>' +
        '<span class="book-cover__author">' + esc(b.author) + '</span>' +
      '</div>' +
      '<div class="book-card__body">' +
        '<h3>' + esc(b.title) + '</h3>' +
        '<p class="book-card__author">' + esc(b.author) + ' · ' + esc(b.category) + '</p>' +
        '<p class="book-card__desc">' + esc(b.core) + '</p>' +
        '<p class="book-card__fit"><span>适合：</span>' + esc(b.fit) + '</p>' +
      '</div>' +
    '</article>';
  }

  /* ---------- 网站资源卡片 ---------- */
  function siteCard(s) {
    return '<article class="card card--hover" id="' + esc(s.id) + '" data-cat="' + esc(s.category) + '">' +
      '<div class="flex" style="justify-content:space-between;align-items:flex-start">' +
        '<div class="icon-tile icon-tile--amber">' + icon(s.icon || 'i-external') + '</div>' +
        '<span class="badge badge--gray">' + esc(s.category) + '</span>' +
      '</div>' +
      '<h3 class="card-title" style="margin-top:14px">' + esc(s.name) + '</h3>' +
      '<p class="card-desc">' + esc(s.use) + '</p>' +
      '<p class="small muted">适合场景：' + esc(s.scene) + '</p>' +
      '<p class="small">' + esc(s.tip) + '</p>' +
      '<a class="btn btn-ghost btn-sm" href="' + esc(s.url) + '" target="_blank" rel="noopener nofollow">打开网站' + icon('i-external') + '</a>' +
    '</article>';
  }

  /* ---------- 空状态 ---------- */
  function emptyState(title, hint) {
    return '<div class="empty-state">' + icon('i-search') +
      '<strong>' + esc(title) + '</strong>' +
      '<p class="small">' + esc(hint) + '</p></div>';
  }

  /* ---------- 通用：分类 chips + 关键词搜索 ---------- */
  /**
   * @param {Object} opt
   *  nav      分类按钮容器
   *  search   搜索输入框
   *  list     列表容器
   *  result   结果计数元素
   *  items    卡片选择器
   *  catAttr  卡片上的分类属性名
   *  allLabel 「全部」文案
   */
  function bindFilter(opt) {
    var nav = opt.nav, input = opt.search, list = opt.list;
    if (!list) return;
    var state = { cat: 'all', q: '' };
    var cards = function () { return Array.prototype.slice.call(list.querySelectorAll(opt.items || '[data-cat]')); };

    function renderChips() {
      if (!nav) return;
      var cats = [];
      cards().forEach(function (el) {
        var c = el.getAttribute(opt.catAttr || 'data-cat');
        if (c && cats.indexOf(c) === -1) cats.push(c);
      });
      var html = '<button class="chip" type="button" data-cat-value="all" aria-pressed="true">' + (opt.allLabel || '全部') +
        ' <span class="chip-count">' + cards().length + '</span></button>';
      cats.forEach(function (c) {
        var n = cards().filter(function (el) { return el.getAttribute(opt.catAttr || 'data-cat') === c; }).length;
        html += '<button class="chip" type="button" data-cat-value="' + esc(c) + '" aria-pressed="false">' + esc(c) +
          ' <span class="chip-count">' + n + '</span></button>';
      });
      nav.innerHTML = html;
    }

    function apply() {
      var shown = 0;
      cards().forEach(function (el) {
        var cat = el.getAttribute(opt.catAttr || 'data-cat');
        var key = (el.getAttribute('data-key') || el.textContent || '').toLowerCase();
        var okCat = state.cat === 'all' || cat === state.cat;
        var okQ = !state.q || key.indexOf(state.q) !== -1;
        var ok = okCat && okQ;
        el.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      if (opt.result) opt.result.textContent = '共 ' + shown + ' 条';
      var empty = list.querySelector('[data-filter-empty]');
      if (shown === 0) {
        if (!empty) {
          empty = document.createElement('div');
          empty.setAttribute('data-filter-empty', '');
          empty.style.gridColumn = '1 / -1';
          list.appendChild(empty);
        }
        empty.innerHTML = emptyState('没有找到匹配的内容', '换个关键词，或点击「全部」看看其他分类。');
      } else if (empty) {
        empty.remove();
      }
    }

    if (nav) {
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cat-value]');
        if (!btn) return;
        state.cat = btn.getAttribute('data-cat-value');
        Array.prototype.forEach.call(nav.querySelectorAll('[data-cat-value]'), function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply();
      });
    }
    if (input) {
      var timer = null;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          state.q = input.value.trim().toLowerCase();
          apply();
        }, 120);
      });
    }
    renderChips();
    apply();

    /* 支持带 hash 直达某个分类，例如 cases.html#case-restaurant */
    return { apply: apply, renderChips: renderChips, state: state };
  }

  /* ---------- 暴露 ---------- */
  ABG.data = { load: load, fail: fail };
  ABG.ui = {
    esc: esc,
    icon: icon,
    tagList: tagList,
    factRow: factRow,
    articleCard: articleCard,
    tutCard: tutCard,
    tutItem: tutItem,
    industryCard: industryCard,
    toolCard: toolCard,
    promptCard: promptCard,
    bookCard: bookCard,
    siteCard: siteCard,
    emptyState: emptyState,
    bindFilter: bindFilter
  };
})();