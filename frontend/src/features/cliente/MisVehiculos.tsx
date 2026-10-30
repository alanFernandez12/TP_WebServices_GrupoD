import { useCallback, useEffect, useState } from 'react'
import { consultarMisSolicitudesVehiculosExternos, type SolicitudVehiculoExterno } from '../../services/api'

import { RegistrationModal } from '../dashboard/components/RegistrationModal'

export function MisVehiculos() {
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculoExterno[]>([])
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      <p className="subtitle">Solicitá incorporar un vehículo propio y consultá el resultado de las verificaciones.</p>
    </div><button type="button" className="primary-button" onClick={() => { setError(''); setSuccess(''); setAbierto(true) }}>+ Incorporar vehículo</button></section>
    {error && <div className="alert error" role="alert">{error}</div>}
    {success && <div className="alert success" role="status">{success}</div>}
    <section className="reservations-section">
      <div className="section-heading"><h2>Solicitudes de incorporación</h2><button type="button" className="secondary-button" disabled={loading} onClick={() => void cargar()}>Actualizar estados</button></div>
      {loading ? <p role="status">Cargando solicitudes...</p> : solicitudes.length === 0 ?
        <div className="empty-state"><strong>Sin solicitudes para mostrar</strong><span>Podés solicitar la incorporación de tu primer vehículo.</span></div> :
        <div className="table-wrap"><table><thead><tr><th>Patente</th><th>Vehículo</th><th>Verificación de patente</th><th>Titularidad</th><th>Incorporación</th></tr></thead><tbody>
          {solicitudes.map(s => <tr key={s.id}><td className="strong">{s.patente}</td><td>{s.marca} {s.modelo}</td><td>{s.validacionPatente ?? 'PENDIENTE'}</td><td>{s.validacionTitularidad ?? 'PENDIENTE'}</td><td><span className={`status ${s.estado === 'PENDIENTE' ? 'status-pendiente' : s.estado === 'DISPONIBLE' ? 'status-confirmada' : 'status-cancelada'}`}>{s.estado}</span></td></tr>)}
        </tbody></table></div>}
      <p className="subtitle" style={{ fontSize: 13 }}>Una solicitud pendiente no habilita el vehículo para alquiler. Solo se incorpora cuando ambas validaciones son satisfactorias.</p>
    </section>
    {abierto && (
      <RegistrationModal
        type="vehiculo"
        vehiculoExterno
        onClose={() => setAbierto(false)}
        onSaved={guardadoCorrecto}
      />
    )}
  </>
}

