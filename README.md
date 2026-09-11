# House of Lapsina

A small browser game that is also an art gallery. You play a girl called Lapsina,
walking around her house with the arrow keys. Thirteen of her paintings hang on the
walls; stand in front of one and press space to look at it properly.

No build step, no dependencies, no images — open `index.html` and it runs.

## Playing

| Key | Does |
| --- | --- |
| Space (title card) | enter the house |
| Arrow keys / WASD | walk |
| Space / Enter / E | look at the painting in front of you |
| ← → while looking | browse to the next work |
| Esc | step back from the painting |
| M | sound on/off |
| H | how-to-play card |

On a phone or tablet an on-screen d-pad and a **LOOK** button appear instead, and
the view turns portrait.

Which paintings you have seen is kept in `localStorage`, so the counter in the
corner survives a reload.

## The title card

The game opens on an attract-mode title screen: a 320x200 pixel card drawn by
`assets/title.js`, framed like a CRT. The paintings hanging in it are the real
works from `artworks.js`, the girl is the same sprite, and the letters come from
a 5x7 bitmap font defined at the top of that file. It holds the keyboard until
you press space (or tap), which is also how long the house takes to build
itself in the background.

## The house

Five rooms, joined by corridors: the Entrance Hall you start in, the Long Room
with its skylight, the North Gallery, and the West and East Wings. Only the room
you are standing in is lit; the rest of the house is turned down.

## How it is put together

```
index.html          markup: canvas, HUD, artwork viewer, help card
assets/styles.css   everything outside the canvas
assets/artworks.js  the paintings — a drawing program each, or a photograph
assets/sprite.js    Lapsina, drawn from rectangles (no sprite sheet)
assets/title.js     the title card, its pixel font and its little gallery
assets/game.js      tile map, collision, camera, lighting, interaction
```

Nothing is loaded from disk or the network. The house is a tile map that is
painted once into an off-screen canvas at startup; each frame copies the visible
slice of it, then draws the furniture and Lapsina on top, sorted back to front.

The paintings are generative: every entry in `assets/artworks.js` has a `paint`
function that draws into whatever size it is given, using a seeded random number
generator. The seed is fixed per work, so the 26×18 pixel thumbnail hanging on
the wall and the large canvas in the viewer are the same picture — one is not a
scaled copy of the other.

### Hanging a new painting

Add an object to the `works` array in `assets/artworks.js`:

```js
{
  title: 'Something New',
  year: 2026,
  medium: 'Oil on board',
  aspect: [4, 3],          // landscape, portrait ([3,4]) or square ([1,1])
  seed: 1234,              // any integer; changes the random details
  note: 'The wall label text.',
  paint: function (c, w, h, r) { /* draw into 0,0,w,h — r() gives 0..1 */ }
}
```

It is hung automatically: the game finds every stretch of wall that has floor in
front of it and space above, then deals the works out room by room so no room is
left bare. Slots left over stay empty wall.

### Hanging a photograph of a real painting

Give the work a `src` as well, pointing at a file in `assets/art/`:

```js
{
  title: 'Paeonia lactiflora',
  year: 2025,
  medium: 'Oil on canvas',
  aspect: [1, 1],
  room: 'grand',                             // optional: ask for a room
  src: 'assets/art/paeonia-lactiflora.jpg',
  paint: function (c, w, h, r) { /* stands in until the file is there */ }
}
```

The photograph replaces the drawing everywhere — the frame on the wall, the
title card, the viewer — the moment it loads, and a missing file just leaves
the drawing in place. Crop the photograph to the edge of the canvas: the game
draws its own gilt frame, so a picture that still has its real frame in it ends
up framed twice. Match `aspect` to the crop.

`room` takes a key from `ROOMS` in `assets/game.js` (`entrance`, `grand`,
`north`, `west`, `east`) and gets first refusal on that room's walls; works
without one are dealt out round the rooms in turn.

### Rearranging the rooms

`ROOMS` and `CORRIDORS` at the top of `assets/game.js` are plain rectangles in
tile coordinates; `BENCHES` and `PLANTS` are tile positions. Change those and
the walls, doorways, lighting and hanging plan all follow. From the browser
console, `__lapsina.goTo(x, y)` teleports her to a pixel position, which is
useful when you are moving things around.

## Running it

Any static server, e.g.

```sh
python3 -m http.server 8000
```

then open <http://localhost:8000>. Opening `index.html` straight from the file
system works too.
