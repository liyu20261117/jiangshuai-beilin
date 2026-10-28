/* ============================================================
   声音系统：点击音效 / 悬停音效 / 背景音乐 + 音量调节
   - 浏览器禁止自动播放，首次点击或按键后才会响起
   - 右上角圆形按钮开关音乐，旁边的滑杆调节音量
   - 音量与静音状态记录在浏览器本地，换页续播
   ============================================================ */
(function () {
  'use strict';

  var BASE = 'assets/audio/';
  var MUTE_KEY = 'bzl-sound-muted';
  var VOL_KEY = 'bzl-volume';
  var DEFAULT_VOL = 0.55;

  var muted = false;
  var volume = DEFAULT_VOL;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
    var v = parseFloat(localStorage.getItem(VOL_KEY));
    if (!isNaN(v)) volume = Math.max(0, Math.min(1, v));
  } catch (e) {}

  var sfx = {};
  var bgm = null;
  var bgmStarted = false;
  var startedOnce = false;
  var toastTimer = null;

  function fadeTo(audio, target, ms) {
    var step = (target - audio.volume) / Math.max(1, ms / 50);
    var timer = setInterval(function () {
      var v = audio.volume + step;
      if ((step > 0 && v >= target) || (step < 0 && v <= target)) {
        audio.volume = Math.max(0, Math.min(1, target));
        clearInterval(timer);
        return;
      }
      audio.volume = Math.max(0, Math.min(1, v));
    }, 50);
  }

  function preload() {
    ['click', 'hover'].forEach(function (name) {
      var a = new Audio(BASE + name + '.mp3');
      a.preload = 'auto';
      a.volume = name === 'click' ? 0.55 : 0.32;
      sfx[name] = a;
    });
  }

  function play(name) {
    if (muted) return;
    var proto = sfx[name];
    if (!proto) return;
    try {
      var a = proto.cloneNode();
      a.volume = proto.volume;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function ensureBgm() {
    if (bgm) return bgm;
    bgm = new Audio(BASE + 'bgm.mp3');
    bgm.loop = true;
    bgm.preload = 'auto';
    bgm.volume = 0;
    return bgm;
  }

  function updateButton() {
    var btn = document.getElementById('soundBtn');
    if (!btn) return;
    btn.classList.toggle('muted', muted);
    btn.classList.toggle('playing', !muted && bgmStarted);
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.setAttribute('title', muted ? '开启背景音乐' : '关闭背景音乐');
  }

  function updateSlider() {
    var r = document.getElementById('volRange');
    if (r) r.value = String(Math.round(volume * 100));
  }

  function showToast(text) {
    var t = document.getElementById('soundToast');
    if (!t) return;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3600);
  }

  // 跨页面续播：把当前播放位置记在 sessionStorage
  function savedTime() {
    try { return parseFloat(sessionStorage.getItem('bzl-bgm-time') || '0') || 0; } catch (e) { return 0; }
  }
  function saveTime() {
    try {
      if (bgm && bgm.currentTime > 0) sessionStorage.setItem('bzl-bgm-time', String(bgm.currentTime));
    } catch (e) {}
  }

  function startBgm() {
    if (muted || bgmStarted) return;
    bgmStarted = true;
    ensureBgm();
    var p = bgm.play();
    var begin = function () {
      if (!startedOnce) {
        startedOnce = true;
        var t = savedTime();
        if (t > 0 && (!bgm.duration || t < bgm.duration - 3)) {
          try { bgm.currentTime = t; } catch (e) {}
        }
      }
      fadeTo(bgm, volume, 2200);
      updateButton();
      showToast('背景音乐已开启 · 右上角可调节音量');
    };
    if (p && p.then) {
      p.then(begin).catch(function () {
        bgmStarted = false;
        updateButton();
      });
    } else {
      begin();
    }
    window.addEventListener('pagehide', saveTime);
  }

  function stopBgm() {
    if (!bgm) return;
    fadeTo(bgm, 0, 500);
    setTimeout(function () {
      if (bgm && muted) bgm.pause();
    }, 550);
    bgmStarted = false;
    updateButton();
  }

  function setVolume(v, silent) {
    volume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
    updateSlider();
    if (bgm && bgmStarted && !muted) bgm.volume = volume;
    if (!silent) showToast('音量 ' + Math.round(volume * 100) + '%');
  }

  function toggle() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (muted) {
      stopBgm();
      showToast('已静音');
    } else {
      startBgm();
    }
    updateButton();
    play('click');
  }

  /* ---------- 事件委托 ---------- */
  var hoverAt = 0;
  function bind() {
    var btn = document.getElementById('soundBtn');
    if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); toggle(); });

    var slider = document.getElementById('volRange');
    if (slider) {
      slider.addEventListener('input', function () {
        setVolume(parseFloat(this.value) / 100, true);
      });
      slider.addEventListener('change', function () {
        setVolume(parseFloat(this.value) / 100, false);
      });
      slider.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('a, button, .card, .name-chip, .video-card, .stat') : null;
      if (t) play('click');
    }, true);

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('.card, .name-chip, .btn, .stat, .nav a') : null;
      if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      var now = Date.now();
      if (now - hoverAt < 110) return;
      hoverAt = now;
      play('hover');
    }, true);

    function unlock() {
      // 首次交互（点击/按键）后才允许播放背景音乐
      startBgm();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    }
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);

    document.addEventListener('visibilitychange', function () {
      if (!bgm) return;
      if (document.hidden) { bgm.pause(); }
      else if (!muted && bgmStarted) { bgm.play().catch(function () {}); }
    });
  }

  function init() {
    preload();
    bind();
    updateSlider();
    updateButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SiteAudio = {
    toggle: toggle,
    isMuted: function () { return muted; },
    volume: function () { return volume; },
    setVolume: setVolume
  };
})();
