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
})(window);
