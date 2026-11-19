/* ==========================================================================
   AI经营增长指南 · main.js
   全站通用：主题切换、导航、移动抽屉、返回顶部、阅读进度、复制、收藏、Toast
   依赖：无。暴露 window.ABG 供其它脚本复用。
   ========================================================================== */
(function () {
  'use strict';

  var KEY_THEME = 'abg:theme';
  var KEY_FAV = 'abg:favorites';

  /* ---------- 小工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* 图标引用同一文档内联的 sprite（见每个 HTML 顶部的 SVG SPRITE 区块），
     用 #id 而不是外部文件，file:// 直接打开也能显示。 */
  function icon(id, cls) {
    return '<svg class="' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  }

  function safeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 隐私模式忽略 */ }
  }

  /* ---------- Toast ---------- */
  var toastEl = null;
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add('is-show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2400);
  }

  /* ---------- 主题 ---------- */
  function readTheme() {
    var saved = null;
    try { saved = localStorage.getItem(KEY_THEME); } catch (e) {}
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $$('[data-theme-toggle]').forEach(function (btn) {
      var dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
      btn.setAttribute('title', dark ? '切换到浅色模式' : '切换到深色模式');
      var use = btn.querySelector('use');
      if (use) use.setAttribute('href', dark ? '#i-sun' : '#i-moon');
    });
  }

  function initTheme() {
    applyTheme(readTheme());
    $$('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(KEY_THEME, next); } catch (e) {}
        toast(next === 'dark' ? '已开启深色模式' : '已切换浅色模式');
      });
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        var saved = null;
        try { saved = localStorage.getItem(KEY_THEME); } catch (err) {}
        if (!saved) applyTheme(e.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }
  }

  /* ---------- 顶部导航：滚动阴影 ---------- */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 当前页高亮 ---------- */
  function initCurrentPage() {
    var file = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-links a, .drawer-nav a, .footer-col a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === file || (file === 'article-detail.html' && href === 'articles.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- 移动端抽屉 ---------- */
  function initDrawer() {
    var drawer = $('#drawer');
    if (!drawer) return;
    var panel = $('.drawer-panel', drawer);
    var lastFocus = null;

    function syncTriggers(expanded) {
      $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', String(expanded)); });
    }

    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      syncTriggers(true);
      var first = $('a, button', panel);
      if (first) first.focus();
    }
    function close() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      syncTriggers(false);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    syncTriggers(false);

    $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-drawer-close]', drawer).forEach(function (b) { b.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080 && drawer.classList.contains('is-open')) close();
    });
    window.ABG = window.ABG || {};
    window.ABG.closeDrawer = close;
  }

  /* ---------- 返回顶部 ---------- */
  function initBackTop() {
    var btn = $('#backTop');
    if (!btn) return;
    var onScroll = function () {
      btn.classList.toggle('is-visible', window.scrollY > 480);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 阅读进度 ---------- */
  function initReadingProgress() {
    var bar = $('#readingProgress');
    if (!bar) return;
    var articleBody = null;
    var update = function () {
      /* 文章正文是异步渲染的，每次滚动时再取一次，取到后缓存 */
      if (!articleBody) articleBody = $('#articleBody');
      var target = articleBody || document.body;
      var rect = target.getBoundingClientRect();
      var total = rect.height - window.innerHeight + 120;
      var passed = Math.min(Math.max(-rect.top + 120, 0), Math.max(total, 1));
      var pct = total > 0 ? Math.round((passed / total) * 100) : 0;
      bar.style.width = pct + '%';
      if (bar.hasAttribute('role')) bar.setAttribute('aria-valuenow', String(pct));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------- 复制 ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)['catch'](function () {
        if (fallbackCopy(text)) return;
        throw new Error('copy failed');
      });
    }
    return fallbackCopy(text) ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  function initCopy() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy], .copy-btn');
      if (!btn) return;
      var text = btn.getAttribute('data-copy');
      if (!text) {
        var block = btn.closest('.prompt-block');
        var pre = block && block.querySelector('pre');
        text = pre ? pre.textContent : '';
      }
      if (!text) return;
      e.preventDefault();
      copyText(text).then(function () {
        var original = btn.getAttribute('data-label') || btn.innerHTML;
        btn.setAttribute('data-label', original);
        btn.classList.add('is-copied');
        btn.innerHTML = icon('i-check') + '<span>已复制</span>';
        toast('已复制到剪贴板，粘贴到 AI 对话框即可使用');
        setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 2000);
      })['catch'](function () {
        toast('复制失败，请手动选中文字复制');
      });
    });
  }

  /* ---------- 收藏 ---------- */
  var favorites = safeGet(KEY_FAV, []);
  if (!Array.isArray(favorites)) favorites = [];

  function isFav(id) { return favorites.indexOf(id) !== -1; }

  function toggleFav(id) {
    var idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id); else favorites.splice(idx, 1);
    safeSet(KEY_FAV, favorites);
    return idx === -1;
  }

  function syncFavButtons() {
    $$('[data-fav]').forEach(function (btn) {
      var id = btn.getAttribute('data-fav');
      var saved = isFav(id);
      btn.classList.toggle('is-saved', saved);
      btn.setAttribute('aria-pressed', String(saved));
      var label = btn.querySelector('span');
      if (label) label.textContent = saved ? '已收藏' : '收藏';
      btn.setAttribute('aria-label', saved ? '取消收藏' : '收藏本文');
    });
  }

  function initFavorites() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fav]');
      if (!btn) return;
      var id = btn.getAttribute('data-fav');
      if (!id) return;
      e.preventDefault();
      var added = toggleFav(id);
      syncFavButtons();
      toast(added ? '已加入收藏，下次可从「我的收藏」找到' : '已取消收藏');
    });
    syncFavButtons();
  }

  /* ---------- 入场动画 ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    window.ABG.reveal = function (root) {
      $$('.reveal:not(.is-in)', root || document).forEach(function (el) { io.observe(el); });
    };
  }

  /* ---------- 订阅表单（静态演示，不发请求） ---------- */
  function initSubscribe() {
    $$('form[data-subscribe]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var val = input ? input.value.trim() : '';
        if (!val || val.indexOf('@') === -1) {
          toast('请填一个可用的邮箱地址');
          if (input) input.focus();
          return;
        }
        form.reset();
        toast('已记录（演示）：正式上线后可接入邮件订阅服务');
      });
    });
  }

  /* ---------- 侧栏锚点导航 ---------- */
  function initAsideNav() {
    var nav = $('[data-aside-nav]');
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      $$('a', nav).forEach(function (x) { x.classList.remove('is-active'); });
      a.classList.add('is-active');
    });
  }

  /* ---------- 尽早暴露 API ----------
     ui.js / search.js / 页面脚本在解析期就可能取用这些函数，
     所以必须在顶层挂载，不能等到 DOMContentLoaded 的 boot() 里。 */
  window.ABG = window.ABG || {};
  window.ABG.$ = $;
  window.ABG.$$ = $$;
  window.ABG.icon = icon;
  window.ABG.escapeHtml = escapeHtml;
  window.ABG.toast = toast;
  window.ABG.copyText = copyText;
  window.ABG.isFav = isFav;
  window.ABG.syncFavButtons = syncFavButtons;
  window.ABG.favoriteIds = function () { return favorites.slice(); };

  /* ---------- DOM 就绪后绑定交互 ---------- */
  function boot() {
    initTheme();
    initHeader();
    initCurrentPage();
    initDrawer();
    initBackTop();
    initReadingProgress();
    initCopy();
    initFavorites();
    initReveal();
    initSubscribe();
    initAsideNav();
    document.documentElement.classList.add('js-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();