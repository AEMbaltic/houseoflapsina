# Photographs of real paintings

A work in `assets/artworks.js` can be a photograph instead of a drawing:

```js
{
  title: 'Paeonia lactiflora',
  year: 2025,
  medium: 'Oil on canvas',
  aspect: [1, 1],
  src: 'assets/art/paeonia-lactiflora.jpg'
}
```

It is shown as it is — no generated stand-in, no invented wall label. Until the
file is here, that frame hangs empty.

Crop the photograph to the edge of the canvas: the game draws its own gilt
frame and mount, so a picture that still has its physical frame in it ends up
framed twice. Match `aspect` to the crop, keep the longest side around 1600px,
and save as JPEG.

Wanted here: `paeonia-lactiflora.jpg`
