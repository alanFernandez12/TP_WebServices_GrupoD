import type { Vehiculo } from '../../../types/domain'

interface Props {
  vehicles: Vehiculo[]
  loading: boolean
}

export function VehicleGrid({ vehicles, loading }: Props) {
  if (loading) return <div className="empty-state">Cargando vehículos...</div>
  if (!vehicles.length) return <div className="empty-state"><span className="empty-icon">▣</span><strong>No hay vehículos registrados</strong><span>Los nuevos vehículos aparecerán en esta grilla.</span></div>

  return <div className="table-wrap"><table><thead><tr><th>Vehículo</th><th>Patente</th><th>Tipo</th><th>Año</th><th>Color</th><th>Precio diario</th><th>Estado</th></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong className="strong">{vehicle.marca} {vehicle.modelo}</strong><small className="table-detail">ID #{vehicle.id}</small></td><td>{vehicle.patente}</td><td>{vehicle.tipoVehiculo}</td><td>{vehicle.anio}</td><td>{vehicle.color || '—'}</td><td className="strong">${Number(vehicle.precio_diario).toLocaleString('es-AR')}</td><td><span className={`status ${vehicle.activo ? 'status-confirmada' : 'status-cancelada'}`}>{vehicle.activo ? 'ACTIVO' : 'INACTIVO'}</span></td></tr>)}</tbody></table></div>
}
