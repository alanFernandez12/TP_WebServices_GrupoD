import { useState} from 'react'
import { iniciarSesion, type Sesion } from '../../services/api'

export type Rol = 'ADMIN' | 'CLIENTE'


export function Login({ onLogin, aviso = '' }: { onLogin: (sesion: Sesion) => void; aviso?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={async event => {
        event.preventDefault()
        if (loading) return
        setError(''); setLoading(true)
        try { const sesion = await iniciarSesion(email, password); setPassword(''); onLogin(sesion) }
        catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión') }
        finally { setLoading(false) }
      }} style={{ display: 'grid', gap: 16, width: 'min(380px, 100%)' }}>
        <h2>Iniciar sesión</h2>
        <label><span>Correo</span>
          <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
        </label>
        <label>
          <span>Contraseña</span>
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
        </label>
        {(error || aviso) && <p className="form-error" role="alert">{error || aviso}</p>}
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
    </div>
  )
}
