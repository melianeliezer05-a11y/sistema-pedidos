import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/format'
import { useSettings } from '@/lib/settings'

export function SettingsTab() {
  const { settings, refresh } = useSettings()
  const [name, setName] = useState(settings.restaurantName)
  const [alert, setAlert] = useState(String(settings.clientAlertUnits))
  const [busy, setBusy] = useState(false)
  useEffect(() => { setName(settings.restaurantName); setAlert(String(settings.clientAlertUnits)) }, [settings])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.admin.saveSettings({ restaurantName: name, clientAlertUnits: Number(alert) })
      await refresh()
      toast.success('Ajustes guardados')
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="grid max-w-md gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-1.5">
        <Label htmlFor="s-name">Nombre del local</Label>
        <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} className="h-11" />
        <p className="text-sm text-muted-foreground">Sale en la carta y en la cabecera de los tickets.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="s-alert">Avisar al cliente cuando queden…</Label>
        <Input id="s-alert" type="number" min={1} max={50} value={alert} onChange={(e) => setAlert(e.target.value)} required className="num h-11 w-28" />
        <p className="text-sm text-muted-foreground">Unidades posibles de un plato a partir de las cuales la carta muestra «Quedan N».</p>
      </div>
      <Button type="submit" size="lg" disabled={busy} className="w-fit">Guardar ajustes</Button>
    </form>
  )
}
