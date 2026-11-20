import { Loader2, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, auth } from '@/lib/api'
import { errorMessage } from '@/lib/format'
import { useSettings } from '@/lib/settings'

export default function Login() {
  const nav = useNavigate()
  const { settings } = useSettings()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const { token } = await api.login(username.trim(), password)
      auth.set(token)
      nav('/admin', { replace: true })
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="login-title">
        <div className="grid gap-2">
          <span className="sticker grid size-12 place-items-center rounded-xl bg-secondary" aria-hidden><Lock className="size-5" /></span>
          <h1 id="login-title" className="text-3xl font-extrabold">Panel del personal</h1>
          <p className="text-sm text-muted-foreground">{settings.restaurantName}. Entra para gestionar pedidos y stock.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="user">Usuario</Label>
          <Input id="user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pass">Contraseña</Label>
          <Input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="h-11" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy}>{busy ? <><Loader2 className="animate-spin" aria-hidden /> Entrando…</> : 'Entrar'}</Button>
        <Link to="/" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">Volver a la carta</Link>
      </form>
    </main>
  )
}
