// A short beep for a good scan. Any failure (no audio, sound blocked until a touch) is only silence.
let ctx: AudioContext | undefined

export function beep() {
  try {
    ctx ??= new AudioContext()
    ctx.resume().catch(() => {})
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = 1760
    g.gain.value = 0.2
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.12)
  } catch {}
}
