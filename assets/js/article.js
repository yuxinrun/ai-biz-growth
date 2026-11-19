/* ==========================================================================
   文章详情 · article.js
   读取 ?id= 渲染文章、生成目录、收藏、分享、相关推荐、结构化数据
   ========================================================================== */
(function () {
  'use strict';

  var ABG = window.ABG;
  if (!ABG || !ABG.ui) return;
  var ui = ABG.ui;
  var esc = ui.esc;
  var icon = ui.icon;

  var host = document.getElementById('articleHost');
  if (!host) return;

  var params = new URLSearchParams(location.search);
  var id = params.get('id');

  function setMeta(name, content, attr) {
    var key = attr || 'name';
    var el = document.querySelector('meta[' + key + '="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(key, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setCanonical(url) {
    var link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  function injectJsonLd(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function notFound() {
    host.innerHTML = '<div class="container" style="padding:60px 24px 80px">' +
      ui.emptyState('没有找到这篇文章', '链接可能已经改变，去文章列表看看其他内容。') +
      '<div class="text-center" style="margin-top:20px"><a class="btn btn-primary" href="articles.html">返回文章列表</a></div>' +
      '</div>';
    document.title = '文章未找到 · AI经营增长指南';
  }

  ABG.data.load('articles.json').then(function (data) {
    var list = (data.articles || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
    var article = list.filter(function (a) { return a.id === id; })[0];

    if (!article) { notFound(); return; }

    var index = list.indexOf(article);
    var prev = list[index + 1] || null;   /* 更早的一篇 */
    var next = list[index - 1] || null;   /* 更新的一篇 */

    /* ---- 头部 ---- */
    document.title = article.title + ' · AI经营增长指南';
    setMeta('description', article.summary);
    setMeta('keywords', (article.tags || []).join(',') + ',' + article.category);
    setMeta('og:title', article.title, 'property');
    setMeta('og:description', article.summary, 'property');
    setMeta('og:type', 'article', 'property');
    setMeta('og:url', location.href, 'property');
    setMeta('article:published_time', article.date, 'property');
    setCanonical(location.origin + location.pathname + '?id=' + encodeURIComponent(article.id));

    var crumb = document.getElementById('articleCrumb');
    if (crumb) {
      crumb.innerHTML = '<ol>' +
        '<li><a href="index.html">首页</a></li>' +
        '<li><a href="articles.html">实战文章</a></li>' +
        '<li><span aria-current="page">' + esc(article.title) + '</span></li>' +
      '</ol>';
    }

    host.innerHTML =
      '<header class="article-hero">' +
        '<div class="container">' +
          '<div class="article-hero__meta">' +
            '<span class="badge">' + esc(article.category) + '</span>' +
            '<span>' + esc(article.date) + '</span>' +
            '<span>作者 ' + esc(article.author) + '</span>' +
            '<span>约 ' + esc(article.readingTime) + ' 分钟读完</span>' +
          '</div>' +
          '<h1 style="margin-top:14px">' + esc(article.title) + '</h1>' +
          '<p class="article-hero__lede">' + esc(article.summary) + '</p>' +
          '<div class="article-actions">' +
            '<button class="btn btn-ghost btn-sm" type="button" data-fav="' + esc(article.id) + '" aria-pressed="false">' +
              icon('i-bookmark') + '<span>收藏</span></button>' +
            '<button class="btn btn-ghost btn-sm" type="button" id="shareBtn">' + icon('i-external') + '复制本文链接</button>' +
            '<a class="btn btn-ghost btn-sm" href="articles.html">' + icon('i-arrow-right') + '更多文章</a>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="container">' +
        '<div class="article-layout">' +
          '<article class="prose" id="articleBody">' + article.content + '</article>' +
          '<aside>' +
            '<div class="toc" aria-labelledby="tocTitle">' +
              '<h2 id="tocTitle">本文目录</h2>' +
              '<ol id="tocList"></ol>' +
            '</div>' +
            '<div class="aside-card" style="margin-top:18px">' +
              '<h3>关于作者</h3>' +
              '<p class="small muted mb-0">' + esc(article.author) + '，专注研究小生意怎么用 AI 做增长。文中方法均为演示，请结合自己门店情况调整。</p>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
      '<section class="section section--tight">' +
        '<div class="container">' +
          '<div class="section-head"><p class="eyebrow">继续阅读</p><h2>相关文章</h2></div>' +
          '<div class="grid grid-3" id="relatedArticles"></div>' +
          '<nav class="flex-between" id="articlePager" style="margin-top:32px" aria-label="上一篇下一篇"></nav>' +
        '</div>' +
      '</section>';

    /* ---- 目录 ---- */
    var body = document.getElementById('articleBody');
    var tocList = document.getElementById('tocList');
    var heads = Array.prototype.slice.call(body.querySelectorAll('h2, h3'));
    var used = 0;
    heads.forEach(function (h, i) {
      var hid = 'sec-' + (i + 1);
      h.id = hid;
      if (h.tagName === 'H2') used++;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + hid;
      a.textContent = h.textContent;
      if (h.tagName === 'H3') a.style.paddingLeft = '26px';
      li.appendChild(a);
      tocList.appendChild(li);
    });

    if (!used) {
      var tocBox = document.querySelector('.toc');
      if (tocBox) tocBox.style.display = 'none';
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var links = tocList.querySelectorAll('a');
          Array.prototype.forEach.call(links, function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-88px 0px -70% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }

    /* ---- 收藏 / 分享 ---- */
    ABG.syncFavButtons();

    var share = document.getElementById('shareBtn');
    if (share) {
      share.addEventListener('click', function () {
        ABG.copyText(location.href).then(function () {
          ABG.toast('链接已复制，可以发给同事或客户');
        })['catch'](function () {
          ABG.toast('复制失败，请从浏览器地址栏手动复制');
        });
      });
    }

    /* ---- 相关文章 ---- */
    var related = list.filter(function (a) {
      return a.id !== article.id && a.category === article.category;
    });
    if (related.length < 3) {
      list.forEach(function (a) {
        if (related.length >= 3) return;
        if (a.id !== article.id && related.indexOf(a) === -1) related.push(a);
      });
    }
    var relatedBox = document.getElementById('relatedArticles');
    if (relatedBox) {
      relatedBox.innerHTML = related.slice(0, 3).map(ui.articleCard).join('');
      ABG.syncFavButtons();
    }

    /* ---- 上一篇 / 下一篇 ---- */
    var pager = document.getElementById('articlePager');
    if (pager) {
      pager.innerHTML =
        (next ? '<a class="btn btn-ghost" href="article-detail.html?id=' + encodeURIComponent(next.id) + '">← 更新：' + esc(next.title) + '</a>' : '<span></span>') +
        (prev ? '<a class="btn btn-ghost" href="article-detail.html?id=' + encodeURIComponent(prev.id) + '">更早：' + esc(prev.title) + ' →</a>' : '<span></span>');
    }

    /* ---- 结构化数据 ---- */
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.summary,
      datePublished: article.date,
      dateModified: article.date,
      author: { '@type': 'Person', name: article.author },
      publisher: { '@type': 'Organization', name: 'AI经营增长指南' },
      articleSection: article.category,
      keywords: (article.tags || []).join(','),
      inLanguage: 'zh-CN'
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: location.origin + location.pathname.replace(/[^/]+$/, '') + 'index.html' },
        { '@type': 'ListItem', position: 2, name: '实战文章', item: location.origin + location.pathname.replace(/[^/]+$/, '') + 'articles.html' },
        { '@type': 'ListItem', position: 3, name: article.title }
      ]
    });
  })['catch'](function (err) {
    host.innerHTML = '<div class="container" style="padding:60px 24px 80px">' +
      ui.emptyState('文章加载失败', '刷新页面重试；如果仍失败，请回到文章列表重新打开。') +
      '<p class="small muted text-center">' + esc(err.message || '') + '</p></div>';
  });
})();