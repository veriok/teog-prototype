// js/cinematic.js — Echoes of Germolles: Cinematic Engine
//
// Usage:  await Cinematic.play('some_id');
// Guard:  if (Cinematic.isPlaying) return;
//
// The overlay is position:fixed, z-index:500 — above everything.
// #nav-tabs and #tab-content receive the `inert` attribute while playing,
// blocking all clicks, keyboard focus, and tab traversal.
// _unlock() runs in a finally block and cannot be skipped.

import { CINEMATICS } from './data/cinematics.js';

export const Cinematic = {

  _isPlaying:          false,
  _skipAllFlag:        false,
  _resolveScene:       null,
  _sceneTimers:        [],        // setTimeout IDs cleared on skip
  _dotsInterval:       null,      // crossfade dot interval
  _typewriterInterval: null,      // image_caption typewriter interval
  _overlay:            null,      // root DOM element (built once)
  _escHandler:         null,      // keydown handler ref for removal
  _imageDimensions:    {},        // src → {w, h} populated during preload

  // ── Public API ────────────────────────────────────────────────────────

  get isPlaying() { return this._isPlaying; },

  async play(id) {
    const def = CINEMATICS[id];
    if (!def) {
      console.warn(`[Cinematic] Unknown cinematic id: "${id}"`);
      return;
    }

    this._buildOverlay();
    await this._preloadImages(def.scenes);

    this._skipAllFlag = false;
    this._lock();

    try {
      for (const scene of def.scenes) {
        await this._playScene(scene);
        if (this._skipAllFlag) break;
      }
    } finally {
      this._unlock();
    }
  },

  // ── Image preloading ──────────────────────────────────────────────────
  // Loads all images in the scene list into the browser cache before the
  // first scene plays. Resolves even if individual images fail (404 etc.)

  _preloadImages(scenes) {
    const srcs = new Set();
    for (const s of scenes) {
      if (s.image)  srcs.add(s.image);
      if (s.imageA) srcs.add(s.imageA);
      if (s.imageB) srcs.add(s.imageB);
    }
    if (srcs.size === 0) return Promise.resolve();

    return Promise.allSettled(
      [...srcs].map(src => new Promise(resolve => {
        const img  = new Image();
        img.onload  = () => {
          this._imageDimensions[src] = { w: img.naturalWidth, h: img.naturalHeight };
          resolve();
        };
        img.onerror = () => {
          console.warn(`[Cinematic] Image failed to load: ${src}`);
          resolve();
        };
        img.src = src;
      }))
    );
  },

  // ── Aspect ratio helper ───────────────────────────────────────────────
  // Reads natural image dimensions recorded during preload and applies
  // them as an inline aspect-ratio on #cin-image-layer, overriding the
  // CSS 3/2 default so portrait or non-standard images are never cropped.

  _applyImageAspectRatio(src) {
    if (!src) return;
    const dims = this._imageDimensions[src];
    if (!dims || dims.w === 0 || dims.h === 0) return;
    const layer = document.getElementById('cin-image-layer');
    const stage = document.getElementById('cin-stage');
    if (!layer || !stage) return;

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    if (stageW === 0 || stageH === 0) return;

    const imgAR   = dims.w / dims.h;
    const stageAR = stageW / stageH;
    let finalW, finalH;

    if (imgAR >= stageAR) {
      // Image wider relative to stage — fit to stage width
      finalW = stageW;
      finalH = Math.round(stageW / imgAR);
    } else {
      // Image taller relative to stage — fit to stage height
      finalH = stageH;
      finalW = Math.round(stageH * imgAR);
    }

    layer.style.width       = `${finalW}px`;
    layer.style.height      = `${finalH}px`;
    layer.style.aspectRatio = '';
  },

  // ── Build overlay DOM (idempotent) ────────────────────────────────────

  _buildOverlay() {
    if (this._overlay) return;

    const el = document.createElement('div');
    el.id = 'cinematic-overlay';
    el.innerHTML = `
      <div id="cin-letterbox-top"></div>
      <div id="cin-stage">
        <div id="cin-image-layer">
          <img id="cin-img-bottom" alt="" />
          <img id="cin-img-top"    alt="" />
        </div>
        <div id="cin-title-card">
          <div id="cin-title"></div>
          <div id="cin-subtitle"></div>
        </div>
      </div>
      <div id="cin-caption-bar">
        <span id="cin-caption-text"></span><span id="cin-dots"></span>
      </div>
      <div id="cin-controls">
        <button class="cin-btn" id="cin-btn-skip">&raquo;&raquo; Skip</button>
        <button class="cin-btn" id="cin-btn-next">&#9654; Next</button>
      </div>
      <div id="cin-letterbox-bottom"></div>
    `;
    document.body.appendChild(el);
    this._overlay = el;

    el.querySelector('#cin-btn-skip').addEventListener('click', () => this._skipAll());
    el.querySelector('#cin-btn-next').addEventListener('click', () => this._skipCurrentScene());
  },

  // ── Lock / unlock UI ──────────────────────────────────────────────────

  _lock() {
    this._isPlaying = true;
    this._overlay.classList.add('active');

    const navTabs    = document.getElementById('nav-tabs');
    const tabContent = document.getElementById('tab-content');
    if (navTabs)    navTabs.inert    = true;
    if (tabContent) tabContent.inert = true;

    this._escHandler = (e) => { if (e.key === 'Escape') this._skipAll(); };
    window.addEventListener('keydown', this._escHandler);
  },

  _unlock() {
    this._isPlaying = false;
    this._overlay.classList.remove('active');

    const navTabs    = document.getElementById('nav-tabs');
    const tabContent = document.getElementById('tab-content');
    if (navTabs)    navTabs.inert    = false;
    if (tabContent) tabContent.inert = false;

    if (this._escHandler) {
      window.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  },

  // ── Skip helpers ──────────────────────────────────────────────────────

  _skipCurrentScene() {
    this._clearSceneTimers();
    if (this._resolveScene) {
      const resolve      = this._resolveScene;
      this._resolveScene = null;
      resolve();
    }
  },

  _skipAll() {
    this._skipAllFlag = true;
    this._skipCurrentScene();
  },

  _clearSceneTimers() {
    for (const id of this._sceneTimers) clearTimeout(id);
    this._sceneTimers = [];
    if (this._dotsInterval)       { clearInterval(this._dotsInterval);       this._dotsInterval       = null; }
    if (this._typewriterInterval) { clearInterval(this._typewriterInterval); this._typewriterInterval = null; }
  },

  // ── Scene dispatcher ──────────────────────────────────────────────────

  _playScene(scene) {
    return new Promise(resolve => {
      this._resolveScene = resolve;
      this._clearSceneTimers();
      this._resetLayers();

      switch (scene.type) {
        case 'crossfade':     this._playCrossfade(scene);    break;
        case 'title_card':    this._playTitleCard(scene);    break;
        case 'image_caption': this._playImageCaption(scene); break;
        default:
          console.warn(`[Cinematic] Unknown scene type: "${scene.type}"`);
          resolve();
      }
    });
  },

  _resetLayers() {
    const imgTop      = document.getElementById('cin-img-top');
    const imgBottom   = document.getElementById('cin-img-bottom');
    const imageLayer  = document.getElementById('cin-image-layer');
    const titleCard   = document.getElementById('cin-title-card');
    const captionText = document.getElementById('cin-caption-text');
    const dots        = document.getElementById('cin-dots');

    imgTop.src           = '';
    imgBottom.src        = '';
    imgTop.style.opacity = '1';
    imgTop.classList.remove('ken-burns');

    imageLayer.style.aspectRatio = '';  // revert to CSS 3/2 default
    imageLayer.style.width       = '';
    imageLayer.style.height      = '';
    imageLayer.style.display = 'none';
    titleCard.style.display  = 'none';
    titleCard.classList.remove('cin-title-visible');

    captionText.textContent = '';
    dots.textContent        = '';
  },

  // ── Crossfade scene ───────────────────────────────────────────────────
  // Shows imageA with animated caption dots. After dotCount dots, imageA
  // fades out (CSS transition) to reveal imageB underneath. Holds holdAfter
  // ms then resolves.

  _playCrossfade(scene) {
    const imgTop      = document.getElementById('cin-img-top');
    const imgBottom   = document.getElementById('cin-img-bottom');
    const imageLayer  = document.getElementById('cin-image-layer');
    const captionText = document.getElementById('cin-caption-text');
    const dots        = document.getElementById('cin-dots');

    this._applyImageAspectRatio(scene.imageA || scene.imageB);
    imageLayer.style.display = '';
    imgBottom.src            = scene.imageB || '';
    imgTop.src               = scene.imageA || '';
    imgTop.style.opacity     = '1';
    captionText.textContent  = scene.captionText || '';

    const dotCount     = scene.dotCount    ?? 3;
    const dotInterval  = scene.dotInterval ?? 600;
    const holdAfter    = scene.holdAfter   ?? 1000;
    const fadeDuration = 1200; // must match #cin-img-top transition in CSS

    let dotsAdded = 0;
    this._dotsInterval = setInterval(() => {
      dotsAdded++;
      dots.textContent += '.';

      if (dotsAdded >= dotCount) {
        clearInterval(this._dotsInterval);
        this._dotsInterval = null;

        imgTop.style.opacity = '0'; // triggers CSS transition

        const t = setTimeout(() => {
          if (this._resolveScene) {
            const resolve      = this._resolveScene;
            this._resolveScene = null;
            resolve();
          }
        }, fadeDuration + holdAfter);
        this._sceneTimers.push(t);
      }
    }, dotInterval);
  },

  // ── Title card scene ──────────────────────────────────────────────────
  // Large centered title with optional subtitle on black background.
  // CSS animations handle the fade-in via .cin-title-visible class.

  _playTitleCard(scene) {
    const titleCard  = document.getElementById('cin-title-card');
    const titleEl    = document.getElementById('cin-title');
    const subtitleEl = document.getElementById('cin-subtitle');

    titleEl.textContent      = scene.title    || '';
    subtitleEl.textContent   = scene.subtitle || '';
    subtitleEl.style.display = scene.subtitle ? '' : 'none';
    titleCard.style.display  = '';

    void titleCard.offsetWidth; // force reflow so animation restarts
    titleCard.classList.add('cin-title-visible');

    const t = setTimeout(() => {
      if (this._resolveScene) {
        const resolve      = this._resolveScene;
        this._resolveScene = null;
        resolve();
      }
    }, scene.duration ?? 3000);
    this._sceneTimers.push(t);
  },

  // ── Image + caption scene ─────────────────────────────────────────────
  // Single image with optional Ken Burns slow zoom. Caption types out
  // character-by-character. Auto-advances after scene.duration ms.

  _playImageCaption(scene) {
    const imgTop     = document.getElementById('cin-img-top');
    const imageLayer = document.getElementById('cin-image-layer');
    const captionText = document.getElementById('cin-caption-text');

    this._applyImageAspectRatio(scene.image);
    imageLayer.style.display = '';
    imgTop.src               = scene.image || '';
    imgTop.style.opacity     = '1';

    if (scene.kenBurns) {
      imgTop.classList.remove('ken-burns');
      void imgTop.offsetWidth; // force reflow to restart animation
      imgTop.classList.add('ken-burns');
    }

    const fullCaption = scene.caption || '';
    const duration    = scene.duration ?? 5000;

    if (fullCaption.length > 0) {
      // Typewriter: spend up to 45% of scene duration typing the caption
      const charDelay = Math.max(20, Math.min(60, Math.floor(duration * 0.45 / fullCaption.length)));
      let charIndex = 0;
      this._typewriterInterval = setInterval(() => {
        if (charIndex >= fullCaption.length) {
          clearInterval(this._typewriterInterval);
          this._typewriterInterval = null;
          return;
        }
        captionText.textContent += fullCaption[charIndex];
        charIndex++;
      }, charDelay);
    }

    const t = setTimeout(() => {
      if (this._resolveScene) {
        const resolve      = this._resolveScene;
        this._resolveScene = null;
        resolve();
      }
    }, duration);
    this._sceneTimers.push(t);
  },
};
