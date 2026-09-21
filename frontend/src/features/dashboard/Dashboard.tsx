import { useCallback, useEffect, useState } from 'react'
import {cancelarReserva, obtenerClientes, obtenerReservas, obtenerVehiculos } from '../../services/api'
import type { Cliente, Reserva, Vehiculo } from '../../types/domain'
import { ActionCard } from './components/ActionCard'
import { ClientGrid } from './components/ClientGrid'
import { ReservationGrid } from './components/ReservationGrid'
import { RegistrationModal, type RegistrationType } from './components/RegistrationModal'
import { VehicleGrid } from './components/VehicleGrid'

export function Dashboard() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<RegistrationType | null>(null)
  const [activeView, setActiveView] = useState('reservas')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODAS')

  const loadReservations = useCallback(async () => {
    setLoading(true)
    try {
      const all = await obtenerReservas()
      setReservas(all.filter(({ estadoReserva }) => estadoReserva === 'PENDIENTE' || estadoReserva === 'CONFIRMADA'))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las reservas.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      setVehiculos(await obtenerVehiculos())
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los vehículos.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      setClientes(await obtenerClientes())
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadReservations() }, [loadReservations])
  useEffect(() => {
    if (activeView === 'vehiculos') void loadVehicles()
    if (activeView === 'clientes') void loadClients()
  }, [activeView, loadClients, loadVehicles])

  const filteredReservations = reservas.filter((reservation) => {
    const matchesStatus = statusFilter === 'TODAS' || reservation.estadoReserva === statusFilter
    const normalizedSearch = search.toLowerCase()
    const matchesSearch = !normalizedSearch || `${reservation.id} ${reservation.idCliente} ${reservation.idVehiculo}`.includes(normalizedSearch)
    return matchesStatus && matchesSearch
  })

  const openRegistration = (type: RegistrationType) => setModal(type)
  const [successMessage, setSuccessMessage] = useState('')

  const handleCancelReservation = useCallback(async (id: number) => {
    const confirmed = window.confirm('¿Desea cancelar esta reserva?')
    if (!confirmed) return

    try {
      await cancelarReserva(id)
      setError('')
      setSuccessMessage('Reserva cancelada correctamente.')
      await loadReservations()
    } catch (requestError) {
      setError(
          requestError instanceof Error
              ? requestError.message
              : 'No se pudo cancelar la reserva.'
      )
      setSuccessMessage('')
    }
  }, [loadReservations])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">R</span><span>rentar</span></div>
        <div className="topbar-right"><span className="connection-dot" /> <span className="user-label">Panel de administración</span><span className="avatar">AD</span></div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <p className="sidebar-label">Gestión</p>
          <nav className="main-nav" aria-label="Secciones principales">
            {['reservas', 'vehiculos', 'clientes'].map((view) => <button key={view} className={activeView === view ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView(view)}><span className={`nav-icon nav-icon-${view}`} />{view[0].toUpperCase() + view.slice(1)}</button>)}
          </nav>
          <div className="sidebar-footer"><span className="help-mark">?</span><div><strong>Centro de ayuda</strong><small>Soporte de operaciones</small></div></div>
        </aside>
        <main className="dashboard">
        <section className="welcome">
          <div>{activeView === 'reservas' && <p className="eyebrow">Operaciones</p>}<h1>{activeView === 'reservas' ? 'Gestión de alquileres' : activeView === 'vehiculos' ? 'Gestión Vehículos' : 'Gestión Cliente'}</h1><p className="subtitle">{activeView === 'reservas' ? 'Supervisá el estado de tu operación diaria.' : `Consultá y administrá la información de ${activeView}.`}</p></div>
          <span className="date-label">{new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(new Date())}</span>
        </section>
        {activeView === 'reservas' && <>
        <section className="metric-grid" aria-label="Resumen de operación"><div className="metric-card"><span className="metric-label">Reservas activas</span><strong>{reservas.length}</strong><small>En curso o pendientes</small></div><div className="metric-card"><span className="metric-label">Confirmadas</span><strong>{reservas.filter(({ estadoReserva }) => estadoReserva === 'CONFIRMADA').length}</strong><small>Listas para entregar</small></div><div className="metric-card"><span className="metric-label">Pendientes</span><strong>{reservas.filter(({ estadoReserva }) => estadoReserva === 'PENDIENTE').length}</strong><small>Requieren atención</small></div></section>
        <section className="action-grid" aria-label="Acciones rápidas">
          <ActionCard icon="+" title="Nueva reserva" description="Creá una reserva para un cliente." onClick={() => openRegistration('reserva')} />
          <ActionCard icon="▣" title="Nuevo vehículo" description="Incorporá un vehículo a la flota." onClick={() => openRegistration('vehiculo')} />
          <ActionCard icon="○" title="Nuevo cliente" description="Registrá los datos de un cliente." onClick={() => openRegistration('cliente')} />
        </section>
        <section className="reservations-section">
          <div className="section-heading"><div><p className="eyebrow">Agenda</p><h2>Reservas activas</h2></div><span className="count-badge">{filteredReservations.length} de {reservas.length}</span></div>
          <div className="table-toolbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por reserva, cliente o vehículo" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado"><option value="TODAS">Todos los estados</option><option value="PENDIENTE">Pendientes</option><option value="CONFIRMADA">Confirmadas</option></select></div>
          {error && ( <div className="alert error"> {error} <button onClick={() => void loadReservations()}>Reintentar</button> </div> )}
          {successMessage && ( <div className="alert success"> {successMessage} </div> )}
          <ReservationGrid reservations={filteredReservations} loading={loading} onCancelReservation={handleCancelReservation}/>
        </section>
        </>}
        {activeView === 'vehiculos' && <section className="reservations-section">
          <div className="section-heading"><div><h2>Vehículos registrados</h2></div><span className="count-badge">{vehiculos.length} vehículos</span></div>
          {error && <div className="alert">{error} <button onClick={() => void loadVehicles()}>Reintentar</button></div>}
          <div className="module-toolbar"><p>Consultá el estado y los datos principales de cada vehículo.</p><button className="primary-button" onClick={() => openRegistration('vehiculo')}>+ Nuevo vehículo</button></div>
          <VehicleGrid vehicles={vehiculos} loading={loading} />
        </section>}
        {activeView === 'clientes' && <section className="reservations-section">
          <div className="section-heading"><div><h2>Clientes registrados</h2></div><span className="count-badge">{clientes.length} clientes</span></div>
          {error && <div className="alert">{error} <button onClick={() => void loadClients()}>Reintentar</button></div>}
          <div className="module-toolbar"><p>Consultá los datos de contacto y el estado de cada cliente.</p><button className="primary-button" onClick={() => openRegistration('cliente')}>+ Nuevo cliente</button></div>
          <ClientGrid clients={clientes} loading={loading} />
        </section>}
      </main>
      </div>
      {modal && <RegistrationModal type={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); if (modal === 'reserva') void loadReservations(); if (modal === 'vehiculo') void loadVehicles(); if (modal === 'cliente') void loadClients() }} />}
    </div>
  )
}
