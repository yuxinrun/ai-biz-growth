/* ==========================================================================
   首页 · home.js
   按模块从 JSON 渲染：热门教程、行业方案、工具精选、提示词精选、书籍、最新文章
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var load = ABG.data.load;
  var fail = ABG.data.fail;

  function mount(id, html) {
    var el = document.getElementById(id);
    if (!el) return null;
    el.innerHTML = html;
    return el;
  }

  /* ---------- 热门实战教程 ---------- */
  load('tutorials-growth.json').then(function (data) {
    var pick = ['short-video', 'xiaohongshu', 'douyin-local', 'moments', 'private-domain', 'seo'];
    var list = pick.map(function (id) {
      return (data.tutorials || []).filter(function (t) { return t.id === id; })[0];
    }).filter(Boolean);
    if (list.length < 6) list = (data.tutorials || []).slice(0, 6);
    mount('homeTutorials', list.map(function (t) { return ui.tutCard(t, 'growth'); }).join(''));
  })['catch'](function () { fail(document.getElementById('homeTutorials')); });

  /* ---------- 行业方案 ---------- */
  load('cases.json').then(function (data) {
    mount('homeIndustries', (data.cases || []).slice(0, 6).map(ui.industryCard).join(''));
  })['catch'](function () { fail(document.getElementById('homeIndustries')); });

  /* ---------- 工具精选 ---------- */
  load('tools.json').then(function (data) {
    var pick = ['doubao', 'deepseek', 'jianying', 'jimeng', 'kimi', 'feishu', 'coze', 'gaoding'];
    var all = data.tools || [];
    var list = pick.map(function (id) {
      return all.filter(function (t) { return t.id === id; })[0];
    }).filter(Boolean);
    if (list.length < 6) list = all.slice(0, 8);
    mount('homeTools', list.slice(0, 8).map(ui.toolCard).join(''));
  })['catch'](function () { fail(document.getElementById('homeTools')); });

  /* ---------- 提示词精选 ---------- */
  load('prompts.json').then(function (data) {
    var pick = ['restaurant-moments', 'xhs-topic', 'douyin-script', 'product-selling-point', 'weekly-plan', 'review'];
    var all = data.prompts || [];
    var list = pick.map(function (id) {
      return all.filter(function (p) { return p.id === id; })[0];
    }).filter(Boolean);
    if (list.length < 6) list = all.slice(0, 6);
    mount('homePrompts', list.slice(0, 6).map(ui.promptCard).join(''));
  })['catch'](function () { fail(document.getElementById('homePrompts')); });

  /* ---------- 书籍推荐 ---------- */
  load('books.json').then(function (data) {
    mount('homeBooks', (data.books || []).slice(0, 4).map(ui.bookCard).join(''));
  })['catch'](function () { fail(document.getElementById('homeBooks')); });

  /* ---------- 最新文章 ---------- */
  load('articles.json').then(function (data) {
    var list = (data.articles || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
    mount('homeArticles', list.slice(0, 6).map(ui.articleCard).join(''));
    if (ABG.syncFavButtons) ABG.syncFavButtons();
  })['catch'](function () { fail(document.getElementById('homeArticles')); });
})();