/* ==========================================================================
   实战文章列表 · articles.js
   分类筛选、标签筛选、关键词搜索、仅看收藏
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var esc = ui.esc;
  var icon = ui.icon;

  var grid = document.getElementById('articleGrid');
  if (!grid) return;

  var catNav = document.getElementById('articleFilter');
  var tagNav = document.getElementById('articleTags');
  var searchInput = document.getElementById('articleSearch');
  var countEl = document.getElementById('articleCount');
  var favBtn = document.getElementById('onlyFav');

  var all = [];
  var state = { cat: 'all', tag: 'all', q: '', onlyFav: false };

  function getFavs() {
    try {
      var raw = localStorage.getItem('abg:favorites');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function apply() {
    var favs = getFavs();
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.article-card'));
    var shown = 0;

    cards.forEach(function (card) {
      var id = card.getAttribute('data-id');
      var cat = card.getAttribute('data-cat');
      var tags = (card.getAttribute('data-tags') || '').split(',');
      var key = (card.getAttribute('data-key') || '');
      var ok = (state.cat === 'all' || cat === state.cat) &&
        (state.tag === 'all' || tags.indexOf(state.tag) !== -1) &&
        (!state.q || key.indexOf(state.q) !== -1) &&
        (!state.onlyFav || favs.indexOf(id) !== -1);
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });

    if (countEl) countEl.textContent = '共 ' + shown + ' 篇';
    if (favBtn) {
      favBtn.setAttribute('aria-pressed', String(state.onlyFav));
      var n = favs.length;
      favBtn.innerHTML = icon('i-bookmark') + '只看收藏 <span class="chip-count">' + n + '</span>';
    }

    var empty = grid.querySelector('[data-empty]');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('div');
        empty.setAttribute('data-empty', '');
        empty.style.gridColumn = '1 / -1';
        grid.appendChild(empty);
      }
      empty.innerHTML = state.onlyFav && !favs.length
        ? ui.emptyState('还没有收藏的文章', '在文章卡片右下角点书签图标，或在文章详情页点「收藏」。')
        : ui.emptyState('没有找到匹配的文章', '换个关键词，或点「全部」查看所有文章。');
    } else if (empty) {
      empty.remove();
    }
  }

  function renderChips() {
    if (catNav) {
      var cats = [];
      all.forEach(function (a) { if (cats.indexOf(a.category) === -1) cats.push(a.category); });
      catNav.innerHTML = '<span class="filter-bar__label">文章分类</span>' +
        '<button class="chip" type="button" data-cat-value="all" aria-pressed="true">全部</button>' +
        cats.map(function (c) {
          var n = all.filter(function (a) { return a.category === c; }).length;
          return '<button class="chip" type="button" data-cat-value="' + esc(c) + '" aria-pressed="false">' + esc(c) +
            ' <span class="chip-count">' + n + '</span></button>';
        }).join('');
    }
    if (tagNav) {
      var counts = {};
      all.forEach(function (a) {
        (a.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
      });
      var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 10);
      tagNav.innerHTML = '<span class="filter-bar__label">关键词</span>' +
        '<button class="chip" type="button" data-tag-value="all" aria-pressed="true">不限</button>' +
        tags.map(function (t) {
          return '<button class="chip" type="button" data-tag-value="' + esc(t) + '" aria-pressed="false">' + esc(t) + '</button>';
        }).join('');
    }
  }

  if (catNav) {
    catNav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat-value]');
      if (!btn) return;
      state.cat = btn.getAttribute('data-cat-value');
      Array.prototype.forEach.call(catNav.querySelectorAll('[data-cat-value]'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  }

  if (tagNav) {
    tagNav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tag-value]');
      if (!btn) return;
      state.tag = btn.getAttribute('data-tag-value');
      Array.prototype.forEach.call(tagNav.querySelectorAll('[data-tag-value]'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  }

  if (favBtn) {
    favBtn.addEventListener('click', function () {
      state.onlyFav = !state.onlyFav;
      apply();
    });
  }

  if (searchInput) {
    var timer = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = searchInput.value.trim().toLowerCase();
        apply();
      }, 120);
    });
  }

  /* 收藏状态变化后同步计数 */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-fav]')) setTimeout(apply, 0);
  });

  ABG.data.load('articles.json').then(function (data) {
    all = (data.articles || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });

    grid.innerHTML = all.map(ui.articleCard).join('');

    renderChips();
    apply();
    ABG.syncFavButtons();

    var total = document.getElementById('articleTotal');
    if (total) total.textContent = all.length;
  })['catch'](function () { ABG.data.fail(grid); });
})();