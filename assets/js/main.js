/* ============================================================
   页面交互：进度条、圆点索引、滚动显现、数字滚动、
   首屏聚光、图片灯箱、视频互斥
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 顶栏 / 进度条 ---------- */
  var header = document.getElementById('topbar');
  var bar = document.getElementById('progress');
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('solid', y > 30);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.classList.remove('open'); }
    });
  }

  /* ---------- 滚动显现 ---------- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -70px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 数字滚动 ---------- */
  function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function count(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var comma = el.getAttribute('data-format') === 'comma';
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 1700);
      var v = Math.round(target * ease(p));
      el.textContent = comma ? v.toLocaleString('en-US') : String(v);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { count(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      nums.forEach(function (el) { cio.observe(el); });
    } else {
      nums.forEach(function (el) {
        var v = parseFloat(el.getAttribute('data-count')) || 0;
        el.textContent = el.getAttribute('data-format') === 'comma' ? v.toLocaleString('en-US') : String(v);
      });
    }
  }

  /* ---------- 首屏视频 ---------- */
  var heroVideo = document.querySelector('.hero-media video');
  if (heroVideo) {
    heroVideo.muted = true;
    var play = function () { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); };
    if (!reduceMotion) { play(); heroVideo.addEventListener('canplay', play, { once: true }); }
  }

  /* ---------- 首屏聚光 ---------- */
  var hero = document.querySelector('.hero');
  if (hero && !reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- 圆点索引 ---------- */
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dotnav a'));
  if (dots.length && 'IntersectionObserver' in window) {
    var targets = dots.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        dots.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { dio.observe(t); });
  }

  /* ---------- 图片灯箱 ---------- */
  var zoomables = Array.prototype.slice.call(document.querySelectorAll('img.zoomable'));
  if (zoomables.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-close" aria-label="关闭">×</button><img alt=""><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    function close() { lb.classList.remove('show'); document.body.style.overflow = ''; }
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    zoomables.forEach(function (img) {
      img.addEventListener('click', function () {
        var fig = img.closest('figure');
        var cap = fig ? fig.querySelector('figcaption') : null;
        lbImg.src = img.currentSrc || img.src;
        lbCap.textContent = cap ? cap.textContent.trim() : (img.alt || '');
        lb.classList.add('show');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  /* ---------- 视频互斥 ---------- */
  var vids = document.querySelectorAll('.video-card video');
  vids.forEach(function (v) {
    v.addEventListener('play', function () {
      vids.forEach(function (o) { if (o !== v) o.pause(); });
    });
  });

  /* ---------- 年份 ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
