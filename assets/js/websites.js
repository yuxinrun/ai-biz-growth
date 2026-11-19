/* ==========================================================================
   网站资源库 · websites.js
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var grid = document.getElementById('siteGrid');
  if (!grid) return;

  ABG.data.load('websites.json').then(function (data) {
    var sites = data.sites || [];
    grid.innerHTML = sites.map(ABG.ui.siteCard).join('');

    ABG.ui.bindFilter({
      nav: document.getElementById('siteFilter'),
      search: document.getElementById('siteSearch'),
      list: grid,
      result: document.getElementById('siteCount'),
      items: '.card',
      catAttr: 'data-cat',
      allLabel: '全部分类'
    });

    var total = document.getElementById('siteTotal');
    if (total) total.textContent = sites.length;

    var meta = document.getElementById('siteMeta');
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