/* ==========================================================================
   教程页 · tutorials.js
   同时服务 growth.html 与 efficiency.html，按 body[data-track] 读取对应数据
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var esc = ui.esc;

  var list = document.getElementById('tutList');
  if (!list) return;

  var track = document.body.getAttribute('data-track') || 'growth';
  var file = track === 'efficiency' ? 'tutorials-efficiency.json' : 'tutorials-growth.json';
  var filterNav = document.getElementById('tutFilter');
  var searchInput = document.getElementById('tutSearch');
  var countEl = document.getElementById('tutCount');

  var state = { tag: 'all', q: '' };

  function apply() {
    var items = Array.prototype.slice.call(list.querySelectorAll('.tut-item'));
    var shown = 0;
    items.forEach(function (el) {
      var tags = (el.getAttribute('data-tags') || '').split(',');
      var key = el.getAttribute('data-key') || '';
      var okTag = state.tag === 'all' || tags.indexOf(state.tag) !== -1;
      var okQ = !state.q || key.indexOf(state.q) !== -1;
      var ok = okTag && okQ;
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = '共 ' + shown + ' 个教程';
    var empty = list.querySelector('[data-empty]');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('div');
        empty.setAttribute('data-empty', '');
        empty.innerHTML = ui.emptyState('没有匹配的教程', '换个关键词，或点「全部」查看完整清单。');
        list.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  function buildChips(tutorials) {
    if (!filterNav) return;
    var counts = {};
    tutorials.forEach(function (t) {
      (t.tags || []).forEach(function (tag) { counts[tag] = (counts[tag] || 0) + 1; });
    });
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);
    filterNav.innerHTML =
      '<span class="filter-bar__label">按主题筛选</span>' +
      '<button class="chip" type="button" data-tag="all" aria-pressed="true">全部 <span class="chip-count">' + tutorials.length + '</span></button>' +
      tags.map(function (tag) {
        return '<button class="chip" type="button" data-tag="' + esc(tag) + '" aria-pressed="false">' + esc(tag) +
          ' <span class="chip-count">' + counts[tag] + '</span></button>';
      }).join('');

    filterNav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tag]');
      if (!btn) return;
      state.tag = btn.getAttribute('data-tag');
      Array.prototype.forEach.call(filterNav.querySelectorAll('[data-tag]'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  }

  ABG.data.load(file).then(function (data) {
    var tutorials = data.tutorials || [];

    list.innerHTML = tutorials.map(function (t, i) { return ui.tutItem(t, i); }).join('');
    buildChips(tutorials);

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

    /* 深链：#tut-xxx 直接展开并定位 */
    var hash = location.hash.replace('#', '');
    if (hash) {
      var target = document.getElementById(hash);
      if (target && target.tagName === 'DETAILS') {
        target.open = true;
        setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 80);
      }
    }

    ABG.data.load('prompts.json').then(function (pd) {
      /* 教程页也展示相关提示词入口的计数，仅用于数字准确性 */
      var badge = document.getElementById('promptTotal');
      if (badge && pd.prompts) badge.textContent = pd.prompts.length;
    })['catch'](function () {});
  })['catch'](function () {
    ABG.data.fail(list);
  });
})();