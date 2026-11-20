import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/lib/cart'
import { SettingsProvider } from '@/lib/settings'
import Login from '@/pages/Login'
import Menu from '@/pages/Menu'
import Tracking from '@/pages/Tracking'

const Admin = lazy(() => import('@/pages/Admin'))

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <CartProvider>
          <Suspense fallback={<div className="grid min-h-dvh place-items-center text-muted-foreground">Cargando…</div>}>
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/pedido/:id" element={<Tracking />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" />
        </CartProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}
