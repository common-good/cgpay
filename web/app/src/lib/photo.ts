// Longer side of a photo kept for offline use, in pixels: the screen shows it 120 px wide, and phones have 2 or 3 pixels to a px.
const PX = 240

/** A small JPEG copy of an image, as a data URL. */
export async function shrink(b: Blob, px = PX) {
  const img = await createImageBitmap(b), k = Math.min(1, px / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.6)
}
