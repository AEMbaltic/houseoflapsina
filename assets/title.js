/* The title card — the gallery at attract mode.
 *
 * Drawn the same way as everything else here: a fixed 320x200 pixel canvas,
 * no images. The paintings on its walls are the real works from artworks.js
 * and the girl is the same sprite you walk around with.
 */
(function () {
  'use strict';

  const W = 320;
  const H = 200;

  window.__boot = true;   // game.js holds still while this is up

  // ------------------------------------------------------------ pixel font

  const FONT = {
    A: '01110,10001,10001,11111,10001,10001,10001',
    B: '11110,10001,10001,11110,10001,10001,11110',
    C: '01110,10001,10000,10000,10000,10001,01110',
    D: '11110,10001,10001,10001,10001,10001,11110',
    E: '11111,10000,10000,11110,10000,10000,11111',
    F: '11111,10000,10000,11110,10000,10000,10000',
    G: '01110,10001,10000,10111,10001,10001,01111',
    H: '10001,10001,10001,11111,10001,10001,10001',
    I: '11111,00100,00100,00100,00100,00100,11111',
    J: '00111,00010,00010,00010,00010,10010,01100',
    K: '10001,10010,10100,11000,10100,10010,10001',
    L: '10000,10000,10000,10000,10000,10000,11111',
    M: '10001,11011,10101,10001,10001,10001,10001',
    N: '10001,11001,10101,10011,10001,10001,10001',
    O: '01110,10001,10001,10001,10001,10001,01110',
    P: '11110,10001,10001,11110,10000,10000,10000',
    Q: '01110,10001,10001,10001,10101,10010,01101',
    R: '11110,10001,10001,11110,10100,10010,10001',
    S: '01111,10000,10000,01110,00001,00001,11110',
    T: '11111,00100,00100,00100,00100,00100,00100',
    U: '10001,10001,10001,10001,10001,10001,01110',
    V: '10001,10001,10001,10001,10001,01010,00100',
    W: '10001,10001,10001,10001,10101,11011,10001',
    X: '10001,10001,01010,00100,01010,10001,10001',
    Y: '10001,10001,01010,00100,00100,00100,00100',
    Z: '11111,00001,00010,00100,01000,10000,11111',
    0: '01110,10001,10011,10101,11001,10001,01110',
    1: '00100,01100,00100,00100,00100,00100,01110',
    2: '01110,10001,00001,00010,00100,01000,11111',
    3: '11110,00001,00001,01110,00001,00001,11110',
    4: '00010,00110,01010,10010,11111,00010,00010',
    5: '11111,10000,11110,00001,00001,10001,01110',
    6: '01110,10001,10000,11110,10001,10001,01110',
    7: '11111,00001,00010,00100,01000,01000,01000',
    8: '01110,10001,10001,01110,10001,10001,01110',
    9: '01110,10001,10001,01111,00001,10001,01110',
    '.': '00000,00000,00000,00000,00000,00110,00110',
    ',': '00000,00000,00000,00000,00110,00110,01100',
    '-': '00000,00000,00000,01110,00000,00000,00000',
    '!': '00100,00100,00100,00100,00100,00000,00100',
    "'": '00100,00100,00000,00000,00000,00000,00000'
  };

  const OUTLINE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

  function textWidth(str, s) {
    let w = 0;
    for (let i = 0; i < str.length; i++) w += (str[i] === ' ' ? 4 : 6) * s;
    return w - s;
  }

  function drawText(c, str, x, y, s, opt) {
    opt = opt || {};
    const top = opt.top || '#fdf3d0';
    const mid = opt.mid || '#f0d79a';
    const bot = opt.bot || '#d3ab5e';
    const outline = opt.outline === null ? null : (opt.outline || 'rgba(18,10,6,0.92)');
    str = str.toUpperCase();
    let cx = x;

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === ' ') { cx += 4 * s; continue; }
      const g = FONT[ch];
      if (!g) { cx += 6 * s; continue; }
      const rows = g.split(',');

      if (outline) {
        c.fillStyle = outline;
        for (let r = 0; r < 7; r++) {
          for (let q = 0; q < 5; q++) {
            if (rows[r][q] !== '1') continue;
            for (let o = 0; o < OUTLINE.length; o++) {
              c.fillRect(cx + (q + OUTLINE[o][0]) * s, y + (r + OUTLINE[o][1]) * s, s, s);
            }
          }
        }
      }
      for (let r = 0; r < 7; r++) {
        c.fillStyle = r < 3 ? top : (r < 5 ? mid : bot);
        for (let q = 0; q < 5; q++) {
          if (rows[r][q] === '1') c.fillRect(cx + q * s, y + r * s, s, s);
        }
      }
      cx += 6 * s;
    }
  }

  function centred(c, str, y, s, opt) {
    drawText(c, str, Math.round((W - textWidth(str, s)) / 2), y, s, opt);
  }

  // ------------------------------------------------------------ the picture

  function offscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Four works off the real wall, rendered once.
  const WALL = [
    { id: 0, x: 50, w: 36, h: 27 },
    { id: 1, x: 104, w: 24, h: 31 },
    { id: 8, x: 216, w: 28, h: 28 },
    { id: 11, x: 270, w: 30, h: 23 }
  ];
  WALL.forEach(function (p) {
    p.canvas = offscreen(p.w, p.h);
    window.ARTWORKS[p.id].render(p.canvas.getContext('2d'), p.w, p.h);
    p.y = 110;
  });

  addEventListener('lapsina:art', function (e) {
    WALL.forEach(function (p) {
      if (p.id !== e.detail.id) return;
      const cc = p.canvas.getContext('2d');
      cc.clearRect(0, 0, p.w, p.h);
      window.ARTWORKS[p.id].render(cc, p.w, p.h);
    });
  });

  const WALL_TOP = 84;
  const FLOOR_Y = 134;

  function drawWall(c) {
    const ceil = c.createLinearGradient(0, 0, 0, WALL_TOP);
    ceil.addColorStop(0, '#150f20');
    ceil.addColorStop(0.7, '#1d1630');
    ceil.addColorStop(1, '#2a2140');
    c.fillStyle = ceil;
    c.fillRect(0, 0, W, WALL_TOP);

    const g = c.createLinearGradient(0, WALL_TOP, 0, FLOOR_Y);
    g.addColorStop(0, '#4a3f5e');
    g.addColorStop(1, '#332b42');
    c.fillStyle = g;
    c.fillRect(0, WALL_TOP, W, FLOOR_Y - WALL_TOP);

    c.fillStyle = '#6d5b86';
    c.fillRect(0, WALL_TOP, W, 2);
    c.fillStyle = 'rgba(0,0,0,0.16)';
    c.fillRect(0, WALL_TOP + 2, W, 2);
    c.fillStyle = '#241e2c';
    c.fillRect(0, FLOOR_Y - 4, W, 4);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.fillRect(0, FLOOR_Y - 5, W, 1);

    // brickwork, very faint
    c.fillStyle = 'rgba(0,0,0,0.10)';
    for (let y = WALL_TOP + 6; y < FLOOR_Y - 5; y += 7) {
      c.fillRect(0, y, W, 1);
      for (let x = (y % 14 === 0 ? 0 : 8); x < W; x += 16) c.fillRect(x, y - 6, 1, 6);
    }
  }

  function drawArch(c) {
    const cx = 160, half = 16, top = 100;
    c.fillStyle = '#5c4d70';
    c.beginPath();
    c.moveTo(cx - half - 3, FLOOR_Y);
    c.lineTo(cx - half - 3, top);
    c.arc(cx, top, half + 3, Math.PI, 0);
    c.lineTo(cx + half + 3, FLOOR_Y);
    c.closePath();
    c.fill();

    c.fillStyle = '#0d0a12';
    c.beginPath();
    c.moveTo(cx - half, FLOOR_Y);
    c.lineTo(cx - half, top);
    c.arc(cx, top, half, Math.PI, 0);
    c.lineTo(cx + half, FLOOR_Y);
    c.closePath();
    c.fill();

    const g = c.createLinearGradient(0, FLOOR_Y - 22, 0, FLOOR_Y);
    g.addColorStop(0, 'rgba(255,214,140,0)');
    g.addColorStop(1, 'rgba(255,214,140,0.20)');
    c.fillStyle = g;
    c.fillRect(cx - half, FLOOR_Y - 22, half * 2, 22);
  }

  function drawLamp(c, x, y, flicker) {
    c.fillStyle = '#8a6f38';
    c.fillRect(x - 1, y - 5, 2, 5);
    c.fillStyle = '#e0b25f';
    c.fillRect(x - 4, y, 8, 4);
    c.fillStyle = '#fff2c4';
    c.fillRect(x - 2, y + 1, 4, 2);

    const g = c.createLinearGradient(0, y + 4, 0, y + 34);
    g.addColorStop(0, 'rgba(255,226,160,' + (0.26 * flicker).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,226,160,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 4, y + 4);
    c.lineTo(x + 4, y + 4);
    c.lineTo(x + 16, y + 34);
    c.lineTo(x - 16, y + 34);
    c.closePath();
    c.fill();
  }

  function drawFrame(c, p) {
    const x = Math.round(p.x - p.w / 2) - 4;
    const y = Math.round(p.y - p.h / 2) - 4;
    const fw = p.w + 8, fh = p.h + 8;

    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(x + 2, y + 3, fw, fh);
    c.fillStyle = '#e0b25f';
    c.fillRect(x, y, fw, fh);
    c.fillStyle = '#8a6f38';
    c.fillRect(x, y + fh - 2, fw, 2);
    c.fillRect(x + fw - 2, y, 2, fh);
    c.fillStyle = '#fbe6ad';
    c.fillRect(x, y, fw, 1);
    c.fillStyle = '#1a1420';
    c.fillRect(x + 3, y + 3, p.w + 2, p.h + 2);
    c.drawImage(p.canvas, x + 4, y + 4);

    c.fillStyle = '#b9a06a';                       // plaque
    c.fillRect(p.x - 5, y + fh + 3, 10, 3);
  }

  function drawFloor(c) {
    let y = FLOOR_Y;
    let band = 3;
    let row = 0;
    while (y < H) {
      const h = Math.min(band, H - y);
      c.fillStyle = row % 2 ? '#7c3823' : '#88422a';
      c.fillRect(0, y, W, h);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(0, y, W, 1);
      c.fillStyle = 'rgba(0,0,0,0.16)';
      const step = 26 + row * 6;
      for (let x = (row % 2 ? step / 2 : 0); x < W; x += step) c.fillRect(Math.round(x), y, 1, h);
      y += h;
      band += 1;
      row++;
    }
    // polish
    const g = c.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, 'rgba(255,220,170,0.16)');
    g.addColorStop(0.5, 'rgba(255,220,170,0.04)');
    g.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = g;
    c.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  }

  function drawReflection(c, x, w, strength) {
    const g = c.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 26);
    g.addColorStop(0, 'rgba(255,220,160,' + strength + ')');
    g.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = g;
    c.fillRect(x - w / 2, FLOOR_Y, w, 26);
  }

  function drawPlinth(c, x, y, kind, t) {
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(x, y + 2, 18, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4c4658';
    c.fillRect(x - 14, y - 22, 28, 22);
    c.fillStyle = '#5e576c';
    c.fillRect(x - 15, y - 25, 30, 3);
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.fillRect(x - 14, y - 22, 28, 1);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(x - 14, y - 4, 28, 4);
    c.fillStyle = '#b9a06a';
    c.fillRect(x - 5, y - 14, 10, 3);

    const top = y - 25;                       // the face the piece stands on
    const bob = Math.sin(t * 1.6 + (kind === 'gem' ? 0 : 1.4));
    if (kind === 'gem') {
      const gy = top - 15 + bob;
      c.fillStyle = 'rgba(95,214,196,0.18)';
      c.beginPath();
      c.arc(x, gy + 8, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#5fd6c4';
      c.beginPath();
      c.moveTo(x, gy);
      c.lineTo(x + 7, gy + 7);
      c.lineTo(x, gy + 15);
      c.lineTo(x - 7, gy + 7);
      c.closePath();
      c.fill();
      c.fillStyle = '#a9f2e6';
      c.beginPath();
      c.moveTo(x, gy);
      c.lineTo(x + 3, gy + 7);
      c.lineTo(x, gy + 12);
      c.lineTo(x - 3, gy + 7);
      c.closePath();
      c.fill();
    } else {
      const ty = top - 15 + bob;
      c.fillStyle = 'rgba(224,178,95,0.16)';
      c.beginPath();
      c.arc(x, ty + 8, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#e0b25f';
      c.fillRect(x - 6, ty, 12, 15);
      c.fillStyle = '#fbe6ad';
      c.fillRect(x - 6, ty, 12, 2);
      c.fillStyle = 'rgba(90,60,20,0.5)';
      for (let i = 0; i < 4; i++) c.fillRect(x - 4, ty + 4 + i * 3, 8, 1);
    }
  }

  function drawRope(c, x1, x2, y) {
    [x1, x2].forEach(function (x) {
      c.fillStyle = '#8a6f38';
      c.fillRect(x - 1, y - 14, 2, 14);
      c.fillStyle = '#e0b25f';
      c.fillRect(x - 2, y - 17, 4, 3);
      c.fillStyle = 'rgba(0,0,0,0.28)';
      c.fillRect(x - 3, y - 1, 6, 2);
    });
    c.strokeStyle = '#9c2f3f';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x1, y - 14);
    c.quadraticCurveTo((x1 + x2) / 2, y - 6, x2, y - 14);
    c.stroke();
  }

  function drawBench(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.beginPath();
    c.ellipse(x, y + 3, 32, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1c3a37';
    c.fillRect(x - 26, y - 3, 5, 8);
    c.fillRect(x + 21, y - 3, 5, 8);
    c.fillStyle = '#2f6b63';
    c.fillRect(x - 32, y - 10, 64, 8);
    c.fillStyle = '#3f8a80';
    c.fillRect(x - 32, y - 10, 64, 2);
    c.fillStyle = '#21504a';
    c.fillRect(x - 32, y - 3, 64, 1);
  }

  function drawPlant(c, x, y, big) {
    const s = big ? 1 : 0.7;
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.beginPath();
    c.ellipse(x, y, 9 * s, 3 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#9d5c42';
    c.beginPath();
    c.moveTo(x - 7 * s, y - 11 * s);
    c.lineTo(x + 7 * s, y - 11 * s);
    c.lineTo(x + 5 * s, y);
    c.lineTo(x - 5 * s, y);
    c.closePath();
    c.fill();
    c.fillStyle = '#b06c4d';
    c.fillRect(x - 7 * s, y - 13 * s, 14 * s, 3 * s);
    const leaves = [[-6, -18, 5, 4], [2, -20, 5, 4], [-3, -25, 4, 3.5], [4, -16, 5, 3], [-1, -29, 3.5, 3]];
    leaves.forEach(function (l, i) {
      c.fillStyle = i % 2 ? '#3f7a4a' : '#4f9a58';
      c.beginPath();
      c.ellipse(x + l[0] * s, y + l[1] * s, l[2] * s, l[3] * s, i * 0.6, 0, Math.PI * 2);
      c.fill();
    });
  }

  // ------------------------------------------------------------- sparkles

  const SPARKS = [
    [46, 26, 0], [274, 30, 1.1], [62, 54, 2.2], [258, 58, 0.6],
    [30, 44, 1.7], [292, 46, 2.8], [96, 18, 3.4], [226, 20, 1.3]
  ];
  const SPARK_COLS = ['#7fe3d4', '#f2a0bd', '#ffd166', '#9ecbff'];

  function drawSpark(c, x, y, size, col) {
    if (size <= 0) return;
    c.fillStyle = col;
    c.fillRect(x - size, y, size * 2 + 1, 1);
    c.fillRect(x, y - size, 1, size * 2 + 1);
    if (size > 2) {
      c.fillStyle = '#fff';
      c.fillRect(x, y, 1, 1);
    }
  }

  // ---------------------------------------------------------------- screen

  const boot = document.getElementById('boot');
  const canvas = document.getElementById('bootCanvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;

  const touch = matchMedia('(pointer: coarse)').matches;
  const startLine = touch ? 'tap to start' : 'press space to start';

  function fit() {
    const raw = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 24) / H);
    // whole pixels where there is room for them, otherwise fill the screen
    const s = raw >= 2 ? Math.floor(raw) : Math.max(0.75, raw);
    canvas.style.width = Math.round(W * s) + 'px';
    canvas.style.height = Math.round(H * s) + 'px';
  }
  addEventListener('resize', fit);
  fit();

  const t0 = performance.now();
  let ready = false;
  let running = true;

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;

    let prog = Math.min(t / 1.4, 1);
    if (!window.__lapsina) prog = Math.min(prog, 0.85);   // still baking the house
    if (prog >= 1) ready = true;

    c.clearRect(0, 0, W, H);
    drawWall(c);

    const flicker = 0.85 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 2.1) * 0.1;
    WALL.forEach(function (p) { drawLamp(c, p.x, WALL_TOP + 6, flicker); });
    drawArch(c);
    WALL.forEach(function (p) { drawFrame(c, p); });

    drawFloor(c);
    WALL.forEach(function (p) { drawReflection(c, p.x, p.w + 14, 0.14 * flicker); });
    drawReflection(c, 160, 40, 0.06);

    drawPlant(c, 138, 140, false);
    drawPlant(c, 182, 140, false);
    drawPlinth(c, 72, 164, 'gem', t);
    drawPlinth(c, 240, 164, 'tablet', t);
    drawRope(c, 52, 92, 170);
    drawRope(c, 220, 260, 170);
    drawBench(c, 160, 178);
    drawPlant(c, 22, 188, true);
    drawPlant(c, 300, 186, true);

    window.drawGirl(c, 160, 162, 'up', 0, false);

    // ---- title band
    const band = c.createLinearGradient(0, 0, 0, WALL_TOP);
    band.addColorStop(0, 'rgba(6,4,12,0.86)');
    band.addColorStop(1, 'rgba(6,4,12,0.10)');
    c.fillStyle = band;
    c.fillRect(0, 0, W, WALL_TOP);

    SPARKS.forEach(function (s, i) {
      const k = (Math.sin(t * 2.4 + s[2]) + 1) / 2;
      drawSpark(c, s[0], s[1], Math.round(k * 3), SPARK_COLS[i % SPARK_COLS.length]);
    });

    centred(c, 'lapsina', 14, 4);

    const sub = 'tiny gallery';
    const sw = textWidth(sub, 2);
    drawText(c, sub, Math.round((W - sw) / 2), 52, 2, { top: '#f6e6bb', mid: '#e8cf9a', bot: '#c9a961' });
    c.fillStyle = '#e0b25f';
    c.fillRect(Math.round((W - sw) / 2) - 26, 57, 18, 1);
    c.fillRect(Math.round((W + sw) / 2) + 8, 57, 18, 1);
    drawSpark(c, Math.round((W - sw) / 2) - 34, 57, 2, '#ffd166');
    drawSpark(c, Math.round((W + sw) / 2) + 34, 57, 2, '#ffd166');

    // ---- bottom line
    c.fillStyle = 'rgba(6,4,12,0.55)';
    c.fillRect(0, 180, W, 20);

    if (!ready) {
      const bw = 120, bx = (W - bw) / 2, by = 187;
      c.fillStyle = '#1a1420';
      c.fillRect(bx - 2, by - 2, bw + 4, 10);
      c.fillStyle = '#8a6f38';
      c.fillRect(bx - 1, by - 1, bw + 2, 8);
      c.fillStyle = '#100c16';
      c.fillRect(bx, by, bw, 6);
      c.fillStyle = '#e0b25f';
      c.fillRect(bx, by, Math.round(bw * prog), 6);
      c.fillStyle = '#fbe6ad';
      c.fillRect(bx, by, Math.round(bw * prog), 1);
      const dots = '.'.repeat(1 + (Math.floor(t * 3) % 3));
      drawText(c, 'hanging the paintings' + dots, bx, by - 12, 1,
        { top: '#cbbba6', mid: '#cbbba6', bot: '#cbbba6', outline: null });
    } else if (Math.sin(t * 4.2) > -0.35) {
      centred(c, startLine, 185, 2, { top: '#fff6da', mid: '#f2dda8', bot: '#d3ab5e' });
    }

    // ---- CRT
    c.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 2) c.fillRect(0, y, W, 1);
    const sweep = ((t * 26) % (H + 60)) - 60;
    const sg = c.createLinearGradient(0, sweep, 0, sweep + 60);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.035)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg;
    c.fillRect(0, sweep, W, 60);

    const vig = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(4,3,8,0)');
    vig.addColorStop(1, 'rgba(4,3,8,0.75)');
    c.fillStyle = vig;
    c.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ----------------------------------------------------------- start game

  function begin() {
    if (!ready || !running) return;
    running = false;
    boot.classList.add('gone');
    // let this very keypress finish before the game starts listening
    setTimeout(function () { window.__boot = false; }, 0);
    setTimeout(function () {
      boot.hidden = true;
      dispatchEvent(new CustomEvent('lapsina:start'));
    }, 460);
  }

  addEventListener('keydown', function (e) {
    if (!window.__boot) return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE' || e.key === ' ') {
      e.preventDefault();
      begin();
    }
  });
  boot.addEventListener('pointerdown', function (e) { e.preventDefault(); begin(); });
})();
