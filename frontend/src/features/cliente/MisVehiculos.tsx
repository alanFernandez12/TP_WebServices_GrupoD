import { useCallback, useEffect, useState } from 'react'
import { consultarMisSolicitudesVehiculosExternos, type SolicitudVehiculoExterno } from '../../services/api'
import type { Vehiculo } from '../../types/domain'

import { RegistrationModal } from '../dashboard/components/RegistrationModal'
import { DetailModal, type DetailRegistro } from '../dashboard/components/DetailModal'

export function MisVehiculos() {
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculoExterno[]>([])
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [detalle, setDetalle] = useState<DetailRegistro | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try { setSolicitudes(await consultarMisSolicitudesVehiculosExternos()) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron consultar las solicitudes.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void cargar() }, [cargar])

  const guardadoCorrecto = () => {
    setAbierto(false)
    setSuccess('Solicitud enviada. La verificación de patente y titularidad se realizará de manera asíncrona.')
    void cargar()
  }

  return <>
    <section className="welcome"><div>
      <p className="eyebrow">Vehículos de propietarios</p><h1>Mis vehículos</h1>
      <p className="subtitle">Podes añadir un vehículo propio a Rentar.</p>
    </div><button type="button" className="primary-button" onClick={() => { setError(''); setSuccess(''); setAbierto(true) }}>+ Incorporar vehículo</button></section>
    {error && <div className="alert error" role="alert">{error}</div>}
    {success && <div className="alert success" role="status">{success}</div>}
    <section className="reservations-section">
      <div className="section-heading"><h2>Vehículos</h2><button type="button" className="secondary-button" disabled={loading} onClick={() => void cargar()}>Actualizar estados</button></div>
      {loading ? <p role="status">Cargando solicitudes...</p> : solicitudes.length === 0 ?
        <div className="empty-state"><strong>Sin solicitudes para mostrar</strong><span>Podés solicitar la incorporación de tu primer vehículo.</span></div> :
        <div className="table-wrap"><table><thead><tr><th>Marca</th><th>Modelo</th><th>Patente</th><th>Tipo</th><th>Año</th><th>Resultado final</th><th>Estado</th><th>¿Activo?</th><th>Acciones</th></tr></thead><tbody>
          {solicitudes.map(s => <tr key={s.id}>
            <td>{s.marca}</td><td>{s.modelo}</td><td>{s.patente}</td>
            <td>{s.tipoVehiculo}</td><td>{s.anio}</td><td>{s.resultadoFinal}</td>
            <td>{s.estado}</td>
            <td><span className={`status ${s.activo ? 'status-confirmada' : 'status-cancelada'}`}>{s.activo ? 'SI' : 'NO'}</span></td>
            <td><div className="table-actions">
              <button type="button" className="secondary-button" onClick={() => {
                const vehiculo: Vehiculo = {
                  id: s.id, patente: s.patente, marca: s.marca, modelo: s.modelo,
                  anio: s.anio, tipoVehiculo: s.tipoVehiculo, estado: s.estado,
                  color: s.color, precio_diario: Number(s.precio_diario), activo: s.activo,
                  resultadoPatente: s.resultadoPatente,
                  resultadoTitularidad: s.resultadoTitularidad,
                  resultadoFinal: s.resultadoFinal,
                }
                setDetalle({ type: 'vehiculo', registro: vehiculo })
              }}>Ver</button>
              <button type="button" className="secondary-button" disabled>Editar</button>
              {s.activo
                ? <button type="button" className="secondary-button danger-button" disabled>Dar de baja</button>
                : <button type="button" className="secondary-button" disabled>Reactivar</button>}
            </div></td>
          </tr>)}
        </tbody></table></div>}
    </section>
    {abierto && (
      <RegistrationModal
        type="vehiculo"
        vehiculoExterno
        onClose={() => setAbierto(false)}
        onSaved={guardadoCorrecto}
      />
    )}
    {detalle && <DetailModal detail={detalle} loading={false} error="" onClose={() => setDetalle(null)} />}
  </>
}
