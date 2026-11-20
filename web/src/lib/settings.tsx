import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import type { Settings } from './types'

const DEFAULTS: Settings = { restaurantName: 'Restaurante', clientAlertUnits: 5 }

interface Ctx { settings: Settings; refresh: () => Promise<void> }
const SettingsCtx = createContext<Ctx>({ settings: DEFAULTS, refresh: async () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const refresh = useCallback(async () => {
    try { setSettings(await api.settings()) } catch { /* se mantienen los valores por defecto */ }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { document.title = `${settings.restaurantName} · Pedidos` }, [settings.restaurantName])
  const value = useMemo(() => ({ settings, refresh }), [settings, refresh])
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}

export const useSettings = () => useContext(SettingsCtx)
