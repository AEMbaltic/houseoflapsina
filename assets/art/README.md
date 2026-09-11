# Photographs of real paintings

A work in `assets/artworks.js` can carry a `src` pointing at a file in here:

```js
{
  title: 'Paeonia lactiflora',
  aspect: [1, 1],
  src: 'assets/art/paeonia-lactiflora.jpg',
  paint: function (c, w, h, r) { /* drawn stand-in, used until the file exists */ }
}
```

The photograph replaces the drawing everywhere — the frame on the wall, the
title card, and the viewer — as soon as it loads. If the file is missing the
drawing simply stays, so nothing breaks.

Crop the photograph to the edge of the canvas: the game draws its own gilt
frame and mount, so a picture that still has its physical frame in it ends up
framed twice. Match `aspect` to the crop ([1, 1] here), keep the longest side
around 1600px, and save as JPEG.

Wanted here: `paeonia-lactiflora.jpg`
