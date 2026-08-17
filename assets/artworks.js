/* The paintings of the House of Lapsina.
 *
 * Every work is drawn by code: each `paint` receives a 2D context, the width
 * and height it should fill, and a seeded random function. Because the seed is
 * fixed per work, the tiny thumbnail hanging on the wall and the big canvas in
 * the viewer are the same picture at two sizes.
 */
(function (global) {
  'use strict';

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fill the whole picture with a top-to-bottom gradient.
  function sky(c, w, h, stops) {
    const g = c.createLinearGradient(0, 0, 0, h);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  // A little grain, so flat areas do not look like plastic.
  function grain(c, w, h, r, amount) {
    const n = Math.max(30, Math.round(w * h * 0.04));
    c.save();
    c.globalAlpha = amount || 0.06;
    for (let i = 0; i < n; i++) {
      c.fillStyle = r() > 0.5 ? '#fff' : '#000';
      c.fillRect(r() * w, r() * h, w * 0.006 + 0.4, w * 0.006 + 0.4);
    }
    c.restore();
  }

  const works = [
    {
      title: 'Morning Over the Long Field',
      year: 2021,
      medium: 'Oil on board',
      aspect: [4, 3],
      seed: 1207,
      note: 'The first thing Lapsina painted after moving into the house. She got up before everyone else for eleven days to watch the same field, and only the twelfth morning was the right one.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#1d2c4d'], [0.42, '#7c5a7d'], [0.68, '#df8a6a'], [1, '#f5cd93']]);
        c.fillStyle = '#ffe9b0';
        c.beginPath();
        c.arc(w * 0.68, h * 0.56, h * 0.1, 0, Math.PI * 2);
        c.fill();
        const bands = ['#6a5478', '#453a5c', '#2b2540'];
        for (let i = 0; i < 3; i++) {
          const base = h * (0.6 + i * 0.15);
          c.fillStyle = bands[i];
          c.beginPath();
          c.moveTo(0, h);
          c.lineTo(0, base);
          for (let x = 0; x <= w; x += w / 10) {
            c.lineTo(x, base - Math.sin((x / w) * Math.PI * (1.4 + i * 0.8) + i) * h * 0.05);
          }
          c.lineTo(w, h);
          c.closePath();
          c.fill();
        }
        c.strokeStyle = '#1a1628';
        c.lineWidth = Math.max(0.6, h * 0.012);
        for (let i = 0; i < 3; i++) {
          const x = w * (0.12 + i * 0.09);
          c.beginPath();
          c.moveTo(x, h * 0.86);
          c.lineTo(x, h * 0.62);
          c.stroke();
        }
        grain(c, w, h, r, 0.05);
      }
    },
    {
      title: 'Birches, Counting',
      year: 2022,
      medium: 'Acrylic and chalk on linen',
      aspect: [3, 4],
      seed: 4411,
      note: 'There are nineteen trees. Lapsina insists this is not a coincidence, but will not say what it is instead.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#22422f'], [0.55, '#3f6b45'], [1, '#8ca85c']]);
        const n = 9;
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) * (w / n) + (r() - 0.5) * w * 0.05;
          const tw = w * (0.045 + r() * 0.035);
          c.fillStyle = i % 2 ? '#efe7d6' : '#dcd2bd';
          c.fillRect(x - tw / 2, 0, tw, h);
          c.fillStyle = 'rgba(30,40,30,0.55)';
          for (let k = 0; k < 6; k++) {
            const y = r() * h;
            c.fillRect(x - tw / 2, y, tw * (0.35 + r() * 0.5), Math.max(0.7, h * 0.012));
          }
        }
        c.fillStyle = 'rgba(20,40,25,0.35)';
        c.fillRect(0, h * 0.88, w, h * 0.12);
        grain(c, w, h, r, 0.05);
      }
    },
    {
      title: 'The Corridor That Is Longer at Night',
      year: 2022,
      medium: 'Ink and gouache',
      aspect: [4, 3],
      seed: 909,
      note: 'Measured by daylight the upstairs corridor is fourteen paces. Measured after bedtime it is, according to the artist, "quite a lot more than that".',
      paint: function (c, w, h, r) {
        c.fillStyle = '#141021';
        c.fillRect(0, 0, w, h);
        const vx = w * 0.5, vy = h * 0.52;
        for (let i = 5; i >= 1; i--) {
          const t = i / 5;
          const rw = w * 0.9 * t, rh = h * 0.86 * t;
          c.fillStyle = ['#2a2140', '#332851', '#3d2f5f', '#48376d', '#54407b'][i - 1];
          c.fillRect(vx - rw / 2, vy - rh / 2, rw, rh);
          c.fillStyle = 'rgba(255,225,170,' + (0.05 + i * 0.02) + ')';
          c.fillRect(vx - rw * 0.09, vy - rh * 0.5, rw * 0.18, rh * 0.08);
        }
        c.fillStyle = '#ffe6ae';
        c.fillRect(vx - w * 0.035, vy - h * 0.05, w * 0.07, h * 0.1);
        c.strokeStyle = 'rgba(255,230,180,0.22)';
        c.lineWidth = Math.max(0.5, h * 0.008);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          c.beginPath();
          c.moveTo(vx, vy);
          c.lineTo(vx + Math.cos(a) * w, vy + Math.sin(a) * w);
          c.stroke();
        }
        grain(c, w, h, r, 0.07);
      }
    },
    {
      title: 'Static Bloom',
      year: 2023,
      medium: 'Screenprint, edition of one',
      aspect: [1, 1],
      seed: 7788,
      note: 'Made by pointing an old television at a flower and turning the aerial until the flower agreed.',
      paint: function (c, w, h, r) {
        c.fillStyle = '#120f1c';
        c.fillRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 0.5;
        const cols = ['#f2b6c6', '#e2617a', '#c9457f', '#7c3e93', '#3f3a86', '#2b2b5e'];
        for (let i = cols.length - 1; i >= 0; i--) {
          c.fillStyle = cols[i];
          c.beginPath();
          const rad = (h * 0.48) * ((i + 1) / cols.length);
          for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 24) {
            const wob = 1 + Math.sin(a * (5 + i)) * 0.09;
            const x = cx + Math.cos(a) * rad * wob;
            const y = cy + Math.sin(a) * rad * wob;
            a === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
          }
          c.closePath();
          c.fill();
        }
        c.fillStyle = '#ffe6ae';
        c.beginPath();
        c.arc(cx, cy, h * 0.05, 0, Math.PI * 2);
        c.fill();
        c.save();
        c.globalAlpha = 0.28;
        for (let y = 0; y < h; y += Math.max(2, h * 0.035)) {
          c.fillStyle = '#000';
          c.fillRect(0, y, w, Math.max(0.6, h * 0.012));
        }
        c.restore();
        grain(c, w, h, r, 0.08);
      }
    },
    {
      title: 'Harbour, Blue Hour',
      year: 2023,
      medium: 'Watercolour',
      aspect: [16, 9],
      seed: 3131,
      note: 'Painted on a windy pier with the paper held down by two stones, one of which is still in the artist\'s coat pocket.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#101c3a'], [0.45, '#2c4a72'], [0.58, '#77a0b8'], [0.6, '#16304f'], [1, '#0b1930']]);
        c.fillStyle = 'rgba(255,236,190,0.9)';
        c.beginPath();
        c.arc(w * 0.22, h * 0.34, h * 0.055, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#0a1428';
        for (let i = 0; i < 5; i++) {
          const x = w * (0.55 + i * 0.09), bh = h * (0.1 + r() * 0.16);
          c.fillRect(x, h * 0.6 - bh, w * 0.035, bh);
        }
        for (let i = 0; i < 3; i++) {
          const x = w * (0.3 + i * 0.17), y = h * 0.62;
          c.fillStyle = '#132a48';
          c.beginPath();
          c.moveTo(x - w * 0.04, y);
          c.lineTo(x + w * 0.04, y);
          c.lineTo(x + w * 0.025, y + h * 0.05);
          c.lineTo(x - w * 0.025, y + h * 0.05);
          c.closePath();
          c.fill();
          c.fillStyle = '#e8dcc2';
          c.beginPath();
          c.moveTo(x, y - h * 0.2);
          c.lineTo(x + w * 0.03, y);
          c.lineTo(x - w * 0.01, y);
          c.closePath();
          c.fill();
        }
        c.fillStyle = 'rgba(255,236,190,0.5)';
        for (let i = 0; i < 16; i++) {
          const y = h * (0.66 + r() * 0.32);
          c.fillRect(w * 0.22 - r() * w * 0.05, y, w * (0.02 + r() * 0.06), Math.max(0.6, h * 0.014));
        }
        grain(c, w, h, r, 0.05);
      }
    },
    {
      title: 'Ninety-Nine Windows, Two of Them Ours',
      year: 2023,
      medium: 'Oil on canvas',
      aspect: [3, 4],
      seed: 5150,
      note: 'The block opposite, at the hour when everyone is home but nobody has closed the curtains yet.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#0f1626'], [1, '#1d2233']]);
        c.fillStyle = '#232132';
        c.fillRect(w * 0.06, h * 0.1, w * 0.88, h * 0.9);
        const cols = 6, rows = 11;
        const pw = (w * 0.88) / cols, ph = (h * 0.82) / rows;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = w * 0.06 + i * pw, y = h * 0.14 + j * ph;
            const lit = r();
            c.fillStyle = lit > 0.55 ? (lit > 0.9 ? '#ffd98a' : '#e6b96a') : '#161725';
            c.fillRect(x + pw * 0.2, y + ph * 0.18, pw * 0.6, ph * 0.58);
            if (lit > 0.86) {
              c.fillStyle = 'rgba(0,0,0,0.45)';
              c.fillRect(x + pw * 0.36, y + ph * 0.3, pw * 0.16, ph * 0.46);
            }
          }
        }
        // the two windows that are ours
        const ox = w * 0.06 + pw * 2, oy = h * 0.14 + ph * 5;
        const glow = c.createRadialGradient(ox + pw, oy + ph * 0.4, 1, ox + pw, oy + ph * 0.4, pw * 2.4);
        glow.addColorStop(0, 'rgba(255,214,128,0.55)');
        glow.addColorStop(1, 'rgba(255,214,128,0)');
        c.fillStyle = glow;
        c.fillRect(ox - pw * 1.6, oy - ph * 1.6, pw * 5.2, ph * 3.6);
        for (let k = 0; k < 2; k++) {
          c.fillStyle = '#fff0c2';
          c.fillRect(ox + k * pw + pw * 0.2, oy + ph * 0.18, pw * 0.6, ph * 0.58);
        }
        grain(c, w, h, r, 0.06);
      }
    },
    {
      title: 'Ceramic Study No. 4 (with pear)',
      year: 2024,
      medium: 'Oil on panel',
      aspect: [4, 3],
      seed: 2468,
      note: 'Studies one through three were also of this jug. The pear did not survive the sitting.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#6d5f52'], [1, '#3b332e']]);
        c.fillStyle = '#8a6a45';
        c.fillRect(0, h * 0.72, w, h * 0.28);
        c.fillStyle = 'rgba(0,0,0,0.28)';
        c.beginPath();
        c.ellipse(w * 0.45, h * 0.74, w * 0.2, h * 0.035, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#d8dbd2';
        c.beginPath();
        c.moveTo(w * 0.36, h * 0.72);
        c.bezierCurveTo(w * 0.28, h * 0.5, w * 0.36, h * 0.4, w * 0.4, h * 0.34);
        c.lineTo(w * 0.5, h * 0.34);
        c.bezierCurveTo(w * 0.54, h * 0.4, w * 0.62, h * 0.5, w * 0.54, h * 0.72);
        c.closePath();
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.fillRect(w * 0.4, h * 0.42, w * 0.03, h * 0.24);
        c.fillStyle = '#5d7a8c';
        c.fillRect(w * 0.36, h * 0.55, w * 0.185, h * 0.05);
        c.fillStyle = '#c8d24f';
        c.beginPath();
        c.ellipse(w * 0.68, h * 0.68, w * 0.06, h * 0.075, 0.2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#4a5c22';
        c.fillRect(w * 0.68, h * 0.58, w * 0.008, h * 0.05);
        grain(c, w, h, r, 0.06);
      }
    },
    {
      title: 'Signal from the Attic',
      year: 2024,
      medium: 'Digital, printed on aluminium',
      aspect: [16, 9],
      seed: 6021,
      note: 'The radio in the attic picks up one station that is not on any list. This is what it looks like.',
      paint: function (c, w, h, r) {
        c.fillStyle = '#08110d';
        c.fillRect(0, 0, w, h);
        c.strokeStyle = '#3affa1';
        c.lineWidth = Math.max(0.8, h * 0.018);
        c.beginPath();
        for (let x = 0; x <= w; x += Math.max(1, w / 90)) {
          const t = x / w;
          const y = h * 0.5
            + Math.sin(t * 22) * h * 0.16 * Math.sin(t * Math.PI)
            + Math.sin(t * 61) * h * 0.06
            + (r() - 0.5) * h * 0.03;
          x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
        }
        c.stroke();
        c.strokeStyle = 'rgba(58,255,161,0.25)';
        c.lineWidth = Math.max(0.5, h * 0.008);
        c.beginPath();
        c.moveTo(0, h * 0.5);
        c.lineTo(w, h * 0.5);
        c.stroke();
        c.save();
        c.globalAlpha = 0.35;
        for (let y = 0; y < h; y += Math.max(2, h * 0.045)) {
          c.fillStyle = '#000';
          c.fillRect(0, y, w, Math.max(0.7, h * 0.016));
        }
        c.restore();
        c.fillStyle = 'rgba(58,255,161,0.1)';
        c.fillRect(0, 0, w, h * 0.06);
        grain(c, w, h, r, 0.09);
      }
    },
    {
      title: 'Weather Report for a Room',
      year: 2024,
      medium: 'Pigment and wax',
      aspect: [1, 1],
      seed: 8899,
      note: 'Six days of one room, one band each, painted at the same hour. Thursday was apparently orange.',
      paint: function (c, w, h, r) {
        const cols = ['#2c4b6e', '#4f6f8a', '#d9a05b', '#c96a4a', '#7d4a63', '#2f2a3c'];
        const bh = h / cols.length;
        for (let i = 0; i < cols.length; i++) {
          c.fillStyle = cols[i];
          c.fillRect(0, i * bh, w, bh + 0.6);
          c.save();
          c.globalAlpha = 0.18;
          c.fillStyle = '#fff';
          c.fillRect(0, i * bh, w, bh * 0.18);
          c.restore();
          c.save();
          c.globalAlpha = 0.12;
          c.fillStyle = '#000';
          c.fillRect(0, i * bh + bh * 0.8, w, bh * 0.2);
          c.restore();
        }
        c.save();
        c.globalAlpha = 0.12;
        for (let i = 0; i < 60; i++) {
          c.fillStyle = '#fff';
          c.fillRect(r() * w, r() * h, w * 0.12 * r(), Math.max(0.6, h * 0.01));
        }
        c.restore();
        grain(c, w, h, r, 0.05);
      }
    },
    {
      title: 'Portrait of Buttons, Asleep',
      year: 2025,
      medium: 'Oil on board',
      aspect: [4, 3],
      seed: 1010,
      note: 'The house cat sat for this one for four hours without waking, which the artist describes as "the most co-operative model I have ever had".',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#4b3f52'], [1, '#2a2333']]);
        c.fillStyle = '#8d4f63';
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.76, w * 0.34, h * 0.13, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#6f3c4d';
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.8, w * 0.34, h * 0.1, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#3b3038';
        c.beginPath();
        c.ellipse(w * 0.5, h * 0.62, w * 0.26, h * 0.14, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(w * 0.31, h * 0.56, w * 0.1, h * 0.1, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(w * 0.24, h * 0.5);
        c.lineTo(w * 0.26, h * 0.4);
        c.lineTo(w * 0.32, h * 0.48);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(w * 0.36, h * 0.48);
        c.lineTo(w * 0.4, h * 0.39);
        c.lineTo(w * 0.42, h * 0.5);
        c.closePath();
        c.fill();
        c.strokeStyle = '#3b3038';
        c.lineWidth = Math.max(0.8, h * 0.02);
        c.beginPath();
        c.moveTo(w * 0.74, h * 0.66);
        c.quadraticCurveTo(w * 0.9, h * 0.6, w * 0.82, h * 0.46);
        c.stroke();
        c.strokeStyle = '#e8d9c0';
        c.lineWidth = Math.max(0.5, h * 0.007);
        c.beginPath();
        c.moveTo(w * 0.28, h * 0.58);
        c.lineTo(w * 0.16, h * 0.55);
        c.moveTo(w * 0.28, h * 0.6);
        c.lineTo(w * 0.16, h * 0.62);
        c.stroke();
        c.fillStyle = '#e8d9c0';
        c.fillRect(w * 0.26, h * 0.565, w * 0.05, Math.max(0.7, h * 0.012));
        grain(c, w, h, r, 0.06);
      }
    },
    {
      title: 'Ascent (Back Stairs)',
      year: 2025,
      medium: 'Tempera on gesso panel',
      aspect: [3, 4],
      seed: 3690,
      note: 'The back stairs of the house, painted so that they go up whichever way you look at them.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#efe3cd'], [1, '#c6ad8d']]);
        const steps = 8;
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const x = w * (0.08 + t * 0.6);
          const y = h * (0.9 - t * 0.72);
          const sw = w * 0.3, sh = h * 0.055;
          c.fillStyle = '#f6efe0';
          c.fillRect(x, y, sw, sh);
          c.fillStyle = '#a58a68';
          c.beginPath();
          c.moveTo(x, y + sh);
          c.lineTo(x + sw, y + sh);
          c.lineTo(x + sw, y + sh + h * 0.045);
          c.lineTo(x, y + sh + h * 0.045);
          c.closePath();
          c.fill();
          c.fillStyle = 'rgba(70,50,40,0.22)';
          c.fillRect(x, y + sh + h * 0.045, sw, h * 0.012);
        }
        c.save();
        c.globalAlpha = 0.35;
        c.fillStyle = '#fff5d8';
        c.beginPath();
        c.moveTo(w * 0.72, 0);
        c.lineTo(w, 0);
        c.lineTo(w * 0.45, h);
        c.lineTo(w * 0.16, h);
        c.closePath();
        c.fill();
        c.restore();
        grain(c, w, h, r, 0.05);
      }
    },
    {
      title: 'Fireworks Over the House, Seen From Bed',
      year: 2025,
      medium: 'Oil and glitter on canvas',
      aspect: [4, 3],
      seed: 1231,
      note: 'The most recent work, and the only one Lapsina asks visitors to stand close to. The glitter is her sister\'s, taken without permission.',
      paint: function (c, w, h, r) {
        sky(c, w, h, [[0, '#080c1e'], [0.7, '#141a35'], [1, '#26203c']]);
        for (let i = 0; i < 40; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.6) + ')';
          c.fillRect(r() * w, r() * h * 0.7, Math.max(0.6, w * 0.005), Math.max(0.6, w * 0.005));
        }
        const bursts = [
          [0.3, 0.3, '#ffd166'],
          [0.62, 0.22, '#e2617a'],
          [0.78, 0.42, '#6fd3c7']
        ];
        bursts.forEach(function (b, bi) {
          const cx = w * b[0], cy = h * b[1], rad = h * (0.14 + bi * 0.03);
          c.strokeStyle = b[2];
          c.lineWidth = Math.max(0.6, h * 0.008);
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2 + bi;
            const len = rad * (0.6 + r() * 0.5);
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
            c.stroke();
            c.fillStyle = b[2];
            c.fillRect(cx + Math.cos(a) * len, cy + Math.sin(a) * len, Math.max(0.7, h * 0.012), Math.max(0.7, h * 0.012));
          }
        });
        c.fillStyle = '#0a0a14';
        c.beginPath();
        c.moveTo(w * 0.18, h);
        c.lineTo(w * 0.18, h * 0.72);
        c.lineTo(w * 0.42, h * 0.56);
        c.lineTo(w * 0.66, h * 0.72);
        c.lineTo(w * 0.66, h);
        c.closePath();
        c.fill();
        c.fillStyle = '#ffd98a';
        c.fillRect(w * 0.36, h * 0.78, w * 0.1, h * 0.1);
        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.fillRect(w * 0.405, h * 0.78, w * 0.012, h * 0.1);
        grain(c, w, h, r, 0.05);
      }
    }
  ];

  // Give every work an id, a catalogue number, and a cached render helper.
  works.forEach(function (art, i) {
    art.id = i;
    art.no = String(i + 1).padStart(2, '0');
    art.artist = art.artist || 'Lapsina';
    art.render = function (ctx, w, h) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      art.paint(ctx, w, h, mulberry32(art.seed));
      ctx.restore();
    };
  });

  global.ARTWORKS = works;
})(window);
