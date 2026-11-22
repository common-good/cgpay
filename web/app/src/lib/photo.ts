// Longer side of a photo kept for offline use, in pixels: about 3 KB as a JPEG, with the face still clear (the screen shows it as large as the full photo).
const PX = 136

/** A small JPEG copy of an image, as bytes. */
export async function shrink(b: Blob, px = PX) {
  const img = await createImageBitmap(b), k = Math.min(1, px / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  const jpeg = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/jpeg', 0.6))
  if (!jpeg) throw new Error('The photo could not be made smaller.')
  return new Uint8Array(await jpeg.arrayBuffer())
}
