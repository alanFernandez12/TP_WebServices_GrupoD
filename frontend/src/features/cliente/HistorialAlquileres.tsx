import { useEffect, useState } from 'react'
import { consultarHistorial, type AlquilerHistorico } from '../../services/api'

const dinero = (n: number) => new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS'}).format(n)
const fecha = (s: string) => {
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es-AR', {dateStyle:'short',timeStyle:'short'})
}
export function HistorialAlquileres() {
  const [items, setItems] = useState<AlquilerHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  async function cargar() {
    setLoading(true);setError('')
    try {setItems(await consultarHistorial())}
    catch (e) {setError(e instanceof Error ? e.message : 'No se pudo cargar el historial.')}
    finally {setLoading(false)}
  }
  useEffect(() => {void cargar()}, [])
  return <>
    <section className="welcome"><div><p className="eyebrow">Alquileres</p><h1>Historial de alquileres</h1>
      <p className="subtitle">Consultá tus alquileres terminados y reservas canceladas.</p></div></section>
    <section className="reservations-section">
      <div className="section-heading"><h2>Mi historial</h2><span className="count-badge">{items.length} registros</span></div>
      {error && <div className="alert error" role="alert">{error} <button type="button" onClick={() => void cargar()}>Reintentar</button></div>}
      {loading ? <div className="empty-state">Cargando historial...</div> : !items.length ? <div className="empty-state">Todavía no hay alquileres terminados ni reservas canceladas.</div> :
        <div className="table-wrap"><table><thead><tr><th>Vehículo</th><th>Patente</th><th>Inicio</th><th>Fin</th><th>Días</th><th>Importe total</th><th>Estado</th></tr></thead><tbody>
          {items.map(r => <tr key={r.id}><td className="strong">{r.vehiculo}</td><td>{r.patente}</td><td>{fecha(r.fechaInicio)}</td><td>{fecha(r.fechaFin)}</td><td>{r.cantidadDias}</td><td>{dinero(r.importeTotal)}</td><td><span className={`status status-${r.estado.toLowerCase()}`}>{r.estado}</span></td></tr>)}
        </tbody></table></div>}
    </section>
  </>
}
