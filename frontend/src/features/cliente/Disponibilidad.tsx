import { useState } from 'react'
import { consultarDisponibilidad, type Disponible } from '../../services/api'

const dinero = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
export function Disponibilidad() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tipo, setTipo] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [items, setItems] = useState<Disponible[]>([])
  const [consultado, setConsultado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desde || !hasta || new Date(desde) >= new Date(hasta)) {
      setError('Ingresá fecha y hora de inicio y fin; el fin debe ser posterior al inicio.')
      return
    }
    if ((min && Number(min) < 0) || (max && Number(max) < 0) || (min && max && Number(min) > Number(max))) {
      setError('Revisá el rango de precios.')
      return
    }
    setCargando(true); setError(''); setConsultado(false)
    try {
      const resultado = await consultarDisponibilidad({
        fechaInicio: desde, fechaFin: hasta,
        ...(tipo && {tipoVehiculo: tipo}), ...(marca.trim() && {marca: marca.trim()}),
        ...(modelo.trim() && {modelo: modelo.trim()}),
        ...(min !== '' && {precioMin: Number(min)}), ...(max !== '' && {precioMax: Number(max)}),
      })
      setItems(resultado); setConsultado(true)
    } catch (e) { setItems([]); setError(e instanceof Error ? e.message : 'No se pudo consultar disponibilidad.') }
    finally { setCargando(false) }
  }
  return <>
    <section className="welcome"><div><p className="eyebrow">Vehículos</p><h1>Consultar disponibilidad</h1>
      <p className="subtitle">Buscá vehículos libres durante todo el período solicitado.</p></div></section>
    <section className="reservations-section">
      <form onSubmit={e => void buscar(e)}>
        <div className="form-grid">
          <label><span>Inicio (obligatorio)</span><input type="datetime-local" required value={desde} onChange={e => setDesde(e.target.value)} /></label>
          <label><span>Fin (obligatorio)</span><input type="datetime-local" required value={hasta} onChange={e => setHasta(e.target.value)} /></label>
          <label><span>Tipo</span><select value={tipo} onChange={e => setTipo(e.target.value)}><option value="">Todos</option>{['SEDAN','SUV','PICKUP','COUPE','HATCHBACK'].map(t => <option key={t}>{t}</option>)}</select></label>
          <label><span>Marca</span><input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Cualquier marca" /></label>
          <label><span>Modelo</span><input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Cualquier modelo" /></label>
          <label><span>Precio diario mínimo</span><input type="number" min="0" step="0.01" value={min} onChange={e => setMin(e.target.value)} /></label>
          <label><span>Precio diario máximo</span><input type="number" min="0" step="0.01" value={max} onChange={e => setMax(e.target.value)} /></label>
        </div>
        <div className="modal-actions" style={{justifyContent:'flex-start',marginBottom:22}}>
          <button type="submit" className="primary-button" disabled={cargando}>{cargando ? 'Buscando...' : 'Consultar disponibilidad'}</button>
          <button type="button" className="secondary-button" onClick={() => {setDesde('');setHasta('');setTipo('');setMarca('');setModelo('');setMin('');setMax('');setItems([]);setError('');setConsultado(false)}}>Limpiar</button>
        </div>
      </form>
      {error && <div className="alert error" role="alert">{error}</div>}
      {consultado && <div className="section-heading"><h2>Resultados</h2><span className="count-badge">{items.length} vehículos</span></div>}
      {consultado && (items.length ? <div className="table-wrap"><table><thead><tr><th>Patente</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Color</th><th>Tipo</th><th>Precio diario</th></tr></thead>
      <tbody>{items.map(v => <tr key={v.id}><td className="strong">{v.patente}</td><td>{v.marca}</td><td>{v.modelo}</td><td>{v.anio}</td><td>{v.color || '—'}</td><td>{v.tipoVehiculo}</td><td>{dinero(v.precioDiario)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No hay vehículos disponibles con esos filtros y fechas.</div>)}
    </section>
  </>
}
