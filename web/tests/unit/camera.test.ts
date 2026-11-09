import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeCameraVideo } from '../support/camera'
import { qrOf } from '../support/accounts'

const file = join(tmpdir(), 'cgpay-camera-unit-test.y4m')
const HEADER = 'YUV4MPEG2 W640 H480 F5:1 Ip A1:1 C420jpeg\n'
const FRAME_BYTES = 6 + 640 * 480 * 1.5 // "FRAME\n" + Y + U + V

describe('writeCameraVideo', () => {
  it('writes a Y4M file of identical frames', () => {
    writeCameraVideo('HTTP://6VM.RC4.ME/KDCD12345d', file)
    const bytes = readFileSync(file)
    expect(bytes.subarray(0, HEADER.length).toString()).toBe(HEADER)
    expect(bytes.length).toBe(HEADER.length + 5 * FRAME_BYTES)
    expect(bytes.subarray(HEADER.length, HEADER.length + 6).toString()).toBe('FRAME\n')
  })
  it('draws dark QR modules on a white picture, and nothing for empty text', () => {
    const dark = (b: Buffer) => b.subarray(HEADER.length + 6, HEADER.length + 6 + 640 * 480).filter(v => v < 100).length
    writeCameraVideo('HTTP://6VM.RC4.ME/KDCD12345d', file)
    expect(dark(readFileSync(file))).toBeGreaterThan(5000)
    writeCameraVideo('', file)
    expect(dark(readFileSync(file))).toBe(0)
  })
})

describe('qrOf', () => {
  it('follows the pattern of the legacy fake-scan codes', () => {
    expect(qrOf('Abe')).toBe('HTTP://6VM.RC4.ME/KDCA12345a')
    expect(qrOf('Bea')).toBe('HTTP://6VM.RC4.ME/KDCB12345b')
    expect(qrOf('Dee')).toBe('HTTP://6VM.RC4.ME/KDCD12345d')
  })
})
