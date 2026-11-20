import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'pedidos:theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function read(): Theme {
  try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v } catch { /* sin almacenamiento */ }
  return 'system'
}

let current = read()

export function applyTheme() {
  const dark = current === 'dark' || (current === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(t: Theme) {
  current = t
  try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t) } catch { /* sin almacenamiento */ }
  applyTheme()
  listeners.forEach((l) => l())
}

media.addEventListener('change', () => { applyTheme(); listeners.forEach((l) => l()) })

export function useTheme() {
  const theme = useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => current)
  const isDark = theme === 'dark' || (theme === 'system' && media.matches)
  return { theme, isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}
