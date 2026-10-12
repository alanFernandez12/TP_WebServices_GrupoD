import { useState } from 'react'
import { cerrarSesion, Login, type Rol } from '../features/auth/Login'
import { ClienteDashboard } from '../features/cliente/ClienteDashboard'
import { Dashboard } from '../features/dashboard/Dashboard'

export default function App() {
  const [rol, setRol] = useState<Rol | null>(null)

  function logout() {
    cerrarSesion()
    setRol(null)
  }

  if (rol === 'ADMIN') return <Dashboard onLogout={logout} />
  if (rol === 'CLIENTE') return <ClienteDashboard onLogout={logout} />
  return <Login onLogin={setRol} />
}
