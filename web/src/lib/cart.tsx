import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { CartLine } from './types'

const KEY = 'pedidos.cart'

type Action =
  | { type: 'add'; line: Omit<CartLine, 'lineId'> }
  | { type: 'qty'; lineId: string; delta: number }
  | { type: 'remove'; lineId: string }
  | { type: 'clear' }

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case 'add': return [...state, { ...a.line, lineId: crypto.randomUUID() }]
    case 'qty': return state.map((l) => (l.lineId === a.lineId ? { ...l, quantity: Math.min(20, Math.max(1, l.quantity + a.delta)) } : l))
    case 'remove': return state.filter((l) => l.lineId !== a.lineId)
    case 'clear': return []
  }
}

function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

interface CartCtx {
  lines: CartLine[]
  count: number
  total: number
  add: (line: Omit<CartLine, 'lineId'>) => void
  setQty: (lineId: string, delta: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch { /* modo privado: el carrito vive solo en memoria */ } }, [lines])

  const value = useMemo<CartCtx>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    total: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    add: (line) => dispatch({ type: 'add', line }),
    setQty: (lineId, delta) => dispatch({ type: 'qty', lineId, delta }),
    remove: (lineId) => dispatch({ type: 'remove', lineId }),
    clear: () => dispatch({ type: 'clear' }),
  }), [lines])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart fuera de CartProvider')
  return c
}
