/* ==========================================================================
   行业案例页 · cases.js
   每个行业渲染为完整方案：痛点、场景、工具、流程、提示词、示例、30 天计划
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var esc = ui.esc;
  var icon = ui.icon;

  var list = document.getElementById('caseList');
  if (!list) return;

  var nav = document.getElementById('caseNav');

  function renderCase(c, index) {
    var num = index < 9 ? '0' : '';

    var pain = '<ul class="pain-list">' + (c.painPoints || []).map(function (p) {
      return '<li>' + icon('i-warning') + '<span>' + esc(p) + '</span></li>';
    }).join('') + '</ul>';

    var scenes = '<div class="grid grid-2" style="margin:1.2em 0">' + (c.scenes || []).map(function (s) {
      return '<div class="card card--pad-sm card--flat">' +
        '<h4 style="margin-bottom:6px">' + esc(s.t) + '</h4>' +
        '<p class="small muted mb-0">' + esc(s.d) + '</p></div>';
    }).join('') + '</div>';

    var tools = '<div class="flex" style="margin:1.2em 0">' + (c.tools || []).map(function (t) {
      return '<span class="badge">' + esc(t) + '</span>';
    }).join('') + '</div>';

    var flow = '<ol class="steps">' + (c.flow || []).map(function (f) {
      return '<li><strong>' + esc(f.t) + '</strong><p>' + esc(f.d) + '</p></li>';
    }).join('') + '</ol>';

    var prompt = '<div class="prompt-block">' +
      '<div class="prompt-block__bar"><strong>' + esc(c.name) + ' 实战提示词</strong>' +
      '<button class="copy-btn" type="button" data-copy="' + esc(c.prompt) + '">' + icon('i-copy') + '<span>复制</span></button></div>' +
      '<pre>' + esc(c.prompt) + '</pre></div>';

    var example = '<div class="callout callout--quote"><p>' + esc(c.example) + '</p></div>';

    var plan = '<div class="table-wrap"><table><thead><tr><th>阶段</th><th>这一周的目标</th><th>具体动作</th></tr></thead><tbody>' +
      (c.plan || []).map(function (p) {
        return '<tr><td><strong>' + esc(p.week) + '</strong></td><td>' + esc(p.goal) + '</td><td>' +
          (p.tasks || []).map(function (t) { return '· ' + esc(t); }).join('<br>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return '<article class="card reveal" id="case-' + esc(c.id) + '" style="margin-bottom:26px">' +
      '<div class="case-detail__head">' +
        '<div class="icon-tile">' + icon(c.icon || 'i-store') + '</div>' +
        '<div>' +
          '<p class="eyebrow" style="margin-bottom:6px">行业方案 ' + num + (index + 1) + '</p>' +
          '<h2 style="margin:0 0 4px">' + esc(c.name) + '</h2>' +
          '<p class="muted mb-0">' + esc(c.oneline) + '</p>' +
        '</div>' +
      '</div>' +
      '<dl class="case-detail__meta">' +
        '<div><dt>实施难度</dt><dd>' + esc(c.difficulty) + '</dd></div>' +
        '<div><dt>预算参考</dt><dd>' + esc(c.budget) + '</dd></div>' +
        '<div><dt>时间投入</dt><dd>' + esc(c.time) + '</dd></div>' +
        '<div><dt>适合谁</dt><dd>' + esc(c.name) + '经营者与 1-3 人小团队</dd></div>' +
      '</dl>' +
      '<h3>行业经营痛点</h3>' + pain +
      '<h3>AI 应用场景</h3>' + scenes +
      '<h3>工具组合</h3>' + tools +
      '<h3>完整操作流程</h3>' + flow +
      '<h3>可以直接用的提示词</h3>' + prompt +
      '<h3>示例内容</h3>' + example +
      '<h3>30 天行动计划</h3>' + plan +
      '<p class="small muted" style="margin-top:16px">说明：本方案为方法演示，金额、时间与效果均为便于讲解的假设值，不代表真实经营结果。平台规则与工具价格请以官方为准。</p>' +
    '</article>';
  }

  ABG.data.load('cases.json').then(function (data) {
    var cases = data.cases || [];
    list.innerHTML = cases.map(renderCase).join('');

    if (nav) {
      nav.innerHTML = cases.map(function (c) {
        return '<li><a href="#case-' + esc(c.id) + '"><span class="flex" style="gap:8px;align-items:center">' +
          icon(c.icon || 'i-store') + esc(c.name) + '</span></a></li>';
      }).join('');
    }

    var badge = document.getElementById('caseCount');
    if (badge) badge.textContent = cases.length;

    var hash = location.hash.replace('#', '');
    if (hash) {
      var target = document.getElementById(hash);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 80);
    }
  })['catch'](function () { ABG.data.fail(list); });
})();