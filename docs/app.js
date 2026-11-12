/* Lulu: six full-bleed scenes, one genre each, music from a YouTube player.
   Data comes from data/lulu.json (built by scripts/build_data.py). */
(function () {
  'use strict';

  var WIDTHS = [900, 1600, 2560, 3840];
  var SIZES = '(max-aspect-ratio: 1/1) 100vw, max(100vw, 177.78vh)'; // 16:9 image covering the screen: portrait phones render it wider than the viewport

  var $ = function (id) { return document.getElementById(id); };
  var framesEl = $('frames'), nowText = $('nowText'), nowEl = $('now');
  var seekEl = $('seek'), volEl = $('vol');
  var scenes = [], frames = [];
  var cur = -1, entered = false;
  var player = null, ready = false, wantPlay = false, apiReady = false, dataReady = false;
  var queue = [], qi = 0, errStreak = 0, ytFailed = false, loadedId = null;
  var seeking = false, volume = 80, muted = false;

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
  // liked songs (flag 1) surface about one pick in three; the rest of the catalogue fills in between
  function mix(tracks) {
    var liked = shuffle(tracks.filter(function (t) { return t.like; }));
    var rest = shuffle(tracks.filter(function (t) { return !t.like; }));
    var out = [], a = 0, b = 0;
    while (a < liked.length || b < rest.length) {
      if (a < liked.length && (b >= rest.length || out.length % 3 === 0)) out.push(liked[a++]);
      else out.push(rest[b++]);
    }
    return out;
  }
  // each scene's full catalogue is a separate file, fetched when the scene opens
  function loadFull(i) {
    var sc = scenes[i];
    if (sc.fullP) return sc.fullP;
    sc.fullP = fetch('data/' + sc.id + '.json')
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var seen = {}, all = [];
        sc.tracks.forEach(function (t) { t.like = 1; seen[t.yt] = 1; all.push(t); });
        rows.forEach(function (r) {
          if (seen[r[0]]) return;
          seen[r[0]] = 1;
          all.push({ yt: r[0], title: r[1], artist: r[2], like: r[3] });
        });
        sc.tracks = all; sc.full = true;
        if (cur === i && queue.length) {
          var played = queue.slice(0, qi + 1), used = {};
          played.forEach(function (t) { used[t.yt] = 1; });
          queue = played.concat(mix(all.filter(function (t) { return !used[t.yt]; })));
        }
      })
      .catch(function () { sc.fullP = null; });
    return sc.fullP;
  }
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function setFill(el) {
    var p = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--p', p + '%');
  }

  /* ---------- scenes ---------- */
  function buildScenes(first) {
    scenes.forEach(function (s, i) {
      var box = document.createElement('div');
      box.className = 'frame';
      var bg = document.createElement('img');
      bg.className = 'bg';
      bg.alt = '';
      bg.setAttribute('aria-hidden', 'true');
      bg.src = 'img/' + s.id + '-900.webp';
      bg.decoding = 'async';
      var img = document.createElement('img');
      img.className = 'fg';
      img.alt = s.name + ', ' + s.genre;
      img.srcset = srcset(s.id);
      img.sizes = SIZES;
      img.src = 'img/' + s.id + '-1600.webp';
      img.decoding = 'async';
      img.draggable = false;
      box.style.setProperty('--fx', s.focal + '%');
      if (i === first) img.fetchPriority = 'high';
      box.appendChild(bg);
      box.appendChild(img);
      framesEl.appendChild(box);
      frames.push(box);

    });
  }

  function setScene(i) {
    i = (i + scenes.length) % scenes.length;
    if (i === cur) return;
    cur = i;
    var s = scenes[i];
    frames.forEach(function (f, k) { f.classList.toggle('is-active', k === i); });
    document.title = 'Lulu - ' + s.genre;
    queue = mix(s.tracks); qi = 0; errStreak = 0;
    showNow(queue[0]);
    loadFull(i);
    if (entered) loadCurrent(true);
    else if (ready) cueCurrent();
  }

  /* ---------- music ---------- */
  function showNow(t) {
    if (ytFailed) { nowText.textContent = 'Music could not load. Check your connection and reload.'; nowEl.hidden = false; return; }
    nowText.textContent = t ? t.artist + ': ' + t.title : '';
    nowEl.hidden = !t;
    if (!t) return;
    $('ytLink').href = 'https://www.youtube.com/watch?v=' + t.yt;
    if ('mediaSession' in navigator && window.MediaMetadata && scenes[cur]) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title, artist: t.artist, album: 'Lulu, ' + scenes[cur].genre,
          artwork: [{ src: 'img/' + scenes[cur].id + '-900.webp', sizes: '900x563', type: 'image/webp' }]
        });
      } catch (e) {}
    }
  }

  function resetSeek() {
    seekEl.value = 0; setFill(seekEl);
    $('tCur').textContent = '0:00'; $('tDur').textContent = '0:00';
    $('ring').style.strokeDashoffset = '103.7';
  }

  function cueCurrent() {
    var t = queue[qi];
    if (!t || !ready || loadedId === t.yt) return;
    loadedId = t.yt;
    player.cueVideoById(t.yt);
    resetSeek();
  }

  // play whatever is current; call inside a click when possible
  function loadCurrent(force) {
    var t = queue[qi];
    if (!t) return;
    showNow(t);
    armStall();
    if (!ready) { wantPlay = true; return; }
    if (!force && loadedId === t.yt) { player.playVideo(); return; }
    loadedId = t.yt;
    resetSeek();
    player.loadVideoById(t.yt);
  }

  // If sound hasn't started a few seconds after a play request, reveal the real
  // YouTube player: whatever it is waiting on (ad, prompt, autoplay block) becomes visible and clickable.
  var stallTimer = null, autoVideo = false;
  function setVideo(on) {
    document.body.classList.toggle('video', on);
    var b = $('vidBtn');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Hide video' : 'Show video');
    b.title = on ? 'Hide video' : 'Show video';
  }
  function armStall() {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(function () {
      if (document.body.classList.contains('playing') || ytFailed) return;
      if (!document.body.classList.contains('video')) { autoVideo = true; setVideo(true); }
      nowText.textContent = 'Starting. If nothing plays, press play on the video.';
      nowEl.hidden = false;
    }, 4000);
  }

  function nextTrack() {
    if (!queue.length) return;
    qi++;
    if (qi >= queue.length) { queue = mix(scenes[cur].tracks); qi = 0; }
    loadCurrent(true);
  }

  function prevTrack() {
    if (!queue.length) return;
    if (ready && player.getCurrentTime() > 3) { player.seekTo(0, true); return; }
    if (qi > 0) qi--;
    loadCurrent(true);
  }

  function setPlaying(on) {
    document.body.classList.toggle('playing', on);
    var b = $('playBtn');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }

  function togglePlay() {
    if (!ready) { wantPlay = true; return; }
    var st = player.getPlayerState();
    if (st === 1 || st === 3) player.pauseVideo();
    else loadCurrent(false);
  }

  function onStateChange(e) {
    var st = e.data;
    if (st === 1) {
      setPlaying(true); errStreak = 0; applyVolume();
      clearTimeout(stallTimer);
      if (autoVideo) { autoVideo = false; setVideo(false); }
      if (queue[qi]) showNow(queue[qi]);
    }
    else if (st === 2 || st === 5 || st === -1) setPlaying(false);
    else if (st === 0) { setPlaying(false); nextTrack(); }
  }

  function onError() {
    errStreak++;
    if (errStreak >= queue.length) {
      nowText.textContent = 'This scene has no playable tracks right now.';
      setPlaying(false);
      return;
    }
    nextTrack();
  }

  /* progress */
  setInterval(function () {
    if (!ready || seeking) return;
    var d = player.getDuration ? player.getDuration() : 0;
    if (!d) return;
    var c = player.getCurrentTime();
    seekEl.value = Math.round(c / d * 1000); setFill(seekEl);
    $('tCur').textContent = fmt(c);
    $('tDur').textContent = fmt(d);
    $('ring').style.strokeDashoffset = String(103.7 * (1 - c / d));
  }, 400);

  /* volume */
  function applyVolume() {
    if (!ready) return;
    player.setVolume(volume);
    if (muted || volume === 0) player.mute(); else player.unMute();
  }
  function renderVolume() {
    volEl.value = volume; setFill(volEl);
    document.body.classList.toggle('muted', muted || volume === 0);
    $('muteBtn').setAttribute('aria-label', (muted || volume === 0) ? 'Unmute' : 'Mute');
    try { localStorage.setItem('lulu-vol', JSON.stringify({ v: volume, m: muted })); } catch (e) {}
  }

  /* ---------- YouTube ---------- */
  function maybeCreatePlayer() {
    if (!apiReady || !dataReady || player) return;
    var first = queue[qi];
    var vars = { playsinline: 1, controls: 1, rel: 0, fs: 0, iv_load_policy: 3, modestbranding: 1 };
    if (/^https?:/.test(location.protocol)) vars.origin = location.origin;
    var cfg = {
      width: '200', height: '200', playerVars: vars,
      events: {
        onReady: function () {
          ready = true;
          applyVolume();
          if (wantPlay) { wantPlay = false; loadCurrent(false); } else cueCurrent();
        },
        onStateChange: onStateChange,
        onError: onError
      }
    };
    if (first) { cfg.videoId = first.yt; loadedId = first.yt; }
    player = new YT.Player('yt', cfg);
  }

  function loadYT() {
    window.onYouTubeIframeAPIReady = function () { apiReady = true; maybeCreatePlayer(); };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = function () { ytFailed = true; showNow(null); };
    document.head.appendChild(s);
  }

  /* ---------- enter, input ---------- */
  function enter() {
    if (entered) return;
    entered = true;
    document.body.classList.add('entered');
    loadCurrent(false); // inside the click, so browsers allow sound
    poke();
    if ('mediaSession' in navigator) {
      var h = function (a, f) { try { navigator.mediaSession.setActionHandler(a, f); } catch (e) {} };
      h('play', togglePlay); h('pause', togglePlay); h('nexttrack', nextTrack); h('previoustrack', prevTrack);
    }
  }

  var idleTimer;
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    if (entered) idleTimer = setTimeout(function () {
      if (!document.body.classList.contains('video') && !$('dock').classList.contains('open')) document.body.classList.add('idle');
    }, 3000);
  }

  function toggleMore(force) {
    var open = typeof force === 'boolean' ? force : !$('dock').classList.contains('open');
    $('dock').classList.toggle('open', open);
    $('moreBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
    poke();
  }

  function toggleVideo() {
    autoVideo = false;
    setVideo(!document.body.classList.contains('video'));
  }

  function bindInput() {
    $('enterBtn').addEventListener('click', enter);
    $('playBtn').addEventListener('click', togglePlay);
    $('nextBtn').addEventListener('click', nextTrack);
    $('prevBtn').addEventListener('click', prevTrack);
    $('prevScene').addEventListener('click', function () { setScene(cur - 1); });
    $('nextScene').addEventListener('click', function () { setScene(cur + 1); });
    $('vidBtn').addEventListener('click', toggleVideo);
    $('moreBtn').addEventListener('click', function () { toggleMore(); });

    seekEl.addEventListener('input', function () {
      seeking = true; setFill(seekEl);
      if (ready) $('tCur').textContent = fmt(player.getDuration() * seekEl.value / 1000);
    });
    seekEl.addEventListener('change', function () {
      if (ready) player.seekTo(player.getDuration() * seekEl.value / 1000, true);
      seeking = false;
    });

    volEl.addEventListener('input', function () {
      volume = +volEl.value; if (volume > 0) muted = false;
      renderVolume(); applyVolume();
    });
    $('muteBtn').addEventListener('click', function () {
      if (volume === 0) { volume = 60; muted = false; } else muted = !muted;
      renderVolume(); applyVolume();
    });

    document.addEventListener('keydown', function (e) {
      poke();
      if (e.key === 'Escape') toggleMore(false);
      if (!entered || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') { setScene(cur + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { setScene(cur - 1); e.preventDefault(); }
      else if (e.key === 'n' || e.key === 'N') nextTrack();
      else if (e.key === 'p' || e.key === 'P') prevTrack();
      else if (e.key === 'm' || e.key === 'M') $('muteBtn').click();
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { togglePlay(); e.preventDefault(); }
    });

    ['pointermove', 'pointerdown', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, poke, { passive: true });
    });

    var x0 = null, y0 = 0;
    $('stage').addEventListener('pointerdown', function (e) {
      if (!entered || e.target.closest('button, input, a, .yt-host, .more')) { x0 = null; return; }
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
  // the day, by local hour: morning kitchen, rain, ledge, paan tapri, sunset on Marine Drive, night
  function sceneForNow() {
    var h = new Date().getHours(), id;
    if (h >= 5 && h < 10) id = 'kitchen';
    else if (h >= 10 && h < 13) id = 'rain';
    else if (h >= 13 && h < 16) id = 'ledge';
    else if (h >= 16 && h < 18) id = 'paan';
    else if (h >= 18 && h < 20) id = 'marine';
    else id = 'night';
    for (var i = 0; i < scenes.length; i++) if (scenes[i].id === id) return i;
    return 0;
  }

  try {
    var sv = JSON.parse(localStorage.getItem('lulu-vol') || 'null');
    if (sv) { volume = Math.min(100, Math.max(0, +sv.v)); muted = !!sv.m; }
  } catch (e) {}
  renderVolume();
  loadYT(); // start the player script right away, in parallel with the data

  fetch('data/lulu.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      scenes = data.scenes;
      var start = indexFromHash();
      if (start < 0) start = sceneForNow();
      buildScenes(start);
      bindInput();
      setScene(start);
      dataReady = true;
      maybeCreatePlayer();
    })
    .catch(function () {
      nowEl.hidden = false;
      nowText.textContent = 'Could not load the scenes. Reload to try again.';
    });
})();
