import type { Ingredient, Movement, Order, OrderStatus, OrderStatusView, Product, Settings } from './types'

const TOKEN_KEY = 'pedidos.token'

export const auth = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t) } catch { /* sin almacenamiento: la sesión dura lo que la pestaña */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY) } catch { /* nada que limpiar */ } },
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

async function request<T>(path: string, opts: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(opts.headers)
  const token = auth.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (opts.json !== undefined) { headers.set('Content-Type', 'application/json'); opts.body = JSON.stringify(opts.json) }
  let res: Response
  try { res = await fetch(path, { ...opts, headers }) } catch { throw new ApiError('Sin conexión con el servidor', 0) }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) { auth.clear(); window.dispatchEvent(new Event('pedidos:logout')) }
    throw new ApiError(data.error || `Error ${res.status}`, res.status)
  }
  return data as T
}

export const api = {
  settings: () => request<Settings>('/api/settings'),
  products: () => request<{ products: Product[] }>('/api/products').then((r) => r.products),
  createOrder: (items: unknown[], customerName: string) =>
    request<{ order: Order }>('/api/orders', { method: 'POST', json: { items, customerName } }).then((r) => r.order),
  orderStatus: (id: string) => request<OrderStatusView>(`/api/orders/${encodeURIComponent(id)}/status`),

  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/api/auth/login', { method: 'POST', json: { username, password } }),
  me: () => request<{ user: { username: string } }>('/api/auth/me'),

  admin: {
    orders: () => request<{ orders: Order[] }>('/api/orders').then((r) => r.orders),
    setStatus: (id: string, status: OrderStatus) => request<{ order: Order }>(`/api/orders/${id}/status`, { method: 'PATCH', json: { status } }),
    ticket: (id: string) => request<{ ticket: string }>(`/api/orders/${id}/ticket`).then((r) => r.ticket),
    reprint: (id: string) => request<{ print: { ok: boolean; mode: string } }>(`/api/print/${id}`, { method: 'POST' }),
    ingredients: () => request<{ ingredients: Ingredient[] }>('/api/ingredients').then((r) => r.ingredients),
    createIngredient: (data: { name: string; emoji: string; stock: number; minStock: number; unit: string }) =>
      request<{ ok: boolean; id: string }>('/api/ingredients', { method: 'POST', json: data }),
    deleteIngredient: (id: string) => request(`/api/ingredients/${id}`, { method: 'DELETE' }),
    adjustStock: (id: string, delta: number) => request(`/api/ingredients/${id}/stock`, { method: 'PATCH', json: { delta } }),
    setThreshold: (id: string, minStock: number) => request(`/api/ingredients/${id}/threshold`, { method: 'PATCH', json: { minStock } }),
    movements: () => request<{ movements: Movement[] }>('/api/ingredients/movements?limit=200').then((r) => r.movements),
    products: () => request<{ products: Product[] }>('/api/products/admin').then((r) => r.products),
    createProduct: (data: { name: string; emoji: string; price: number; description: string; recipe: Record<string, number>; removable: string[]; extras: Array<{ id: string; name: string; price: number; ingredient: string; qty: number }> }) =>
      request<{ ok: boolean; id: string }>('/api/products/admin', { method: 'POST', json: data }),
    deleteProduct: (id: string) => request(`/api/products/admin/${id}`, { method: 'DELETE' }),
    updateProduct: (id: string, patch: Partial<Pick<Product, 'name' | 'price' | 'description' | 'active'>>) =>
      request(`/api/products/${id}`, { method: 'PATCH', json: patch }),
    saveSettings: (s: Settings) => request<Settings>('/api/settings', { method: 'PUT', json: s }),
  },
}
