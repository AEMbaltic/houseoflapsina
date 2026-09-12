/* House of Lapsina — a small walkable gallery.
 *
 * The house is a tile map. Paintings hang on the front-facing walls; walk up
 * to one and press space to look at it properly.
 */
(function () {
  'use strict';

  const TILE = 16;
  let VIEW_W = 384;   // the visible window into the house, in world pixels
  let VIEW_H = 216;   // (recalculated to suit the screen — see resize)
  const MAP_W = 48;
  const MAP_H = 34;

  const SOLID = 0;
  const FLOOR = 1;
  const HALL = 2;

  const SPEED = 64;          // pixels per second
  const STORE_KEY = 'lapsina:seen';

  // ---------------------------------------------------------------- the house

  const ROOMS = [
    { key: 'entrance', name: 'Entrance Hall',      x: 17, y: 24, w: 14, h: 8 },
    { key: 'grand',    name: 'The Long Room',      x: 10, y: 13, w: 28, h: 9 },
    { key: 'north',    name: 'North Gallery',      x: 18, y: 3,  w: 12, h: 7 },
    { key: 'west',     name: 'West Wing',          x: 2,  y: 4,  w: 12, h: 7 },
    { key: 'east',     name: 'East Wing',          x: 34, y: 4,  w: 12, h: 7 }
  ];

  const CORRIDORS = [
    { x: 23, y: 22, w: 2, h: 2 },  // entrance hall  -> long room
    { x: 11, y: 11, w: 2, h: 2 },  // long room      -> west wing
    { x: 36, y: 11, w: 2, h: 2 },  // long room      -> east wing
    { x: 23, y: 10, w: 2, h: 3 }   // long room      -> north gallery
  ];

  // benches sit clear of the doorways, so nothing blocks the way through
  const BENCHES = [[16, 18], [27, 18], [33, 18], [20, 29]];
  const PLANTS = [
    [11, 20], [36, 20], [18, 30], [29, 30],
    [3, 9], [12, 9], [35, 9], [44, 9], [19, 8], [28, 8]
  ];

  const grid = new Uint8Array(MAP_W * MAP_H); // all SOLID to begin with

  function at(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return SOLID;
    return grid[y * MAP_W + x];
  }
  function isFloor(x, y) { return at(x, y) !== SOLID; }
  function isSolid(x, y) { return at(x, y) === SOLID; }

  function carve(rect, kind) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) grid[y * MAP_W + x] = kind;
      }
    }
  }

  ROOMS.forEach(function (r) { carve(r, FLOOR); });
  CORRIDORS.forEach(function (c) { carve(c, HALL); });

  // Solid furniture, as pixel rectangles.
  const blockers = [];
  BENCHES.forEach(function (b) {
    blockers.push({ x: b[0] * TILE - 7, y: b[1] * TILE + 2, w: 30, h: 12 });
  });
  PLANTS.forEach(function (p) {
    blockers.push({ x: p[0] * TILE + 2, y: p[1] * TILE + 6, w: 12, h: 9 });
  });

  // ------------------------------------------------------------ hanging plan

  // A slot is two wall tiles with floor below and more wall above.
  function slotsFor(room) {
    const row = room.y - 1;
    const out = [];
    for (let x = room.x + 1; x + 1 <= room.x + room.w - 2; x += 4) {
      const ok =
        isSolid(x, row) && isSolid(x + 1, row) &&
        isSolid(x, row - 1) && isSolid(x + 1, row - 1) &&
        isFloor(x, row + 1) && isFloor(x + 1, row + 1);
      if (ok) out.push({ tx: x, ty: row, room: room });
    }
    return out;
  }

  const pools = ROOMS.map(slotsFor);
  const hung = [];

  function hang(slot, art) {
    slot.art = art;
    slot.cx = slot.tx * TILE + TILE;             // centre of the frame
    slot.cy = slot.ty * TILE - 6;                // hung high, above her head
    slot.floorY = (slot.ty + 1) * TILE;          // top of the floor in front
    hung.push(slot);
  }

  // A work can ask for a room of its own (art.room); it gets first refusal on
  // that room's walls. Everything else goes round the rooms in turn, so no
  // room is left bare.
  const waiting = [];
  window.ARTWORKS.forEach(function (art) {
    const p = art.room ? ROOMS.findIndex(function (r) { return r.key === art.room; }) : -1;
    if (p >= 0 && pools[p].length) hang(pools[p].shift(), art);
    else waiting.push(art);
  });
  for (let i = 0, p = 0; i < waiting.length; p++) {
    if (pools.every(function (q) { return !q.length; })) break;
    const pool = pools[p % pools.length];
    if (pool.length) hang(pool.shift(), waiting[i++]);
  }
  hung.sort(function (a, b) { return a.art.id - b.art.id; });

  // ------------------------------------------------------------------ canvas

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function offscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // ------------------------------------------------------- bake the interior

  const world = offscreen(MAP_W * TILE, MAP_H * TILE);
  const wctx = world.getContext('2d');

  function rnd(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function bakeFloor() {
    const r = rnd(20240817);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = at(x, y);
        if (t === SOLID) continue;
        const px = x * TILE, py = y * TILE;
        const checker = (x + y) % 2 === 0;
        let base = t === HALL ? (checker ? '#b6a894' : '#b0a28e')
                              : (checker ? '#c9bda9' : '#c3b6a1');
        wctx.fillStyle = base;
        wctx.fillRect(px, py, TILE, TILE);
        // grout
        wctx.fillStyle = 'rgba(90,74,60,0.18)';
        wctx.fillRect(px, py + TILE - 1, TILE, 1);
        wctx.fillRect(px + TILE - 1, py, 1, TILE);
        // a little stone speckle
        wctx.fillStyle = 'rgba(255,255,255,0.14)';
        for (let i = 0; i < 3; i++) wctx.fillRect(px + (r() * TILE | 0), py + (r() * TILE | 0), 1, 1);
        wctx.fillStyle = 'rgba(60,45,35,0.10)';
        for (let i = 0; i < 2; i++) wctx.fillRect(px + (r() * TILE | 0), py + (r() * TILE | 0), 1, 1);
      }
    }
  }

  function bakeRug(x, y, w, h) {
    wctx.fillStyle = '#7c3346';
    wctx.fillRect(x, y, w, h);
    wctx.fillStyle = '#934054';
    wctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    wctx.fillStyle = '#c9a961';
    wctx.fillRect(x + 4, y + 4, w - 8, 1);
    wctx.fillRect(x + 4, y + h - 5, w - 8, 1);
    wctx.fillStyle = 'rgba(0,0,0,0.10)';
    wctx.fillRect(x, y, w, 1);
  }

  function bakeWalls() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!isSolid(x, y)) continue;
        const px = x * TILE, py = y * TILE;
        const front = isFloor(x, y + 1);
        const upper = !front && isSolid(x, y + 1) && isFloor(x, y + 2);

        if (front) {
          const g = wctx.createLinearGradient(0, py, 0, py + TILE);
          g.addColorStop(0, '#453a52');
          g.addColorStop(1, '#332b3e');
          wctx.fillStyle = g;
          wctx.fillRect(px, py, TILE, TILE);
          wctx.fillStyle = '#241e2c';          // skirting board
          wctx.fillRect(px, py + TILE - 3, TILE, 3);
          wctx.fillStyle = 'rgba(255,255,255,0.06)';
          wctx.fillRect(px, py + TILE - 4, TILE, 1);
        } else if (upper) {
          const g = wctx.createLinearGradient(0, py, 0, py + TILE);
          g.addColorStop(0, '#514463');
          g.addColorStop(1, '#453a52');
          wctx.fillStyle = g;
          wctx.fillRect(px, py, TILE, TILE);
          wctx.fillStyle = '#6a5980';          // cornice
          wctx.fillRect(px, py, TILE, 1);
          wctx.fillStyle = 'rgba(0,0,0,0.12)';
          wctx.fillRect(px, py + 1, TILE, 1);
        } else {
          wctx.fillStyle = '#1d1926';
          wctx.fillRect(px, py, TILE, TILE);
          if (isFloor(x - 1, y) || isFloor(x + 1, y)) {
            wctx.fillStyle = '#2a2436';
            wctx.fillRect(px, py, TILE, TILE);
            wctx.fillStyle = 'rgba(0,0,0,0.25)';
            wctx.fillRect(px + (isFloor(x - 1, y) ? 0 : TILE - 2), py, 2, TILE);
          }
        }
      }
    }
  }

  function bakeLight(slot) {
    const g = wctx.createRadialGradient(slot.cx, slot.floorY - 2, 2, slot.cx, slot.floorY - 2, 34);
    g.addColorStop(0, 'rgba(255,226,168,0.30)');
    g.addColorStop(0.55, 'rgba(255,226,168,0.12)');
    g.addColorStop(1, 'rgba(255,226,168,0)');
    wctx.fillStyle = g;
    wctx.fillRect(slot.cx - 36, slot.floorY - 8, 72, 44);
  }

  function frameSize(art) {
    const a = art.aspect[0] / art.aspect[1];
    if (a > 1.2) return [26, Math.round(22 / a) + 2];   // landscape
    if (a < 0.85) return [Math.round(24 * a) + 2, 26];  // portrait
    return [22, 22];                                    // square
  }

  function bakeFrame(slot) {
    const size = frameSize(slot.art);
    const fw = size[0], fh = size[1];
    const x = Math.round(slot.cx - fw / 2);
    const y = Math.round(slot.cy - fh / 2);

    wctx.fillStyle = 'rgba(0,0,0,0.35)';         // shadow on the wall
    wctx.fillRect(x + 1, y + 2, fw, fh);

    let inset = 3;
    if (slot.art.framed) {
      // the photograph has the painting's own frame in it: no second frame
      wctx.fillStyle = '#1a1420';
      wctx.fillRect(x, y, fw, fh);
      inset = 1;
    } else {
      wctx.fillStyle = '#c9a961';                // gilt frame
      wctx.fillRect(x, y, fw, fh);
      wctx.fillStyle = '#8a6f38';
      wctx.fillRect(x, y + fh - 1, fw, 1);
      wctx.fillRect(x + fw - 1, y, 1, fh);
      wctx.fillStyle = '#efe6d6';                // mount board
      wctx.fillRect(x + 2, y + 2, fw - 4, fh - 4);
    }

    const iw = fw - inset * 2, ih = fh - inset * 2;
    const art = offscreen(iw, ih);
    slot.art.render(art.getContext('2d'), iw, ih);
    wctx.drawImage(art, x + inset, y + inset);

    // little brass plaque, where there is room for one
    const plaqueY = y + fh + 2;
    if (plaqueY < slot.ty * TILE + TILE - 4) {
      wctx.fillStyle = '#b9a06a';
      wctx.fillRect(slot.cx - 3, plaqueY, 6, 2);
    }
    slot.frame = { x: x, y: y, w: fw, h: fh };
  }

  // Daylight falling through the roof lantern over the long room.
  function bakeSkylight(x, y, w, h) {
    const g = wctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255,246,222,0.30)');
    g.addColorStop(1, 'rgba(255,246,222,0.05)');
    wctx.fillStyle = g;
    wctx.fillRect(x, y, w, h);
    wctx.fillStyle = 'rgba(120,100,80,0.10)';
    for (let i = 1; i < 5; i++) wctx.fillRect(x + (w / 5) * i - 1, y, 2, h);
  }

  // An inlaid circle in the middle of the north gallery.
  function bakeMedallion(cx, cy, r) {
    wctx.save();
    wctx.strokeStyle = 'rgba(120,95,70,0.35)';
    wctx.lineWidth = 2;
    wctx.beginPath();
    wctx.arc(cx, cy, r, 0, Math.PI * 2);
    wctx.stroke();
    wctx.strokeStyle = 'rgba(120,95,70,0.22)';
    wctx.lineWidth = 1;
    wctx.beginPath();
    wctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    wctx.stroke();
    wctx.fillStyle = 'rgba(201,169,97,0.18)';
    wctx.beginPath();
    wctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
    wctx.fill();
    wctx.restore();
  }

  bakeFloor();
  bakeRug(21 * TILE, 27 * TILE + 4, 7 * TILE, 3 * TILE + 8);          // entrance
  bakeRug(13 * TILE, 19 * TILE + 6, 22 * TILE, TILE + 4);             // long room runner
  bakeSkylight(13 * TILE, 13 * TILE, 22 * TILE, 5 * TILE);            // long room
  bakeMedallion(24 * TILE, 6 * TILE + 8, 42);                          // north gallery
  hung.forEach(bakeLight);
  bakeWalls();
  hung.forEach(bakeFrame);

  // vignette, re-baked whenever the view changes size
  let vignette = offscreen(1, 1);
  function bakeVignette() {
    vignette = offscreen(VIEW_W, VIEW_H);
    const c = vignette.getContext('2d');
    const rad = Math.max(VIEW_W, VIEW_H);
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, rad * 0.2, VIEW_W / 2, VIEW_H / 2, rad * 0.62);
    g.addColorStop(0, 'rgba(8,6,12,0)');
    g.addColorStop(1, 'rgba(8,6,12,0.55)');
    c.fillStyle = g;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // ---------------------------------------------------------------- entities

  function drawBench(c, tx, ty) {
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE - 2;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(x, y + 1, 16, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6a4f33';
    c.fillRect(x - 12, y - 6, 3, 6);
    c.fillRect(x + 9, y - 6, 3, 6);
    c.fillStyle = '#96754c';
    c.fillRect(x - 15, y - 10, 30, 4);
    c.fillStyle = '#7c5f3d';
    c.fillRect(x - 15, y - 7, 30, 1);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(x - 15, y - 10, 30, 1);
  }

  function drawPlant(c, tx, ty) {
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE - 1;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(x, y, 7, 2.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#9d5c42';
    c.beginPath();
    c.moveTo(x - 5, y - 8);
    c.lineTo(x + 5, y - 8);
    c.lineTo(x + 3.5, y);
    c.lineTo(x - 3.5, y);
    c.closePath();
    c.fill();
    c.fillStyle = '#b06c4d';
    c.fillRect(x - 5, y - 9, 10, 2);
    const leaves = [[-5, -13, 4, 3], [1, -14, 4, 3], [-3, -17, 3.5, 3], [2, -11, 4, 2.5], [-1, -19, 3, 2.5]];
    leaves.forEach(function (l, i) {
      c.fillStyle = i % 2 ? '#3f7a4a' : '#4f9a58';
      c.beginPath();
      c.ellipse(x + l[0], y + l[1], l[2], l[3], i * 0.6, 0, Math.PI * 2);
      c.fill();
    });
  }

  // ------------------------------------------------------------------ player

  const player = {
    x: 26 * TILE + TILE,     // in the entrance hall, facing the far wall
    y: 31 * TILE + 12,
    dir: 'up',
    frame: 0,
    anim: 0,
    moving: false
  };

  function blocked(x, y) {
    // feet box
    const half = 4, top = 6;
    const x0 = x - half, x1 = x + half - 0.01;
    const y0 = y - top, y1 = y - 0.01;
    for (let ty = Math.floor(y0 / TILE); ty <= Math.floor(y1 / TILE); ty++) {
      for (let tx = Math.floor(x0 / TILE); tx <= Math.floor(x1 / TILE); tx++) {
        if (isSolid(tx, ty)) return true;
      }
    }
    for (let i = 0; i < blockers.length; i++) {
      const b = blockers[i];
      if (x1 > b.x && x0 < b.x + b.w && y1 > b.y && y0 < b.y + b.h) return true;
    }
    return false;
  }

  function move(dx, dy) {
    if (dx && !blocked(player.x + dx, player.y)) player.x += dx;
    if (dy && !blocked(player.x, player.y + dy)) player.y += dy;
  }

  // ------------------------------------------------------------------- input

  const keys = Object.create(null);
  const pad = { up: false, down: false, left: false, right: false };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right'
  };

  addEventListener('keydown', function (e) {
    if (window.__boot) return;              // the title card has the keyboard
    if (e.repeat && !viewerOpen) return;
    const dir = KEYMAP[e.code];

    if (viewerOpen) {
      if (e.code === 'Escape') { closeViewer(); e.preventDefault(); }
      else if (dir === 'left') { step(-1); e.preventDefault(); }
      else if (dir === 'right') { step(1); e.preventDefault(); }
      else if (e.code === 'Space' || e.code === 'Enter') { closeViewer(); e.preventDefault(); }
      else if (dir) e.preventDefault();
      return;
    }
    if (helpOpen) {
      if (e.code === 'Escape' || e.code === 'KeyH') { toggleHelp(false); e.preventDefault(); }
      return;
    }

    if (dir) { keys[dir] = true; e.preventDefault(); }
    else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      if (nearest) openViewer(nearest.art.id);
      e.preventDefault();
    } else if (e.code === 'KeyM') { setSound(!soundOn); }
    else if (e.code === 'KeyH') { toggleHelp(true); }
  });

  addEventListener('keyup', function (e) {
    const dir = KEYMAP[e.code];
    if (dir) keys[dir] = false;
  });

  addEventListener('blur', function () {
    for (const k in keys) keys[k] = false;
    pad.up = pad.down = pad.left = pad.right = false;
  });

  // touch d-pad
  document.querySelectorAll('.pad').forEach(function (btn) {
    const dir = btn.dataset.dir;
    const on = function (e) { e.preventDefault(); pad[dir] = true; };
    const off = function (e) { e.preventDefault(); pad[dir] = false; };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  });
  document.getElementById('actBtn').addEventListener('click', function () {
    if (nearest) openViewer(nearest.art.id);
  });

  // long-press on a control should do nothing at all
  [document.getElementById('touch'), canvas].forEach(function (el) {
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  if (matchMedia('(pointer: coarse)').matches) {
    document.body.classList.add('touch');
    document.getElementById('prompt').innerHTML = 'press <span class="key">LOOK</span>';
  }

  // ------------------------------------------------------------------- sound

  let audio = null;
  let soundOn = false;
  const soundBtn = document.getElementById('soundBtn');

  function setSound(on) {
    soundOn = on;
    soundBtn.textContent = on ? '♪ on' : '♪ off';
    soundBtn.setAttribute('aria-pressed', String(on));
    if (on && !audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    }
    if (on && audio && audio.state === 'suspended') audio.resume();
  }
  soundBtn.addEventListener('click', function () { setSound(!soundOn); });

  function chime(freq, len, gainPeak) {
    if (!soundOn || !audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainPeak, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + len + 0.02);
  }

  // ------------------------------------------------------------------ viewer

  const viewer = document.getElementById('viewer');
  const artCanvas = document.getElementById('artCanvas');
  const els = {
    no: document.getElementById('artNo'),
    title: document.getElementById('artTitle'),
    artist: document.getElementById('artArtist'),
    year: document.getElementById('artYear'),
    medium: document.getElementById('artMedium'),
    note: document.getElementById('artNote'),
    matte: document.querySelector('#viewer .matte'),
    dot: document.getElementById('artDot'),
    room: document.getElementById('roomName'),
    seen: document.getElementById('seenCount'),
    total: document.getElementById('totalCount'),
    prompt: document.getElementById('prompt')
  };

  let viewerOpen = false;
  let helpOpen = false;
  let current = 0;
  let nearest = null;

  const seen = new Set(load());

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify([...seen])); } catch (err) { /* private mode */ }
  }

  els.total.textContent = String(hung.length);
  els.seen.textContent = String(seen.size);

  function paintViewer(art) {
    const box = viewer.querySelector('.viewer-art');
    const maxW = Math.min(560, box.clientWidth - 90, window.innerWidth - 140);
    const maxH = window.innerHeight - 220;
    const ratio = art.aspect[0] / art.aspect[1];
    let w = Math.max(180, maxW);
    let h = w / ratio;
    if (h > maxH && maxH > 160) { h = maxH; w = h * ratio; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    artCanvas.width = Math.round(w * dpr);
    artCanvas.height = Math.round(h * dpr);
    artCanvas.style.width = Math.round(w) + 'px';
    artCanvas.style.height = Math.round(h) + 'px';
    const c = artCanvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    art.render(c, w, h);
  }

  function show(id) {
    const art = window.ARTWORKS[id];
    current = id;
    els.no.textContent = 'No. ' + art.no;
    els.title.textContent = art.title;
    els.artist.textContent = art.artist;
    els.year.textContent = art.year;
    els.medium.textContent = art.medium;
    els.medium.hidden = !art.medium;
    els.matte.classList.toggle('bare', !!art.framed);
    els.artist.hidden = !art.artist;          // a work need not carry either
    els.dot.hidden = !art.artist;
    els.note.textContent = art.note || '';
    els.note.hidden = !art.note;
    paintViewer(art);
    if (!seen.has(id)) {
      seen.add(id);
      save();
      els.seen.textContent = String(seen.size);
      if (seen.size === hung.length) toast('Every painting seen. Lapsina is very pleased.');
    }
  }

  function openViewer(id) {
    viewerOpen = true;
    viewer.hidden = false;
    for (const k in keys) keys[k] = false;
    show(id);
    chime(880, 0.5, 0.08);
    setTimeout(function () { chime(1320, 0.6, 0.05); }, 90);
  }

  function closeViewer() {
    viewerOpen = false;
    viewer.hidden = true;
  }

  function step(delta) {
    const n = window.ARTWORKS.length;
    show((current + delta + n) % n);
    chime(660, 0.25, 0.04);
  }

  document.getElementById('closeBtn').addEventListener('click', closeViewer);
  document.getElementById('prevBtn').addEventListener('click', function () { step(-1); });
  document.getElementById('nextBtn').addEventListener('click', function () { step(1); });
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });

  // help card
  const help = document.getElementById('help');
  function toggleHelp(on) {
    helpOpen = on;
    help.hidden = !on;
  }
  document.getElementById('helpBtn').addEventListener('click', function () { toggleHelp(true); });
  document.getElementById('helpClose').addEventListener('click', function () { toggleHelp(false); });
  help.addEventListener('click', function (e) { if (e.target === help) toggleHelp(false); });

  // one-off message
  let toastEl = null;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'toast';
      toastEl.style.cssText =
        'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:20;' +
        'background:rgba(20,15,26,0.95);border:1px solid #e0b25f;color:#f4ece0;' +
        'padding:10px 16px;border-radius:8px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.5)';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.style.opacity = '1';
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { toastEl.style.opacity = '0'; toastEl.style.transition = 'opacity .6s'; }, 3600);
  }

  // --------------------------------------------------------------- presentation

  let scale = 3;
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function resize() {
    const touch = document.body.classList.contains('touch');
    const availW = window.innerWidth - 26;
    const availH = window.innerHeight - (touch ? 250 : 96);

    if (touch) {
      scale = availW > 760 ? 3 : 2;
    } else {
      scale = clamp(Math.floor(availW / 340), 1, 4);
      while (scale > 1 && availH / scale < 180) scale--;
    }

    // an even number of world pixels keeps the tile grid tidy
    VIEW_W = clamp(Math.round(availW / scale / 2) * 2, 176, 496);
    VIEW_H = clamp(Math.round(availH / scale / 2) * 2, 128, 320);

    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    canvas.style.width = VIEW_W * scale + 'px';
    canvas.style.height = VIEW_H * scale + 'px';
    ctx.imageSmoothingEnabled = false;
    bakeVignette();
    if (viewerOpen) paintViewer(window.ARTWORKS[current]);
  }
  addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- main loop

  const cam = { x: 0, y: 0 };
  let last = performance.now();

  // Rooms plus the corridors between them: whichever one she stands in is the
  // one that stays lit.
  const REGIONS = ROOMS.concat(CORRIDORS);

  function regionAt(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    for (let i = 0; i < REGIONS.length; i++) {
      const r = REGIONS[i];
      if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r;
    }
    return null;
  }

  function litFor(region) {
    return {
      x: (region.x - 1) * TILE,
      y: (region.y - 2) * TILE,
      w: (region.w + 2) * TILE,
      h: (region.h + 3) * TILE
    };
  }

  function findNearest() {
    let best = null, bestD = Infinity;
    for (let i = 0; i < hung.length; i++) {
      const s = hung[i];
      const dx = Math.abs(player.x - s.cx);
      const dy = player.y - s.floorY;
      if (dx <= 18 && dy >= -2 && dy <= 34) {
        const d = dx + dy;
        if (d < bestD) { bestD = d; best = s; }
      }
    }
    return best;
  }

  let lastRoom = null;
  let currentRegion = REGIONS[0];
  const lit = litFor(REGIONS[0]);

  function update(dt) {
    let dx = 0, dy = 0;
    if (keys.left || pad.left) dx -= 1;
    if (keys.right || pad.right) dx += 1;
    if (keys.up || pad.up) dy -= 1;
    if (keys.down || pad.down) dy += 1;

    player.moving = !viewerOpen && !helpOpen && !window.__boot && (dx !== 0 || dy !== 0);

    if (player.moving) {
      const len = Math.hypot(dx, dy) || 1;
      const d = SPEED * dt;
      move((dx / len) * d, (dy / len) * d);
      if (dy < 0 && !dx) player.dir = 'up';
      else if (dy > 0 && !dx) player.dir = 'down';
      else if (dx < 0) player.dir = 'left';
      else if (dx > 0) player.dir = 'right';
      player.anim += dt * 7.5;
      player.frame = Math.floor(player.anim) % 4;
    } else {
      player.anim = 0;
      player.frame = 0;
    }

    cam.x = Math.max(0, Math.min(world.width - VIEW_W, Math.round(player.x - VIEW_W / 2)));
    cam.y = Math.max(0, Math.min(world.height - VIEW_H, Math.round(player.y - VIEW_H / 2 - 8)));

    nearest = viewerOpen || helpOpen ? null : findNearest();

    const region = regionAt(player.x, player.y - 2);
    if (region) currentRegion = region;
    if (region && region.name && region !== lastRoom) {
      lastRoom = region;
      els.room.textContent = region.name;
    }

    // the lit area slides across as she walks from room to room
    const target = litFor(currentRegion);
    const k = 1 - Math.exp(-dt * 9);
    lit.x += (target.x - lit.x) * k;
    lit.y += (target.y - lit.y) * k;
    lit.w += (target.w - lit.w) * k;
    lit.h += (target.h - lit.h) * k;

    // prompt bubble sits at her feet, so it never covers the painting
    if (nearest) {
      const sx = (player.x - cam.x) * scale;
      const sy = (player.y + 5 - cam.y) * scale;
      els.prompt.hidden = false;
      els.prompt.style.left = sx + 'px';
      els.prompt.style.top = sy + 'px';
    } else {
      els.prompt.hidden = true;
    }
  }

  function render() {
    ctx.drawImage(world, cam.x, cam.y, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // glow on the painting she is standing in front of
    if (nearest) {
      const f = nearest.frame;
      ctx.strokeStyle = 'rgba(255,226,168,0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(f.x - 1.5, f.y - 1.5, f.w + 3, f.h + 3);
    }

    // mark on paintings already visited
    hung.forEach(function (s) {
      if (!seen.has(s.art.id)) return;
      const f = s.frame;
      ctx.fillStyle = 'rgba(201,169,97,0.9)';
      ctx.fillRect(f.x + f.w - 2, f.y - 3, 2, 2);
    });

    // furniture and Lapsina, back to front
    const items = [];
    BENCHES.forEach(function (b) { items.push({ y: b[1] * TILE + 14, draw: function () { drawBench(ctx, b[0], b[1]); } }); });
    PLANTS.forEach(function (p) { items.push({ y: p[1] * TILE + 15, draw: function () { drawPlant(ctx, p[0], p[1]); } }); });
    items.push({ y: player.y, draw: function () { window.drawGirl(ctx, player.x, player.y, player.dir, player.frame, player.moving); } });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { it.draw(); });

    ctx.restore();

    // the rooms she is not in are turned down
    const l = Math.max(0, Math.min(VIEW_W, lit.x - cam.x));
    const t = Math.max(0, Math.min(VIEW_H, lit.y - cam.y));
    const r = Math.max(0, Math.min(VIEW_W, lit.x + lit.w - cam.x));
    const b = Math.max(0, Math.min(VIEW_H, lit.y + lit.h - cam.y));
    ctx.fillStyle = 'rgba(6,4,12,0.62)';
    ctx.fillRect(0, 0, VIEW_W, t);
    ctx.fillRect(0, b, VIEW_W, VIEW_H - b);
    ctx.fillRect(0, t, l, b - t);
    ctx.fillRect(r, t, VIEW_W - r, b - t);

    ctx.drawImage(vignette, 0, 0);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // First-time visitors get the instructions card, once the title card is gone.
  function welcome() {
    if (!seen.size) setTimeout(function () { toggleHelp(true); }, 260);
  }
  if (window.__boot) addEventListener('lapsina:start', welcome, { once: true });
  else welcome();

  // A photographed work finishing its download: re-hang the real picture.
  addEventListener('lapsina:art', function (e) {
    hung.forEach(function (s) {
      if (s.art.id === e.detail.id) bakeFrame(s);
    });
    if (viewerOpen && current === e.detail.id) paintViewer(window.ARTWORKS[current]);
  });

  // Handy from the browser console when rearranging the house.
  window.__lapsina = {
    player: player,
    hung: hung,
    rooms: ROOMS,
    goTo: function (x, y) { player.x = x; player.y = y; }
  };
})();
