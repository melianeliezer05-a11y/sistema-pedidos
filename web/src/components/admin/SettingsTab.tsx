import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
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
    <Card className="max-w-md">
      <CardHeader><CardTitle>Tu local</CardTitle><CardDescription>Datos que ve el cliente en la carta y en los tickets.</CardDescription></CardHeader>
      <CardContent>
        <form id="settings-form" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="s-name">Nombre del local</FieldLabel>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
              <FieldDescription>Sale en la carta y en la cabecera de los tickets.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="s-alert">Avisar al cliente cuando queden…</FieldLabel>
              <Input id="s-alert" type="number" min={1} max={50} value={alert} onChange={(e) => setAlert(e.target.value)} required className="num w-28" />
              <FieldDescription>Unidades posibles de un plato a partir de las cuales la carta muestra «Quedan N».</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter><Button type="submit" form="settings-form" disabled={busy}>{busy && <Spinner data-icon="inline-start" />}Guardar ajustes</Button></CardFooter>
    </Card>
  )
}
