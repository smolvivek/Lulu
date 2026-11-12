/* Lulu: six full-bleed scenes, one genre each, music from a hidden YouTube player.
   Data comes from data/lulu.json (built by scripts/build_data.py). */
(function () {
  'use strict';

  var WIDTHS = [900, 1600, 2560, 3840];
  var SIZES = 'max(100vw, 177.78vh)'; // image is 16:9 and covers the screen, so portrait phones render it wider than the viewport

  var $ = function (id) { return document.getElementById(id); };
  var framesEl = $('frames'), dotsEl = $('dots'), nowText = $('nowText'), nowEl = $('now');
  var scenes = [], frames = [], dots = [];
  var cur = -1, entered = false;
  var player = null, ready = false, wantPlay = false;
  var queue = [], qi = 0, errStreak = 0, ytFailed = false;

  function srcset(id) {
    return WIDTHS.map(function (w) { return 'img/' + id + '-' + w + '.webp ' + w + 'w'; }).join(', ');
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- scenes ---------- */
  function buildScenes() {
    scenes.forEach(function (s, i) {
      var img = document.createElement('img');
      img.className = 'frame';
      img.alt = s.name + '. ' + s.line;
      img.srcset = srcset(s.id);
      img.sizes = SIZES;
      img.src = 'img/' + s.id + '-1600.webp';
      img.decoding = 'async';
      img.draggable = false;
      img.style.objectPosition = s.focal + '% 50%';
      if (i === 0) img.fetchPriority = 'high';
      framesEl.appendChild(img);
      frames.push(img);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.title = s.name + ', ' + s.genre;
      b.setAttribute('aria-label', s.name + ', ' + s.genre);
      b.addEventListener('click', function () { setScene(i); });
      dotsEl.appendChild(b);
      dots.push(b);
    });
  }

  function setScene(i) {
    i = (i + scenes.length) % scenes.length;
    if (i === cur) return;
    cur = i;
    var s = scenes[i];
    frames.forEach(function (f, k) { f.classList.toggle('is-active', k === i); });
    dots.forEach(function (d, k) {
      if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    $('genre').textContent = s.genre;
    $('sceneName').textContent = s.name;
    $('sceneLine').textContent = s.line;
    try { history.replaceState(null, '', '#' + s.id); } catch (e) {}
    document.title = s.name + ' | Lulu';
    queue = shuffle(s.tracks); qi = 0; errStreak = 0;
    if (entered) playTrack(); else showNow(null);
  }

  /* ---------- music ---------- */
  function showNow(t) {
    if (ytFailed) { nowText.textContent = 'Music could not load. Check your connection and reload.'; return; }
    nowText.textContent = t ? t.artist + ': ' + t.title : '';
    nowEl.hidden = !t;
    if (t && 'mediaSession' in navigator && window.MediaMetadata) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title, artist: t.artist, album: 'Lulu, ' + scenes[cur].name,
          artwork: [{ src: 'img/' + scenes[cur].id + '-900.webp', sizes: '900x503', type: 'image/webp' }]
        });
      } catch (e) {}
    }
  }

  function playTrack() {
    var t = queue[qi];
    if (!t) return;
    showNow(t);
    if (ready) player.loadVideoById(t.yt);
    else wantPlay = true;
  }

  function nextTrack() {
    if (!queue.length) return;
    qi++;
    if (qi >= queue.length) { queue = shuffle(scenes[cur].tracks); qi = 0; }
    playTrack();
  }

  function setPlaying(on) {
    document.body.classList.toggle('playing', on);
    var b = $('playBtn');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }

  function togglePlay() {
    if (!ready) return;
    var st = player.getPlayerState();
    if (st === 1 || st === 3) player.pauseVideo();
    else if (st === 2) player.playVideo();
    else playTrack();
  }

  function onStateChange(e) {
    var st = e.data;
    if (st === 1) { setPlaying(true); errStreak = 0; }
    else if (st === 2) setPlaying(false);
    else if (st === 0) { setPlaying(false); nextTrack(); }
  }

  function onError() {
    errStreak++;
    if (errStreak >= queue.length) { // nothing in this scene will play
      nowText.textContent = 'This scene has no playable tracks right now.';
      setPlaying(false);
      return;
    }
    nextTrack();
  }

  function loadYT() {
    window.onYouTubeIframeAPIReady = function () {
      var vars = { playsinline: 1, controls: 0, disablekb: 1, rel: 0, fs: 0, iv_load_policy: 3 };
      if (/^https?:/.test(location.protocol)) vars.origin = location.origin;
      player = new YT.Player('yt', {
        width: '200', height: '200', playerVars: vars,
        events: {
          onReady: function () { ready = true; if (wantPlay) { wantPlay = false; playTrack(); } },
          onStateChange: onStateChange,
          onError: onError
        }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { ytFailed = true; showNow(null); nowEl.hidden = false; };
    document.head.appendChild(s);
  }

  /* ---------- enter, input ---------- */
  function enter() {
    if (entered) return;
    entered = true;
    document.body.classList.add('entered');
    playTrack(); // runs inside the click, so mobile browsers allow sound
    if (dots[cur]) dots[cur].focus({ preventScroll: true });
    poke();
    if ('mediaSession' in navigator) {
      var h = function (a, f) { try { navigator.mediaSession.setActionHandler(a, f); } catch (e) {} };
      h('play', togglePlay); h('pause', togglePlay); h('nexttrack', nextTrack);
    }
  }

  var idleTimer;
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    if (entered) idleTimer = setTimeout(function () { document.body.classList.add('idle'); }, 5000);
  }

  function bindInput() {
    $('enterBtn').addEventListener('click', enter);
    $('playBtn').addEventListener('click', togglePlay);
    $('nextBtn').addEventListener('click', nextTrack);

    document.addEventListener('keydown', function (e) {
      poke();
      if (!entered || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') { setScene(cur + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { setScene(cur - 1); e.preventDefault(); }
      else if (e.key === 'n' || e.key === 'N') nextTrack();
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { togglePlay(); e.preventDefault(); }
    });

    ['pointermove', 'pointerdown', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, poke, { passive: true });
    });

    var x0 = null, y0 = 0;
    $('stage').addEventListener('pointerdown', function (e) {
      if (!entered || e.target.closest('button')) { x0 = null; return; }
      x0 = e.clientX; y0 = e.clientY;
    });
    $('stage').addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) setScene(cur + (dx < 0 ? 1 : -1));
    });

    window.addEventListener('hashchange', function () {
      var i = indexFromHash();
      if (i >= 0) setScene(i);
    });
  }

  function indexFromHash() {
    var id = location.hash.replace('#', '');
    for (var i = 0; i < scenes.length; i++) if (scenes[i].id === id) return i;
    return -1;
  }

  /* ---------- start ---------- */
  fetch('data/lulu.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      scenes = data.scenes;
      buildScenes();
      bindInput();
      var start = indexFromHash();
      setScene(start >= 0 ? start : 0);
      loadYT();
    })
    .catch(function () {
      nowEl.hidden = false;
      nowText.textContent = 'Could not load the scenes. Reload to try again.';
    });
})();
