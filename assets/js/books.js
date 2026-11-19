/* ==========================================================================
   书籍推荐页 · books.js
   卡片展示作者、核心观点、适合读者、能学到什么、与小微经营的关联
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var grid = document.getElementById('bookGrid');
  if (!grid) return;

  var esc = ABG.ui.esc;

  function render(b) {
    return '<article class="book-card reveal" id="' + esc(b.id) + '" data-cat="' + esc(b.category) + '" data-key="' +
      esc((b.title + ' ' + b.author + ' ' + b.category + ' ' + b.core + ' ' + b.fit).toLowerCase()) + '">' +
      '<div class="book-cover" aria-hidden="true">' +
        '<span class="book-cover__title">' + esc(b.title) + '</span>' +
        '<span class="book-cover__author">' + esc(b.author) + '</span>' +
      '</div>' +
      '<div class="book-card__body">' +
        '<h3>' + esc(b.title) + '</h3>' +
        '<p class="book-card__author">' + esc(b.author) + ' · ' + esc(b.category) + ' · 阅读难度 ' + esc(b.level) + '</p>' +
        '<p class="book-card__desc" style="-webkit-line-clamp:4">' + esc(b.core) + '</p>' +
        '<p class="small" style="margin-bottom:6px"><strong>适合谁读：</strong>' + esc(b.fit) + '</p>' +
        '<p class="small" style="margin-bottom:6px"><strong>能学到什么：</strong>' + esc(b.learn) + '</p>' +
        '<p class="small muted" style="margin-bottom:0"><strong>和小生意的关系：</strong>' + esc(b.relate) + '</p>' +
      '</div>' +
    '</article>';
  }

  ABG.data.load('books.json').then(function (data) {
    var books = data.books || [];
    grid.innerHTML = books.map(render).join('');

    ABG.ui.bindFilter({
      nav: document.getElementById('bookFilter'),
      search: document.getElementById('bookSearch'),
      list: grid,
      result: document.getElementById('bookCount'),
      items: '.book-card',
      catAttr: 'data-cat',
      allLabel: '全部分类'
    });

    var total = document.getElementById('bookTotal');
    if (total) total.textContent = books.length;

    var meta = document.getElementById('bookMeta');
    if (meta && data.meta) {
      meta.textContent = '数据更新于 ' + data.meta.updated + '。' + data.meta.notice;
    }

    var hash = location.hash.replace('#', '');
    if (hash) {
      var el = document.getElementById(hash);
      if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 120);
    }
  })['catch'](function () { ABG.data.fail(grid); });
})();