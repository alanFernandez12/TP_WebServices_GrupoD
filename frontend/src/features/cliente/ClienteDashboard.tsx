import { useCallback, useEffect, useState } from 'react'
import { cancelarReserva, obtenerReserva, obtenerReservas, type Sesion } from '../../services/api'
import type { EstadoReserva, Reserva, ReservaFiltro } from '../../types/domain'
import { ReservationGrid } from '../dashboard/components/ReservationGrid'
import { DetailModal, type DetailRegistro } from '../dashboard/components/DetailModal'
import { Disponibilidad } from './Disponibilidad'
import { HistorialAlquileres } from './HistorialAlquileres'

export function ClienteDashboard({ sesion, onLogout }: { sesion: Sesion; onLogout: () => void }) {
  const [seccion, setSeccion] = useState<'reservas' | 'disponibilidad' | 'historial'>('reservas')
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtro, setFiltro] = useState<ReservaFiltro>({})
  const [cancelando, setCancelando] = useState(false)
  const [detalle, setDetalle] = useState<DetailRegistro | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try { setReservas(await obtenerReservas(filtro)) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron consultar las reservas.') }
    finally { setLoading(false) }
  }, [filtro])
  useEffect(() => { void cargar() }, [cargar])

  const verReserva = async (registro: Reserva) => {
    setDetalle({ type: 'reserva', registro })
    setErrorDetalle('')
    setCargandoDetalle(true)
    try {
      const actualizada = await obtenerReserva(registro.id)
      setDetalle({ type: 'reserva', registro: { ...registro, ...actualizada } })
    } catch (e) {
      setErrorDetalle(e instanceof Error ? e.message : 'No se pudo consultar la reserva.')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const resultados = reservas.filter(r =>
    `${r.vehiculo.marca} ${r.vehiculo.modelo} ${r.patente}`.toLowerCase().includes(search.trim().toLowerCase()))

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">R</span><span>rentar</span></div>
      <div className="topbar-right">
        <span className="user-label">Hola, {sesion.nombre}</span>
        <button type="button" className="secondary-button" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </header>
    <div className="workspace">
      <aside className="sidebar">
        <p className="sidebar-label">Mi cuenta</p>
        <nav className="main-nav" aria-label="Secciones del cliente">
          <button type="button" className={`nav-item ${seccion === 'reservas' ? 'active' : ''}`} onClick={() => setSeccion('reservas')}><span className="nav-icon nav-icon-reservas" />Mis reservas</button>
          <button type="button" className={`nav-item ${seccion === 'disponibilidad' ? 'active' : ''}`} onClick={() => setSeccion('disponibilidad')}><span className="nav-icon" />Disponibilidad</button>
          <button type="button" className={`nav-item ${seccion === 'historial' ? 'active' : ''}`} onClick={() => setSeccion('historial')}><span className="nav-icon nav-icon-reservas" />Historial de alquileres</button>
        </nav>
      </aside>
      <main className="dashboard" style={{ minWidth: 0 }}>
        {seccion === 'disponibilidad' ? <Disponibilidad /> : seccion === 'historial' ? <HistorialAlquileres /> : <>
        <section className="welcome"><div>
          <p className="eyebrow">Reservas</p><h1>Mis reservas</h1>
          <p className="subtitle">Consultá tus reservas y cancelá las que todavía no comenzaron.</p>
        </div></section>
        <section className="reservations-section">
          <div className="section-heading"><h2>Consulta de reservas</h2><span className="count-badge">{resultados.length} reservas</span></div>
          <div className="table-toolbar">
            <label className="search-box"><span>⌕</span><input aria-label="Buscar vehículo" placeholder="Buscar por marca, modelo o patente" value={search} onChange={e => setSearch(e.target.value)} /></label>
          </div>
          <div className="form-grid">
            <label><span>Estado</span><select value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'TERMINADA'].map(s => <option key={s} value={s}>{s}</option>)}
            </select></label>
            <label><span>Tipo de vehículo</span><select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {['SEDAN', 'SUV', 'PICKUP', 'COUPE', 'HATCHBACK'].map(t => <option key={t} value={t}>{t}</option>)}
            </select></label>
            <label><span>Desde</span><input type="datetime-local" value={desde} onChange={e => setDesde(e.target.value)} /></label>
            <label><span>Hasta</span><input type="datetime-local" value={hasta} onChange={e => setHasta(e.target.value)} /></label>
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
            <button type="button" className="secondary-button" onClick={() => {
              setEstado(''); setTipo(''); setDesde(''); setHasta(''); setSearch(''); setSuccess(''); setFiltro({})
            }}>Limpiar filtros</button>
            <button type="button" className="primary-button" disabled={loading} onClick={() => {
              if (desde && hasta && hasta < desde) { setError('La fecha hasta no puede ser anterior a la fecha desde.'); return }
              setSuccess(''); setFiltro({estadoReserva: estado ? estado as EstadoReserva : undefined, tipoVehiculo: tipo || undefined, fechaDesde: desde || undefined, fechaHasta: hasta || undefined})
            }}>Aplicar filtros</button>
          </div>
          {error && <div className="alert error" role="alert">{error} <button type="button" onClick={() => void cargar()}>Reintentar</button></div>}
          {success && <div className="alert success" role="status">{success}</div>}
          <div aria-busy={cancelando} style={cancelando ? { pointerEvents: 'none', opacity: 0.65 } : undefined}>
            <ReservationGrid reservations={resultados} loading={loading} onView={registro => void verReserva(registro)} onCancelReservation={async id => {
              if (cancelando || !window.confirm('¿Querés cancelar esta reserva?')) return
              setCancelando(true); setError(''); setSuccess('')
              try { await cancelarReserva(id); setSuccess('Reserva cancelada correctamente.'); await cargar() }
              catch(e) { setError(e instanceof Error ? e.message : 'No se pudo cancelar la reserva.') }
              finally { setCancelando(false) }
            }} />
          </div>
        </section>
        </>}
      </main>
    </div>
    {detalle && <DetailModal detail={detalle} loading={cargandoDetalle} error={errorDetalle} onClose={() => {
      if (!cargandoDetalle) { setDetalle(null); setErrorDetalle('') }
    }} />}
  </div>
}
