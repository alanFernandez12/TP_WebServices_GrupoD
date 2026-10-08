import { useState, type ChangeEvent, type FormEvent } from 'react'
import {crearCliente, crearReserva, crearVehiculo, modificarCliente, modificarVehiculo} from '../../../services/api'
import type { Cliente, Vehiculo } from '../../../types/domain'

export type RegistrationType = 'vehiculo' | 'cliente' | 'reserva'

interface Props {type: RegistrationType, registro?: Cliente | Vehiculo
  onClose: () => void
  onSaved: () => void
}

const labels = { vehiculo: 'Nuevo vehículo', cliente: 'Nuevo cliente', reserva: 'Nueva reserva'}

function obtenerValoresIniciales(registro?: Cliente | Vehiculo): Record<string, string> {
  if (!registro) return {}

  return Object.fromEntries(
    Object.entries(registro).map(([key, value]) => 
      [key, value == null ? '' : String(value),])
  )
}

export function RegistrationModal({ type, registro, onClose, onSaved }: Props) {
  const editando = Boolean(registro)
  const [values, setValues] = useState<Record<string, string>>(
    () => obtenerValoresIniciales(registro))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (type === 'cliente') {
        if (!editando && values.password !== values.passwordConfirm) {
          setError('Las contraseñas no coinciden.')
          return
        }

        const datosPersonales = {
          nombre: values.nombre,
          apellido: values.apellido,
          documento: values.documento,
          email: values.email,
          telefono: values.telefono || null,
          fechaNacimiento: values.fechaNacimiento || null,
        }

        if (registro) {
          await modificarCliente(registro.id, datosPersonales)
        } else {
          await crearCliente({
            ...datosPersonales,
            password: values.password,
            rol: 'CLIENTE',
          })
        }
      }

      if (type === 'vehiculo') {
        const datosVehiculo = {
          patente: values.patente,
          marca: values.marca,
          modelo: values.modelo,
          anio: Number(values.anio),
          color: values.color || null,
          tipoVehiculo: values.tipoVehiculo,
          precio_diario: Number(values.precio_diario),
        }

        if (registro) {
          await modificarVehiculo(registro.id, datosVehiculo)
        } else {
          await crearVehiculo(datosVehiculo)
        }
      }

      if (type === 'reserva') {
        await crearReserva({
          idCliente: Number(values.idCliente),
          idVehiculo: Number(values.idVehiculo),
          horaInicio: values.horaInicio,
          horaFin: values.horaFin,
        })
      }

      onSaved()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar el registro.'
      )
    } finally {
      setSaving(false)
    }
  }

  const field = (key: string, label: string, inputType = 'text', required = true,readOnly = false) => {return (
      <label> <span>{label}</span>
        <input type={inputType} value={values[key] ?? ''} onChange={update(key)}
          required={required} readOnly={readOnly}/>
      </label>)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving && !error) onClose()}}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
        <div className="modal-heading">
          <div> <p className="eyebrow">{editando ? 'Edición' : 'Alta'}</p>
            <h2 id="registration-title">
              {editando
                ? type === 'cliente' ? 'Editar cliente' : 'Editar vehículo'
                : labels[type]}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} disabled={saving} aria-label="Cerrar">×</button>
        </div>

        <form onSubmit={submit}>
          {type === 'cliente' && (
            <div className="form-grid">
              {field('nombre', 'Nombre')}
              {field('apellido', 'Apellido')}
              {field('documento', 'Documento')}
              {field('email', 'Email', 'email')}
              {field('telefono', 'Teléfono', 'tel', false)}
              {field('fechaNacimiento', 'Fecha de nacimiento', 'date', false)}
              {!editando && (
                <>
                  {field('password', 'Contraseña', 'password')}
                  {field('passwordConfirm', 'Confirmar contraseña', 'password')}
                </>
              )}
            </div>
          )}

          {type === 'vehiculo' && (
            <div className="form-grid">
              {field('patente', 'Patente', 'text', true, editando)}
              {field('marca', 'Marca')}
              {field('modelo', 'Modelo')}
              {field('anio', 'Año', 'number')}
              {field('color', 'Color', 'text', false)}
              {field('precio_diario', 'Precio diario', 'number')}
              <label>
                <span>Tipo</span>
                <select value={values.tipoVehiculo ?? ''} onChange={update('tipoVehiculo')} required>
                  <option value="">Seleccionar</option>
                  {['SEDAN', 'SUV', 'PICKUP', 'COUPE', 'HATCHBACK'].map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {type === 'reserva' && (
            <div className="form-grid">
              {field('idCliente', 'ID del cliente', 'number')}
              {field('idVehiculo', 'ID del vehículo', 'number')}
              {field('horaInicio', 'Inicio', 'datetime-local')}
              {field('horaFin', 'Fin', 'datetime-local')}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar alta'}
            </button>
          </div>
        </form>

        {error && (
          <div
            className="modal-backdrop error-popup-backdrop"
            onMouseDown={(event) => {
              event.stopPropagation()
              if (event.target === event.currentTarget) setError('')
            }}
          >
            <div
              className="modal error-popup"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="error-popup-title"
              aria-describedby="error-popup-message"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  setError('')
                }
              }}
            >
              <div className="modal-heading">
                <h2 id="error-popup-title">No se pudo guardar</h2>
                <button type="button" className="close-button" onClick={() => setError('')} aria-label="Cerrar mensaje" autoFocus>
                  ×
                </button>
              </div>
              <p id="error-popup-message">{error}</p>
              <div className="modal-actions">
                <button type="button" className="primary-button" onClick={() => setError('')}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
