import { useEffect, useState } from 'react'
import { Login } from '../features/auth/Login'
import { cerrarSesion, configurarPerdidaSesion, type Sesion } from '../services/api'
import { ClienteDashboard } from '../features/cliente/ClienteDashboard'
import { Dashboard } from '../features/dashboard/Dashboard'

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    configurarPerdidaSesion(() => {
      setSesion(null)
      setAviso('Tu sesión ya no es válida. Volvé a ingresar.')
    })
    return () => configurarPerdidaSesion(undefined)
  }, [])

  function logout() {
    cerrarSesion()
    setSesion(null)
    setAviso('')
  }

  // Sin sesión validada no se monta ningún panel.
  if (!sesion) return <Login aviso={aviso} onLogin={usuario => { setSesion(usuario); setAviso('') }} />
  if (sesion.rol === 'ADMIN') return <Dashboard nombre={sesion.nombre} onLogout={logout} />
  return <ClienteDashboard sesion={sesion} onLogout={logout} />
}

