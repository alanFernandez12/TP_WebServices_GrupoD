import type { Reserva } from '../../../types/domain'

export function ReservationGrid({ reservations, loading, onCancelReservation }: {
  reservations: Reserva[]
  loading: boolean
  onCancelReservation: (id: number) => void | Promise<void>
}) {
  if (loading) return <div className="empty-state">Cargando reservas...</div>
  if (!reservations.length) return <div className="empty-state">No hay reservas que coincidan con los filtros.</div>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>Cliente</th><th>Vehículo</th><th>Patente</th><th>Inicio</th><th>Fin</th>
          <th>Precio diario</th><th>Importe total</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody>{reservations.map((reserva) => (
          <tr key={reserva.id}>
            <td>{reserva.cliente.nombre} {reserva.cliente.apellido}</td>
            <td>{reserva.vehiculo.marca} {reserva.vehiculo.modelo}</td><td>{reserva.patente}</td>
            <td>{formatDate(reserva.horaInicio)}</td><td>{formatDate(reserva.horaFin)}</td>
            <td>{money(reserva.precioDiarioHistorico)}</td><td>{money(reserva.importeTotal)}</td>
            <td><span className={`status status-${reserva.estadoReserva.toLowerCase()}`}>{reserva.estadoReserva}</span></td>
            <td>{reserva.estadoReserva === 'CONFIRMADA' && new Date(reserva.horaInicio).getTime() > Date.now() && (
              <button type="button" className="cancel-action-button" onClick={() => void onCancelReservation(reserva.id)}>Cancelar reserva</button>
            )}</td></tr>
        ))}</tbody></table>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
function money(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}
