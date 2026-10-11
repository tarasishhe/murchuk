/* Сірий Мурчик — scroll-driven canvas hero.
   Scroll progress through .scroll-hero picks a pre-extracted JPG frame and
   draws it onto a canvas. No <video> seeking is involved, so it behaves the
   same on iOS Safari as on desktop. */
(function () {
  'use strict';

  var FRAME_COUNT = 97;
  var framePath = function (i) {
    // frames/frame_001.jpg ... frames/frame_097.jpg
    return 'frames/frame_' + String(i + 1).padStart(3, '0') + '.jpg';
  };
  // Horizontal focal point of the source video, used when "cover" cropping so
  // narrow phone screens keep the cat in view instead of the middle of the
  // room. The cat sits left of centre and turns further left by the last
  // frame, so the focus drifts from FOCAL_X_START to FOCAL_X_END.
  var FOCAL_X_START = 0.43;
  var FOCAL_X_END = 0.37;
  var FOCAL_Y = 0.5;

  var hero = document.querySelector('.scroll-hero');
  var canvas = document.querySelector('.hero-canvas');
  var ctx = canvas.getContext('2d');
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));
  var hint = document.querySelector('.scroll-hint');

  var frames = new Array(FRAME_COUNT);
  var loaded = new Array(FRAME_COUNT).fill(false);
  var loadedCount = 0;
  var currentFrame = -1; // frame index actually on the canvas
  var targetFrame = 0;   // frame index wanted by the scroll position
  var ticking = false;

  // Exposed for automated checks (headless test reads these).
  window.__hero = {
    get loaded() { return loadedCount; },
    get frame() { return currentFrame; },
    total: FRAME_COUNT
  };

  /* ----- Frame loading ------------------------------------------------- */

  function loadFrame(i) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        frames[i] = img;
        loaded[i] = true;
        loadedCount++;
        // Redraw if this frame is closer to the wanted one than what's shown.
        requestDraw(false);
        resolve();
      };
      img.onerror = function () {
        console.warn('Frame failed to load: ' + framePath(i));
        resolve();
      };
      img.src = framePath(i);
    });
  }

  // First frame first, so the hero is never blank; then the rest in order.
  loadFrame(0).then(function () {
    for (var i = 1; i < FRAME_COUNT; i++) loadFrame(i);
  });

  /* ----- Canvas sizing ------------------------------------------------- */

  var cssW = 0;
  var cssH = 0;

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    requestDraw(true);
  }

  /* ----- Drawing ------------------------------------------------------- */

  // Nearest frame that has finished loading (so fast scrolls never go blank).
  function nearestLoaded(i) {
    if (loaded[i]) return i;
    for (var d = 1; d < FRAME_COUNT; d++) {
      if (i - d >= 0 && loaded[i - d]) return i - d;
      if (i + d < FRAME_COUNT && loaded[i + d]) return i + d;
    }
    return -1;
  }

  // object-fit: cover, cropped around the focal point.
  function drawFrame(i) {
    var img = frames[i];
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    var scale = Math.max(cssW / iw, cssH / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var focalX = FOCAL_X_START + (FOCAL_X_END - FOCAL_X_START) * (i / (FRAME_COUNT - 1));
    var dx = clamp(cssW / 2 - dw * focalX, cssW - dw, 0);
    var dy = clamp(cssH / 2 - dh * FOCAL_Y, cssH - dh, 0);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  var forceNext = false;

  function render() {
    ticking = false;
    var i = nearestLoaded(targetFrame);
    if (i === -1) return;
    if (i === currentFrame && !forceNext) return;
    forceNext = false;
    drawFrame(i);
    currentFrame = i;
  }

  // rAF throttle: at most one draw per animation frame.
  function requestDraw(force) {
    if (force) forceNext = true;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  /* ----- Scroll -> progress -> frame + overlay ------------------------ */

  function progress() {
    var rect = hero.getBoundingClientRect();
    var distance = hero.offsetHeight - window.innerHeight;
    return distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0;
  }

  function onScroll() {
    var p = progress();
    targetFrame = Math.round(p * (FRAME_COUNT - 1));
    requestDraw(false);

    for (var b = 0; b < blocks.length; b++) {
      var el = blocks[b];
      var on = p >= parseFloat(el.dataset.from) && p < parseFloat(el.dataset.to);
      el.classList.toggle('is-visible', on);
    }
    hint.classList.toggle('is-hidden', p > 0.02);
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { resizeCanvas(); onScroll(); });
  window.addEventListener('orientationchange', function () {
    // iOS reports the new size slightly after the event fires.
    setTimeout(function () { resizeCanvas(); onScroll(); }, 150);
  });
  if ('ResizeObserver' in window) {
    // Catches the dvh-driven stage size change when the iOS toolbar collapses.
    new ResizeObserver(resizeCanvas).observe(canvas);
  }

  resizeCanvas();
  onScroll();

  /* ----- Mobile menu --------------------------------------------------- */

  var menu = document.getElementById('mobile-menu');
  var toggle = document.querySelector('.menu-toggle');
  var closeBtn = menu.querySelector('.menu-close');

  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : toggle).focus();
  }

  toggle.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false); // follow the link, close menu
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) setMenu(false);
  });
  // Close the overlay if the screen is widened past the mobile breakpoint.
  window.matchMedia('(min-width: 640px)').addEventListener('change', function (e) {
    if (e.matches && !menu.hidden) setMenu(false);
  });
})();
