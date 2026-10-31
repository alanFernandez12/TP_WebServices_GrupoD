import type { Cliente, Reserva, Vehiculo } from '../../../types/domain'

type Detail =
  | { type: 'cliente'; registro: Cliente }
  | { type: 'vehiculo'; registro: Vehiculo }
  | { type: 'reserva'; registro: Reserva }

interface Props {
  detail: Detail
  loading: boolean
  error: string
  onClose: () => void
}

const labels = {
  cliente: 'Detalle del cliente',
  vehiculo: 'Detalle del vehículo',
  reserva: 'Detalle de la reserva',
}

export function DetailModal({ detail, loading, error, onClose }: Props) {
  const fields = detail.type === 'cliente'
    ? [
        ['Nombre', `${detail.registro.nombre} ${detail.registro.apellido}`],
        ['Documento', detail.registro.documento],
        ['Email', detail.registro.email],
        ['Teléfono', detail.registro.telefono || '—'],
        ['Estado', detail.registro.activo ? 'ACTIVO' : 'INACTIVO'],
      ]
    : detail.type === 'vehiculo'
      ? [
          ['Vehículo', `${detail.registro.marca} ${detail.registro.modelo}`],
          ['Patente', detail.registro.patente],
          ['Tipo', detail.registro.tipoVehiculo],
          ['Año', String(detail.registro.anio)],
          ['Color', detail.registro.color || '—'],
          ['Precio diario', money(detail.registro.precio_diario)],
          ...(detail.registro.resultadoPatente !== undefined
            ? [
                ['Resultado patente', detail.registro.resultadoPatente || 'Pendiente'],
                ['Resultado titularidad', detail.registro.resultadoTitularidad || 'Pendiente'],
                ['Resultado final', detail.registro.resultadoFinal || 'Pendiente'],
              ]
            : []),
          ['Estado', detail.registro.estado],
          ['Activo', detail.registro.activo ? 'SÍ' : 'NO'],
        ]
      : [
          ['Cliente', `${detail.registro.cliente.nombre} ${detail.registro.cliente.apellido}`],
          ['Vehículo', `${detail.registro.vehiculo.marca} ${detail.registro.vehiculo.modelo}`],
          ['Patente', detail.registro.patente || '—'],
          ['Inicio', formatDate(detail.registro.horaInicio)],
          ['Fin', formatDate(detail.registro.horaFin)],
          ['Duración', `${duration(detail.registro.horaInicio, detail.registro.horaFin)} días`],
          ['Precio diario', money(detail.registro.precioDiarioHistorico)],
          ['Importe total', money(detail.registro.importeTotal)],
          ['Estado', detail.registro.estadoReserva],
          ['Mantenimiento', { REALIZADO: 'Realizado', NO_REALIZADO: 'No realizado' }[detail.registro.descMantenimiento ?? ''] ?? 'Pendiente'],
        ]

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose()
    }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Consulta</p>
            <h2 id="detail-title">{labels[detail.type]}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} disabled={loading} aria-label="Cerrar">×</button>
        </div>
        {loading && <p className="detail-loading">Consultando información...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && (
          <div className="detail-grid">
            {fields.map(([label, value]) => (
              <div className="detail-field" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function money(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function duration(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000))
}

export type DetailRegistro = Detail
