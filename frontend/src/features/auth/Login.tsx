import { useState, type FormEvent } from 'react'

export type Rol = 'ADMIN' | 'CLIENTE'

// Credenciales del usuario logueado (solo en memoria: al recargar se vuelve al login).
let credenciales = ''

// Wrapper de fetch: agrega las credenciales a todas las llamadas a la API.
// El header X-Requested-With hace que Spring no pida el login con la ventana emergente.
const fetchOriginal = window.fetch.bind(window)
window.fetch = (input, init) => {
  const headers = new Headers(init?.headers)
  headers.set('X-Requested-With', 'XMLHttpRequest')
  if (credenciales) headers.set('Authorization', 'Basic ' + credenciales)
  return fetchOriginal(input, { ...init, headers })
}

export function cerrarSesion() {
  credenciales = ''
}

export function Login({ onLogin }: { onLogin: (rol: Rol) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function ingresar(event: FormEvent) {
    event.preventDefault()
    setError('')
    credenciales = btoa(`${email}:${password}`)

    // /api/clientes es solo para ADMIN: 200 = ADMIN, 403 = CLIENTE, 401 = datos incorrectos
    const response = await fetch('/api/clientes')
    if (response.status === 200) return onLogin('ADMIN')
    if (response.status === 403) return onLogin('CLIENTE')

    credenciales = ''
    setError(response.status === 401 ? 'Correo o contraseña incorrectos' : 'No se pudo iniciar sesión')
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={ingresar} style={{ display: 'grid', gap: 16, width: 'min(380px, 100%)' }}>
        <h2>Iniciar sesión</h2>
        <label>
          <span>Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit">Ingresar</button>
        <a href="#" onClick={(e) => { e.preventDefault(); setError('Contactá a un administrador') }}>
          ¿Olvidaste tu contraseña?
        </a>
      </form>
    </div>
  )
}
