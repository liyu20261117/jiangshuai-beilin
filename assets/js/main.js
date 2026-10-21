/* ============================================================
   页面交互：导航、滚动显现、数字滚动、视频、视差
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 顶部导航状态 ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
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
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.classList.remove('open');
      }
    });
  }

  /* ---------- 滚动显现 ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 数字滚动 ---------- */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateNumber(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var dur = 1800;
    var start = null;
    var comma = el.getAttribute('data-format') === 'comma';
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var v = Math.round(target * easeOutExpo(p));
      el.textContent = comma ? v.toLocaleString('en-US') : String(v);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            animateNumber(en.target);
            cio.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(function (el) {
        var v = parseFloat(el.getAttribute('data-count')) || 0;
        el.textContent = el.getAttribute('data-format') === 'comma' ? v.toLocaleString('en-US') : String(v);
      });
    }
  }

  /* ---------- 首页视频 ---------- */
  var heroVideo = document.querySelector('.hero video');
  if (heroVideo) {
    heroVideo.muted = true;
    var tryPlay = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (!reduceMotion) {
      tryPlay();
      heroVideo.addEventListener('canplay', tryPlay, { once: true });
    } else {
      heroVideo.pause();
    }
  }

  /* ---------- 视差（仅大屏） ---------- */
  var panoImg = document.querySelector('.pano img');
  if (panoImg && !reduceMotion && window.innerWidth > 900) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var rect = panoImg.parentElement.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.06;
          panoImg.style.transform = 'translateY(' + offset.toFixed(1) + 'px) scale(1.06)';
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 页脚年份 ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- 视频卡片：点击播放时暂停其它 ---------- */
  var vids = document.querySelectorAll('.video-card video');
  vids.forEach(function (v) {
    v.addEventListener('play', function () {
      vids.forEach(function (other) { if (other !== v) other.pause(); });
    });
  });
})();

