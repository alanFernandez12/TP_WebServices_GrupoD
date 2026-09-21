import type { Reserva } from '../../../types/domain'

export function ReservationGrid({ reservations, loading, onCancelReservation}: { reservations: Reserva[]; loading: boolean; onCancelReservation: (id: number) => void | Promise<void>}) {
  if (loading) return <div className="empty-state">Cargando reservas...</div>
  if (!reservations.length) return <div className="empty-state"><span className="empty-icon">◷</span><strong>No hay reservas activas</strong><span>Las nuevas reservas aparecerán en esta grilla.</span></div>
  return ( <div className="table-wrap"> <table> <thead> <tr> <th>Reserva</th> <th>Cliente</th> <th>Vehículo</th> <th>Inicio</th> <th>Fin</th> <th>Importe</th> <th>Estado</th> <th>Acciones</th> </tr> </thead> <tbody> {reservations.map((reservation) => ( <tr key={reservation.id}> <td className="strong">#{reservation.id}</td> <td>Cliente #{reservation.idCliente}</td> <td>Vehículo #{reservation.idVehiculo}</td> <td>{formatDate(reservation.horaInicio)}</td> <td>{formatDate(reservation.horaFin)}</td> <td className="strong"> ${Number(reservation.importeTotal).toLocaleString('es-AR')} </td> <td> <span className={`status status-${reservation.estadoReserva.toLowerCase()}`}> {reservation.estadoReserva} </span> </td> <td> <button type="button" className="cancel-action-button" onClick={() => void onCancelReservation(reservation.id)} > Cancelar Reserva </button> </td> </tr> ))} </tbody> </table> </div> )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
