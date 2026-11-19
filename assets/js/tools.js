/* ==========================================================================
   工具导航页 · tools.js
   分类筛选 + 关键词搜索 + 价格核实提示
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var grid = document.getElementById('toolGrid');
  if (!grid) return;

  function scrollToHash() {
    var hash = decodeURIComponent(location.hash.replace('#', ''));
    if (!hash) return;
    var target = document.getElementById(hash);
    if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 120);
  }

  ABG.data.load('tools.json').then(function (data) {
    var tools = data.tools || [];
    grid.innerHTML = tools.map(ABG.ui.toolCard).join('');

    ABG.ui.bindFilter({
      nav: document.getElementById('toolFilter'),
      search: document.getElementById('toolSearch'),
      list: grid,
      result: document.getElementById('toolCount'),
      items: '.tool-card',
      catAttr: 'data-cat',
      allLabel: '全部工具'
    });

    var meta = document.getElementById('toolMeta');
    if (meta && data.meta) {
      meta.textContent = '数据更新于 ' + data.meta.updated + '。' + data.meta.notice;
    }
    var total = document.getElementById('toolTotal');
    if (total) total.textContent = tools.length;

    scrollToHash();
  })['catch'](function () { ABG.data.fail(grid); });

  window.addEventListener('hashchange', scrollToHash);
})();