import { useCallback, useEffect, useState } from 'react'
import { bajaCliente, bajaVehiculo, cancelarReserva, obtenerClientes, obtenerReservas, obtenerVehiculos, reactivarCliente, reactivarVehiculo} from '../../services/api'
import type { Cliente, Reserva, ReservaFiltro, EstadoReserva, Vehiculo } from '../../types/domain'
import { ActionCard } from './components/ActionCard'
import { ClientGrid } from './components/ClientGrid'
import { ReservationGrid } from './components/ReservationGrid'
import { RegistrationModal, type RegistrationType } from './components/RegistrationModal'
import { VehicleGrid } from './components/VehicleGrid'

type View = 'clientes' | 'vehiculos' | 'reservas'
type RegistroBaja = | { tipo: 'cliente'; registro: Cliente }
                    | { tipo: 'vehiculo'; registro: Vehiculo }

const sections: { id: View; label: string }[] = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'vehiculos', label: 'Vehículos' },
  { id: 'reservas', label: 'Reservas' },
]

function mensajeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [errorClients, setErrorClients] = useState('')
  const [errorVehicles, setErrorVehicles] = useState('')
  const [errorReservations, setErrorReservations] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeView, setActiveView] = useState<View>('clientes')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODAS')
  const [clienteFiltro, setClienteFiltro] = useState('')
  const [vehiculoFiltro, setVehiculoFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroAplicado, setFiltroAplicado] = useState<ReservaFiltro>({})
  const [modal, setModal] = useState<RegistrationType | null>(null)
  const [registroEdicion, setRegistroEdicion] = useState<Cliente | Vehiculo | undefined>(undefined)
  const [registroBaja, setRegistroBaja] = useState<RegistroBaja | null>(null)
  const [procesandoBaja, setProcesandoBaja] = useState(false)
  const [errorBaja, setErrorBaja] = useState('')

    const loadClients = useCallback(async () => {
    setLoadingClients(true)
    setErrorClients('')
    try {setClientes(await obtenerClientes())
      } catch (error) {
        setErrorClients(mensajeError(error, 'No se pudieron cargar los clientes.'))
      } finally {setLoadingClients(false)}
  }, [])

  const loadVehicles = useCallback(async () => {
    setLoadingVehicles(true)
    setErrorVehicles('')
    try {setVehiculos(await obtenerVehiculos())
      } catch (error) {
        setErrorVehicles(mensajeError(error, 'No se pudieron cargar los vehículos.'))
    } finally {setLoadingVehicles(false)}
  }, [])

  const loadReservations = useCallback(async () => {
    setLoadingReservations(true)
    setErrorReservations('')
    try {setReservas(await obtenerReservas(filtroAplicado))
    } catch (error) {
      setErrorReservations(mensajeError(error, 'No se pudieron cargar las reservas.'))
    } finally {setLoadingReservations(false)}
  }, [filtroAplicado])

  useEffect(() => {
    if (activeView === 'clientes') void loadClients()
    if (activeView === 'vehiculos') void loadVehicles()
    if (activeView === 'reservas') { void loadReservations(), void loadClients(), void loadVehicles()}
  }, [activeView, loadClients, loadVehicles, loadReservations])

  const openRegistration = (type: RegistrationType) => {
    setRegistroEdicion(undefined)
    setModal(type)
  }

  const openEdition = (type: 'cliente' | 'vehiculo', registro: Cliente | Vehiculo) => {
    setRegistroEdicion(registro)
    setModal(type)
  }

  const closeRegistration = () => {
    setModal(null)
    setRegistroEdicion(undefined)
  }

  const handleSaved = () => {
    const tipo = modal
    closeRegistration()
    if (tipo === 'cliente') void loadClients()
    if (tipo === 'vehiculo') void loadVehicles()
    if (tipo === 'reserva') void loadReservations()
  }

  const solicitarBajaCliente = (client: Cliente) => {
    setErrorBaja('')
    setRegistroBaja({ tipo: 'cliente', registro: client })
  }

  const solicitarBajaVehiculo = (vehicle: Vehiculo) => {
    setErrorBaja('')
    setRegistroBaja({ tipo: 'vehiculo', registro: vehicle })
  }

  const confirmarBaja = async () => {
    if (!registroBaja || procesandoBaja) return
    setProcesandoBaja(true)
    setErrorBaja('')
    try {
      if (registroBaja.tipo === 'cliente') {
        await bajaCliente(registroBaja.registro.id)
        await loadClients()
      } else {
        await bajaVehiculo(registroBaja.registro.id)
        await loadVehicles()
      }
      setRegistroBaja(null)
    } catch (error) {
      setErrorBaja(mensajeError(error, 'No se pudo realizar la baja.'))
    } finally {setProcesandoBaja(false)}
  }

  const handleReactivateClient = async (client: Cliente) => {
    try {await reactivarCliente(client.id)
         await loadClients()} 
	  catch (error) {setErrorClients(mensajeError(error, 'No se pudo reactivar el cliente.'))}
  }

  const handleReactivateVehicle = async (vehicle: Vehiculo) => {
    try {await reactivarVehiculo(vehicle.id)
         await loadVehicles()
    } catch (error) {setErrorVehicles(mensajeError(error, 'No se pudo reactivar el vehículo.'))}
  }

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('¿Desea cancelar esta reserva?')) return
    setSuccessMessage('')
    try {
      await cancelarReserva(id)
      setSuccessMessage('Reserva cancelada correctamente.')
      await loadReservations()
    } catch (error) {
      setErrorReservations(mensajeError(error, 'No se pudo cancelar la reserva.'))
    }
  }

  const filteredReservations = reservas.filter((reservation) => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = !normalizedSearch ||
      `${reservation.cliente.nombre} ${reservation.cliente.apellido} ${reservation.cliente.documento} ${reservation.vehiculo.marca} ${reservation.vehiculo.modelo} ${reservation.patente}`.toLowerCase().includes(normalizedSearch)
    return matchesSearch
  })

  const aplicarFiltros = () => {
    if (fechaDesde && fechaHasta && fechaHasta < fechaDesde) {
      setErrorReservations('La fecha hasta no puede ser anterior a la fecha desde.')
      return
    }
    setErrorReservations('')
    setFiltroAplicado({
      clienteId: clienteFiltro ? Number(clienteFiltro) : undefined,
      vehiculoId: vehiculoFiltro ? Number(vehiculoFiltro) : undefined,
      tipoVehiculo: tipoFiltro || undefined,
      estadoReserva: statusFilter === 'TODAS' ? undefined : statusFilter as EstadoReserva,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    })
  }

  const limpiarFiltros = () => {
    setClienteFiltro(''); setVehiculoFiltro(''); setTipoFiltro('')
    setFechaDesde(''); setFechaHasta(''); setStatusFilter('TODAS'); setSearch('')
    setErrorReservations(''); setFiltroAplicado({})
  }

  const titulo = activeView === 'clientes'
    ? 'Gestión de clientes'
    : activeView === 'vehiculos' ? 'Gestión de vehículos' : 'Gestión de alquileres'

  const nombreRegistroBaja = registroBaja
    ? registroBaja.tipo === 'cliente'
      ? `${registroBaja.registro.nombre} ${registroBaja.registro.apellido}`
      : `${registroBaja.registro.marca} ${registroBaja.registro.modelo} (${registroBaja.registro.patente})`
    : ''

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">R</span><span>rentar</span></div>
        <div className="topbar-right">
          <span className="connection-dot" />
          <span className="user-label">Panel de administración</span>
          <span className="avatar">AD</span>
          <button className="secondary-button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <p className="sidebar-label">Administración</p>
          <nav className="main-nav" aria-label="Secciones principales">
            {sections.map(({ id, label }) => (
              <button type="button" key={id} className={activeView === id ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveView(id); setSuccessMessage('') }}>
                <span className={`nav-icon nav-icon-${id}`} />{label}
              </button>
            ))}</nav>
        </aside>

        <main className="dashboard">
          <section className="welcome">
            <div><p className="eyebrow">Reservas</p><h1>{titulo}</h1>
              <p className="subtitle">{activeView === 'reservas'
                  ? 'Supervisá el estado de tu operación diaria.'
                  : `Consultá y administrá la información de ${activeView}.`}</p>
            </div>
            <span className="date-label">
              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date())}
            </span>
          </section>

          {activeView === 'clientes' && (
            <section className="reservations-section">
              <div className="section-heading"><h2>Clientes registrados</h2>
                <span className="count-badge">{clientes.length} clientes</span>
              </div>
              {errorClients && (<div className="alert error" role="alert">
                  {errorClients} <button type="button" onClick={() => void loadClients()}>Reintentar</button>
                </div>
              )}
              <div className="module-toolbar">
                <p>Registrá, editá o da de baja a los clientes.</p>
                <button type="button" className="primary-button" onClick={() => openRegistration('cliente')}>
                  + Nuevo cliente</button>
              </div>
              <ClientGrid
                clients={clientes}
                loading={loadingClients}
                onEdit={(client) => openEdition('cliente', client)}
                onDeactivate={solicitarBajaCliente}
                onReactivate={(client) => void handleReactivateClient(client)}/>
            </section>
          )}

          {activeView === 'vehiculos' && (
            <section className="reservations-section">
              <div className="section-heading">
                <h2>Vehículos registrados</h2>
                <span className="count-badge">{vehiculos.length} vehículos</span>
              </div>
              {errorVehicles && (
                <div className="alert error" role="alert">
                  {errorVehicles} <button type="button" onClick={() => void loadVehicles()}>Reintentar</button>
                </div>
              )}
              <div className="module-toolbar">
                <p>Registrá, editá o da de baja a los vehículos de la flota.</p>
                <button type="button" className="primary-button" onClick={() => openRegistration('vehiculo')}>
                  + Nuevo vehículo
                </button>
              </div>
              <VehicleGrid
                vehicles={vehiculos}
                loading={loadingVehicles}
                onEdit={(vehicle) => openEdition('vehiculo', vehicle)}
                onDeactivate={solicitarBajaVehiculo}
                onReactivate={(vehicle) => void handleReactivateVehicle(vehicle)}
              />
            </section>
          )}

          {activeView === 'reservas' && (
            <>
              <section className="metric-grid" aria-label="Resumen de operación">
                <div className="metric-card">
                  <span className="metric-label">Reservas activas</span>
                  <strong>{reservas.filter(r => r.estadoReserva === 'CONFIRMADA' || r.estadoReserva === 'PENDIENTE').length}</strong><small>Dentro de la consulta actual</small>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Confirmadas</span>
                  <strong>{reservas.filter((r) => r.estadoReserva === 'CONFIRMADA').length}</strong>
                  <small>Reservas confirmadas</small>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Pendientes</span>
                  <strong>{reservas.filter((r) => r.estadoReserva === 'PENDIENTE').length}</strong>
                  <small>Requieren atención</small>
                </div>
              </section>
              <section className="action-grid" aria-label="Acciones de reservas">
                <ActionCard icon="+" title="Nueva reserva" description="Creá una reserva para un cliente." onClick={() => openRegistration('reserva')} />
              </section>
              <section className="reservations-section">
                <div className="section-heading">
                  <div><p className="eyebrow">Agenda</p><h2>Consulta de reservas</h2></div>
                  <span className="count-badge">{filteredReservations.length} de {reservas.length}</span>
                </div>
                <div className="table-toolbar">
                  <label className="search-box">
                    <span>⌕</span>
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, documento, patente o vehículo" />
                  </label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado">
                    <option value="TODAS">Todos los estados</option>
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="CONFIRMADA">Confirmadas</option>
                    <option value="CANCELADA">Canceladas</option>
                    <option value="TERMINADA">Terminadas</option>
                  </select>
                </div>
                <div className="form-grid">
                  <label><span>Cliente</span><select value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)} disabled={loadingClients}>
                    <option value="">Todos los clientes</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} — {c.documento}</option>)}
                  </select></label>
                  <label><span>Vehículo</span><select value={vehiculoFiltro} onChange={e => setVehiculoFiltro(e.target.value)} disabled={loadingVehicles}>
                    <option value="">Todos los vehículos</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.patente}</option>)}
                  </select></label>
                  <label><span>Tipo de vehículo</span><select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {['SEDAN', 'SUV', 'PICKUP', 'COUPE', 'HATCHBACK'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select></label>
                  <label><span>Desde</span><input type="datetime-local" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} /></label>
                  <label><span>Hasta</span><input type="datetime-local" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} /></label>
                </div>
                <p>El rango incluye reservas cuyo inicio y fin estén dentro de las fechas elegidas.</p>
                {errorClients && <p className="form-error">No se pudieron cargar los clientes para el filtro. <button type="button" onClick={() => void loadClients()}>Reintentar</button></p>}
                {errorVehicles && <p className="form-error">No se pudieron cargar los vehículos para el filtro. <button type="button" onClick={() => void loadVehicles()}>Reintentar</button></p>}
                <div className="modal-actions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap',}}>
                  <button type="button" className="secondary-button" onClick={limpiarFiltros}>Limpiar filtros</button>
                  <button type="button" className="primary-button" onClick={aplicarFiltros} disabled={loadingReservations}>Aplicar filtros</button>
                </div>
                {errorReservations && (
                  <div className="alert error" role="alert">
                    {errorReservations} <button type="button" onClick={() => void loadReservations()}>Reintentar</button>
                  </div>
                )}
                {successMessage && <div className="alert success" role="status">{successMessage}</div>}
                <ReservationGrid reservations={filteredReservations} loading={loadingReservations} onCancelReservation={handleCancelReservation} />
              </section>
            </>
          )}
        </main>
      </div>

      {modal && (
        <RegistrationModal
          key={`${modal}-${registroEdicion?.id ?? 'nuevo'}`}
          type={modal}
          registro={registroEdicion}
          onClose={closeRegistration}
          onSaved={handleSaved}
        />
      )}

      {registroBaja && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="baja-title" aria-describedby="baja-description">
            <div className="modal-heading"><h2 id="baja-title">Confirmar baja</h2></div>
            <p id="baja-description">
              ¿Querés dar de baja a <strong>{nombreRegistroBaja}</strong>?
              El registro quedará inactivo y conservará su historial.
            </p>
            {errorBaja && <p className="form-error" role="alert">{errorBaja}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={procesandoBaja} onClick={() => setRegistroBaja(null)}>
                Cancelar
              </button>
              <button type="button" className="primary-button" disabled={procesandoBaja} onClick={() => void confirmarBaja()} autoFocus>
                {procesandoBaja ? 'Procesando...' : 'Confirmar baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
