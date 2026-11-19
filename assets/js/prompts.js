/* ==========================================================================
   提示词库 · prompts.js
   分类 + 标签筛选、关键词搜索、一键复制、用法与示例弹层
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var esc = ui.esc;
  var icon = ui.icon;

  var grid = document.getElementById('promptGrid');
  if (!grid) return;

  var catNav = document.getElementById('promptFilter');
  var tagNav = document.getElementById('promptTags');
  var searchInput = document.getElementById('promptSearch');
  var countEl = document.getElementById('promptCount');

  var all = [];
  var state = { cat: 'all', tag: 'all', q: '' };

  /* ---------- 弹层 ---------- */
  var modal = document.createElement('div');
  modal.className = 'search-overlay';
  modal.id = 'promptModal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML =
    '<div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="promptModalTitle" style="display:flex;flex-direction:column;max-height:86vh">' +
      '<div class="prompt-block__bar" style="padding:14px 20px;border-bottom:1px solid var(--line);flex:0 0 auto">' +
        '<strong id="promptModalTitle">提示词详情</strong>' +
        '<button class="icon-btn" type="button" data-pm-close aria-label="关闭">' + icon('i-close') + '</button>' +
      '</div>' +
      '<div class="search-hints" id="promptModalBody" style="padding:20px 20px 28px"></div>' +
    '</div>';
  document.body.appendChild(modal);

  var modalBody = modal.querySelector('#promptModalBody');
  var modalTitle = modal.querySelector('#promptModalTitle');
  var lastFocus = null;

  function openModal(id) {
    var p = all.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = p.title;
    modalBody.innerHTML =
      '<p class="eyebrow">适用场景</p><p>' + esc(p.scene) + '</p>' +
      '<p class="eyebrow">使用方法</p><p>' + esc(p.method) + '</p>' +
      '<p class="eyebrow">完整提示词</p>' +
      '<div class="prompt-block"><div class="prompt-block__bar"><strong>复制后替换【】中的内容</strong>' +
        '<button class="copy-btn" type="button" data-copy="' + esc(p.prompt) + '">' + icon('i-copy') + '<span>复制</span></button>' +
      '</div><pre>' + esc(p.prompt) + '</pre></div>' +
      '<div class="grid grid-2" style="margin:20px 0">' +
        '<div class="card card--pad-sm card--flat"><p class="eyebrow" style="margin-bottom:8px">输入示例</p><p class="small mb-0">' + esc(p.input) + '</p></div>' +
        '<div class="card card--pad-sm card--flat"><p class="eyebrow" style="margin-bottom:8px">输出示例</p><p class="small mb-0">' + esc(p.output) + '</p></div>' +
      '</div>' +
      '<p class="eyebrow">优化技巧</p><ul class="checklist">' + (p.tips || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="fact-row">' +
        '<div class="fact"><div class="small muted">推荐工具</div><strong class="small">' + esc(p.tool) + '</strong></div>' +
        '<div class="fact"><div class="small muted">上手难度</div><strong class="small">' + esc(p.level) + '</strong></div>' +
        '<div class="fact"><div class="small muted">适用标签</div><strong class="small">' + esc((p.tags || []).join(' / ')) + '</strong></div>' +
      '</div>' +
      '<div class="flex" style="margin-top:20px"><button class="btn btn-primary" type="button" data-copy="' + esc(p.prompt) + '">' + icon('i-copy') + '一键复制完整提示词</button>' +
      '<button class="btn btn-ghost" type="button" data-pm-close>关闭</button></div>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalBody.scrollTop = 0;
    var btn = modal.querySelector('[data-pm-close]');
    if (btn) btn.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-pm-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-prompt-detail]');
    if (!btn) return;
    openModal(btn.getAttribute('data-prompt-detail'));
  });

  /* ---------- 筛选 ---------- */
  function apply() {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.prompt-card'));
    var shown = 0;
    cards.forEach(function (card) {
      var cat = card.getAttribute('data-cat');
      var tags = (card.getAttribute('data-tags') || '').split(',');
      var key = (card.textContent || '').toLowerCase();
      var ok = (state.cat === 'all' || cat === state.cat) &&
        (state.tag === 'all' || tags.indexOf(state.tag) !== -1) &&
        (!state.q || key.indexOf(state.q) !== -1);
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = '共 ' + shown + ' 条';

    var empty = grid.querySelector('[data-empty]');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('div');
        empty.setAttribute('data-empty', '');
        empty.style.gridColumn = '1 / -1';
        empty.innerHTML = ui.emptyState('没有匹配的提示词', '试试更通用的词，比如「朋友圈」「客服」「活动」。');
        grid.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  function renderChips() {
    if (catNav) {
      var cats = [];
      var catCounts = {};
      all.forEach(function (p) {
        if (cats.indexOf(p.category) === -1) cats.push(p.category);
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      });
      catNav.innerHTML = '<span class="filter-bar__label">场景分类</span>' +
        '<button class="chip" type="button" data-cat-value="all" aria-pressed="true">全部 <span class="chip-count">' + all.length + '</span></button>' +
        cats.map(function (c) {
          return '<button class="chip" type="button" data-cat-value="' + esc(c) + '" aria-pressed="false">' + esc(c) +
            ' <span class="chip-count">' + catCounts[c] + '</span></button>';
        }).join('');
    }
    if (tagNav) {
      var counts = {};
      all.forEach(function (p) {
        (p.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
      });
      var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 10);
      tagNav.innerHTML = '<span class="filter-bar__label">关键词</span>' +
        '<button class="chip" type="button" data-tag-value="all" aria-pressed="true">不限 <span class="chip-count">' + all.length + '</span></button>' +
        tags.map(function (t) {
          return '<button class="chip" type="button" data-tag-value="' + esc(t) + '" aria-pressed="false">' + esc(t) +
            ' <span class="chip-count">' + counts[t] + '</span></button>';
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

  /* ---------- 初始化 ---------- */
  ABG.data.load('prompts.json').then(function (data) {
    all = data.prompts || [];
    grid.innerHTML = all.map(ui.promptCard).join('');
    renderChips();
    apply();

    var total = document.getElementById('promptTotal');
    if (total) total.textContent = all.length;

    var meta = document.getElementById('promptMeta');
    if (meta && data.meta) {
      meta.textContent = '数据更新于 ' + data.meta.updated + '。' + data.meta.notice;
    }

    var hash = decodeURIComponent(location.hash.replace('#', ''));
    if (hash) {
      var el = document.getElementById(hash);
      if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 120);
    }
  })['catch'](function () { ABG.data.fail(grid); });
})();