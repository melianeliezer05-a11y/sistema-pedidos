const KEY = 'pedidos:sound'
let ctx: AudioContext | null = null

export const soundEnabled = () => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } }
export const setSoundEnabled = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* sin almacenamiento */ } }

/** Dos tonos cortos, suficientes para oír un pedido nuevo en cocina. */
export function chime() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t0 = ctx.currentTime
    ;[660, 880].forEach((f, i) => {
      const o = ctx!.createOscillator(); const g = ctx!.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + i * 0.16)
      g.gain.exponentialRampToValueAtTime(0.18, t0 + i * 0.16 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.16 + 0.3)
      o.connect(g).connect(ctx!.destination)
      o.start(t0 + i * 0.16); o.stop(t0 + i * 0.16 + 0.32)
    })
  } catch { /* el navegador bloquea audio hasta la primera interacción */ }
}
