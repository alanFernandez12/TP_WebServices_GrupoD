import { useState, type ChangeEvent, type FormEvent } from 'react'
import { crearCliente, crearReserva, crearVehiculo } from '../../../services/api'

export type RegistrationType = 'vehiculo' | 'cliente' | 'reserva'
interface Props { type: RegistrationType; onClose: () => void; onSaved: () => void }
const labels = { vehiculo: 'Nuevo vehículo', cliente: 'Nuevo cliente', reserva: 'Nueva reserva' }

export function RegistrationModal({ type, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues({ ...values, [key]: event.target.value })
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      if (type === 'cliente') await crearCliente({ ...values, fechaNacimiento: values.fechaNacimiento || null })
      if (type === 'vehiculo') await crearVehiculo({ ...values, anio: Number(values.anio), precio_diario: Number(values.precio_diario), activo: true, estado: 'DISPONIBLE' })
      if (type === 'reserva') await crearReserva({ idCliente: Number(values.idCliente), idVehiculo: Number(values.idVehiculo), horaInicio: values.horaInicio, horaFin: values.horaFin })
      onSaved()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el registro.') } finally { setSaving(false) }
  }
  const field = (key: string, label: string, type = 'text', required = true) => <label><span>{label}</span><input type={type} value={values[key] ?? ''} onChange={update(key)} required={required} /></label>
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-heading"><div><p className="eyebrow">Alta</p><h2>{labels[type]}</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Cerrar">×</button></div><form onSubmit={submit}>
    {type === 'cliente' && <div className="form-grid">{field('nombre', 'Nombre')}{field('apellido', 'Apellido')}{field('documento', 'Documento')}{field('email', 'Email', 'email')}{field('telefono', 'Teléfono', 'tel', false)}{field('fechaNacimiento', 'Fecha de nacimiento', 'date', false)}</div>}
    {type === 'vehiculo' && <div className="form-grid">{field('patente', 'Patente')}{field('marca', 'Marca')}{field('modelo', 'Modelo')}{field('anio', 'Año', 'number')}{field('color', 'Color', 'text', false)}{field('precio_diario', 'Precio diario', 'number')}<label><span>Tipo</span><select value={values.tipoVehiculo ?? ''} onChange={update('tipoVehiculo')} required><option value="">Seleccionar</option>{['SEDAN', 'SUV', 'PICKUP', 'COUPE', 'HATCHBACK'].map((type) => <option key={type}>{type}</option>)}</select></label></div>}
    {type === 'reserva' && <div className="form-grid">{field('idCliente', 'ID del cliente', 'number')}{field('idVehiculo', 'ID del vehículo', 'number')}{field('horaInicio', 'Inicio', 'datetime-local')}{field('horaFin', 'Fin', 'datetime-local')}</div>}
    {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar alta'}</button></div>
  </form></div></div>
}
