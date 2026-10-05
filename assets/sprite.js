/* Lapsina herself: a 12x21 pixel girl, drawn with rectangles so she never
 * needs a sprite sheet. Coordinates are given as (x = centre, y = feet). */
(function (global) {
  'use strict';

  const C = {
    skin: '#f2c9a4',
    skinDark: '#d9a780',
    hair: '#7b4426',
    hairDark: '#5b3018',
    ribbon: '#ffd166',
    dress: '#e2617a',
    dressDark: '#b8455f',
    apron: '#f6efe0',
    shoe: '#3a2a3a',
    eye: '#33232e',
    blush: '#f09a9a'
  };

  function px(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  }

  const STEP = [0, 1, 0, -1]; // walk cycle offsets

  function drawGirl(c, cx, cy, dir, frame, moving) {
    const x = Math.round(cx);
    const y = Math.round(cy);
    const lo = moving ? STEP[frame & 3] : 0;
    const side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;

    // shadow
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(x, y + 0.5, 5.5, 2, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // hair behind the head (ponytails)
    if (dir === 'down') {
      px(c, x - 6, y - 19, 2, 6, C.hairDark);
      px(c, x + 4, y - 19, 2, 6, C.hairDark);
      px(c, x - 6, y - 20, 2, 2, C.ribbon);
      px(c, x + 4, y - 20, 2, 2, C.ribbon);
    } else if (dir === 'up') {
      px(c, x - 2, y - 17, 4, 6, C.hairDark);
      px(c, x - 2, y - 17, 4, 2, C.ribbon);
    } else {
      px(c, x - side * 5, y - 19, 3, 6, C.hairDark);
      px(c, x - side * 5, y - 20, 3, 2, C.ribbon);
    }

    // legs + shoes
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1;
      const off = s < 0 ? Math.max(0, lo) : Math.max(0, -lo);
      const lx = x + (s < 0 ? -3 : 1);
      px(c, lx, y - 6, 2, 4 - off, C.skin);
      px(c, lx - 1, y - 2 - off, 2, 2, C.shoe);
    }

    // dress
    const topHalf = side ? 2 : 3;
    const botHalf = side ? 3.5 : 5;
    c.fillStyle = C.dress;
    c.beginPath();
    c.moveTo(x - topHalf, y - 14);
    c.lineTo(x + topHalf, y - 14);
    c.lineTo(x + botHalf, y - 5);
    c.lineTo(x - botHalf, y - 5);
    c.closePath();
    c.fill();
    px(c, x - botHalf, y - 6, botHalf * 2, 1, C.dressDark);

    // pinafore, only from the front
    if (dir === 'down') {
      px(c, x - 2, y - 12, 4, 6, C.apron);
      px(c, x - 2, y - 13, 1, 2, C.apron);
      px(c, x + 1, y - 13, 1, 2, C.apron);
    }

    // arms
    const swing = moving ? STEP[frame & 3] : 0;
    px(c, x - 5, y - 14 + swing, 2, 5, C.skin);
    px(c, x + 3, y - 14 - swing, 2, 5, C.skin);
    px(c, x - 5, y - 14 + swing, 2, 2, C.dress);
    px(c, x + 3, y - 14 - swing, 2, 2, C.dress);

    // head
    const hx = x + side; // lean into the direction she faces
    px(c, hx - 4, y - 21, 8, 8, C.skin);
    px(c, hx - 4, y - 21, 8, 1, C.hairDark);

    // hair front
    px(c, hx - 4, y - 22, 8, 4, C.hair);
    px(c, hx - 5, y - 21, 1, 5, C.hair);
    px(c, hx + 4, y - 21, 1, 5, C.hair);

    if (dir === 'up') {
      px(c, hx - 4, y - 22, 8, 8, C.hair);
      px(c, hx - 5, y - 21, 10, 6, C.hair);
    } else if (dir === 'down') {
      px(c, hx - 4, y - 18, 8, 1, C.hair);
      px(c, hx - 3, y - 17, 1, 2, C.eye);
      px(c, hx + 2, y - 17, 1, 2, C.eye);
      px(c, hx - 4, y - 15, 1, 1, C.blush);
      px(c, hx + 3, y - 15, 1, 1, C.blush);
      px(c, hx - 1, y - 15, 2, 1, C.skinDark);
    } else {
      px(c, hx - 4, y - 18, 8, 1, C.hair);
      px(c, hx + (side < 0 ? -3 : 2), y - 17, 1, 2, C.eye);
      px(c, hx + (side < 0 ? -4 : 3), y - 15, 1, 1, C.blush);
      // fringe sweeps to the back of the head
      px(c, hx + (side < 0 ? 2 : -3), y - 19, 3, 2, C.hair);
    }
  }

  global.drawGirl = drawGirl;

  function drawGuy(c, cx, cy, dir, frame, moving) {
    const x = Math.round(cx), y = Math.round(cy);
    const step = moving ? STEP[frame & 3] : 0;
    const side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(x - 5, y, 10, 2);
    [-1, 1].forEach(function (s) {
      const offset = Math.max(0, s * step);
      const lx = x + (s < 0 ? -4 : 1);
      px(c, lx, y - 8 - offset, 3, 6, '#34323a');
      px(c, lx - (side < 0 ? 1 : 0), y - 2 - offset, 4, 2, '#e9e0ce');
      px(c, lx, y - 3 - offset, 3, 1, '#8a827b');
    });
    px(c, x - 4, y - 15, 8, 9, '#287985');
    px(c, x - 3, y - 14, 5, 7, '#3f9ba5');
    px(c, x - 4, y - 7, 8, 1, '#205b66');
    px(c, x - 6, y - 14 + step, 2, 6, '#287985');
    px(c, x + 4, y - 14 - step, 2, 6, '#287985');
    px(c, x - 6, y - 8 + step, 2, 2, C.skin);
    px(c, x + 4, y - 8 - step, 2, 2, C.skin);
    const hx = x + side;
    px(c, hx - 4, y - 22, 8, 8, C.skin);
    px(c, hx - 5, y - 22, 10, 4, '#543022');
    px(c, hx - 4, y - 24, 7, 4, '#754731');
    px(c, hx - 2, y - 25, 2, 2, '#543022');
    px(c, hx + 3, y - 24, 2, 3, '#543022');
    px(c, hx - 3, y - 23, 3, 1, '#965f40');
    px(c, hx + 1, y - 21, 4, 2, '#754731');
    if (dir === 'up') {
      px(c, hx - 4, y - 20, 8, 5, '#754731');
      px(c, hx - 3, y - 16, 6, 1, '#543022');
    } else if (!side) {
      px(c, hx - 3, y - 18, 1, 2, C.eye);
      px(c, hx + 2, y - 18, 1, 2, C.eye);
      px(c, hx - 1, y - 15, 2, 1, C.skinDark);
    } else {
      px(c, hx + side * 3, y - 18, 1, 2, C.eye);
      px(c, hx - side * 3, y - 20, 2, 4, '#754731');
    }
  }

  function drawFox(c, cx, cy, dir, frame, moving) {
    const x = Math.round(cx), y = Math.round(cy);
    const step = moving ? STEP[frame & 3] : 0;
    const orange = '#d87930', light = '#ef9b45', dark = '#9c4829';
    const cream = '#f7e7c9', paw = '#36282a';
    c.save();
    c.translate(x, y);
    if (dir === 'left') c.scale(-1, 1);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(-8, 0, 16, 2);
    if (dir === 'left' || dir === 'right') {
      // Tail trails the four-legged body; the tip sways through the walk cycle.
      px(c, -13, -12 + step, 6, 6, orange);
      px(c, -15, -14 + step, 4, 5, cream);
      px(c, -11, -9 + step, 5, 4, dark);
      px(c, -7, -11, 13, 8, orange);
      px(c, -5, -11, 10, 3, light);
      [-6, -3, 2, 5].forEach(function (lx, i) {
        const lift = moving ? Math.max(0, (i % 2 ? -1 : 1) * step) : 0;
        px(c, lx, -5 - lift, 2, 5, i % 2 ? dark : orange);
        px(c, lx, -2 - lift, 2, 2, paw);
      });
      px(c, 2, -16, 9, 9, light);
      px(c, 2, -21, 3, 6, dark);
      px(c, 3, -19, 1, 3, cream);
      px(c, 8, -20, 2, 5, paw);
      px(c, 6, -10, 5, 5, cream);
      px(c, 9, -12, 4, 3, cream);
      px(c, 12, -12, 1, 2, paw);
      px(c, 8, -15, 1, 2, paw);
    } else {
      px(c, 4, -11 + step, 7, 7, orange);
      px(c, 8, -13 + step, 4, 5, cream);
      px(c, -5, -12, 10, 9, orange);
      [-4, 2].forEach(function (lx, i) {
        const lift = Math.max(0, (i ? -1 : 1) * step);
        px(c, lx, -6 - lift, 2, 5, dark);
        px(c, lx, -2 - lift, 2, 2, paw);
      });
      px(c, -6, -18, 12, 9, orange);
      px(c, -6, -23, 3, 6, paw);
      px(c, 3, -23, 3, 6, paw);
      px(c, -5, -21, 2, 5, cream);
      px(c, 3, -21, 2, 5, cream);
      px(c, -4, -18, 8, 4, light);
      if (dir === 'down') {
        px(c, -5, -13, 10, 3, cream);
        px(c, -3, -10, 6, 4, cream);
        px(c, -2, -6, 4, 1, cream);
        px(c, -4, -15, 1, 2, paw);
        px(c, 3, -15, 1, 2, paw);
        px(c, -1, -12, 2, 2, paw);
      } else {
        px(c, -5, -14, 10, 4, orange);
        px(c, -3, -11, 6, 3, dark);
      }
    }
    c.restore();
  }

  global.drawCharacter = function (c, x, y, dir, frame, moving) {
    const draw = global.galleryCharacter === 'fox' ? drawFox :
      global.galleryCharacter === 'guy' ? drawGuy : drawGirl;
    draw(c, x, y, dir, frame, moving);
  };
})(window);
