import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import QRCode from 'qrcode'

// The browser's fake camera (Chromium's --use-fake-device-for-media-stream) plays this video file.
// The file is read when a page starts the camera, so a step can rewrite it before the legacy app's scan page opens.
export const CAMERA_FILE = join(tmpdir(), 'cgpay-bdd-camera.y4m')

const W = 640
const H = 480
const FRAMES = 5
const QR_PIXELS = 260 // the legacy scanner looks at a 250 pixel box in the middle of the picture
const QUIET = 4 // the empty border of a QR code, in modules

/**
 * Write a video (uncompressed Y4M, a few identical frames) of a QR code in the middle of a white picture.
 * @param text: what the QR code says (empty: just a white picture)
 */
export function writeCameraVideo(text: string, file = CAMERA_FILE) {
  const luma = Buffer.alloc(W * H, 235) // white
  if (text) {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' }).modules
    const scale = Math.max(1, Math.floor(QR_PIXELS / (qr.size + 2 * QUIET)))
    const x0 = Math.floor((W - qr.size * scale) / 2)
    const y0 = Math.floor((H - qr.size * scale) / 2)
    for (let row = 0; row < qr.size; row++) for (let col = 0; col < qr.size; col++) {
      if (!qr.get(row, col)) continue
      for (let y = 0; y < scale; y++) luma.fill(16, (y0 + row * scale + y) * W + x0 + col * scale, (y0 + row * scale + y) * W + x0 + (col + 1) * scale)
    }
  }
  const chroma = Buffer.alloc((W / 2) * (H / 2) * 2, 128)
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma])
  writeFileSync(file, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F5:1 Ip A1:1 C420jpeg\n`), ...Array(FRAMES).fill(frame)]))
}
