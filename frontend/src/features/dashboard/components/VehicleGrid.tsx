import type { Vehiculo } from '../../../types/domain'

interface Props {
  vehicles: Vehiculo[]
  loading: boolean
  onEdit: (vehicle: Vehiculo) => void
  onDeactivate: (vehicle: Vehiculo) => void
  onReactivate: (vehicle: Vehiculo) => void
}

export function VehicleGrid({ vehicles, loading, onEdit, onDeactivate, onReactivate}: Props) {
  
  if (loading) 
    return <div className="empty-state">Cargando vehículos...</div>
  
  if (!vehicles.length) 
    return <div className="empty-state"><span className="empty-icon">▣</span>
           <strong>No hay vehículos registrados</strong>
           <span>Los nuevos vehículos aparecerán en esta grilla.</span></div>

  return <div className="table-wrap"><table>
         <thead><tr><th>Vehículo</th><th>Patente</th><th>Tipo</th><th>Año</th>
         <th>Color</th><th>Precio diario</th><th>Estado</th><th>¿Activo?</th><th>Accciones</th></tr></thead>
         <tbody>{vehicles.map((vehicle) => 
          <tr key={vehicle.id}>
          <td><strong className="strong">{vehicle.marca} {vehicle.modelo}</strong></td>
          <td>{vehicle.patente}</td><td>{vehicle.tipoVehiculo}</td><td>{vehicle.anio}</td>
          <td>{vehicle.color || '—'}</td>
          <td className="strong">${Number(vehicle.precio_diario).toLocaleString('es-AR')}</td>
          <td>{vehicle.estado}</td>
          <td><span className={`status ${vehicle.activo ? 'status-confirmada' : 'status-cancelada'}`}>{vehicle.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
          <td> <div className="table-actions">
            <button type="button" className="secondary-button" onClick={() => onEdit(vehicle)}>Editar</button>
            {vehicle.activo ? (<button type="button" className="secondary-button danger-button"
             onClick={() => onDeactivate(vehicle)}>Dar de baja</button>) : (
            <button type="button" className="secondary-button" onClick={() => onReactivate(vehicle)}>Reactivar</button>)}
          </div></td>
         </tr>)}</tbody></table>
        </div>
}
