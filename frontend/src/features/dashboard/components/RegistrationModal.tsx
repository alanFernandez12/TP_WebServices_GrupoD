import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {crearCliente, crearReserva, crearVehiculo, modificarCliente, modificarVehiculo, obtenerClientes, obtenerVehiculosDisponibles} from '../../../services/api'
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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<Vehiculo[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingVehiculos, setLoadingVehiculos] = useState(false)
  const [errorClientes, setErrorClientes] = useState('')
  const [errorVehiculos, setErrorVehiculos] = useState('')

  useEffect(() => {
    if (type !== 'reserva') return

    let cancelled = false
    setLoadingClientes(true)
    setErrorClientes('')

    obtenerClientes()
      .then((result) => {
        if (!cancelled) setClientes(result.filter((cliente) => cliente.activo))
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setErrorClientes(
            requestError instanceof Error
              ? requestError.message
              : 'No se pudieron cargar los clientes.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingClientes(false)
      })

    return () => {
      cancelled = true
    }
  }, [type])

  useEffect(() => {
    if (type !== 'reserva') return

    const { horaInicio, horaFin } = values
    if (!horaInicio || !horaFin || horaInicio >= horaFin) {
      setVehiculosDisponibles([])
      setValues((previous) => ({ ...previous, idVehiculo: '' }))
      setErrorVehiculos('')
      setLoadingVehiculos(false)
      return
    }

    let cancelled = false
    setLoadingVehiculos(true)
    setErrorVehiculos('')

    obtenerVehiculosDisponibles(horaInicio, horaFin)
      .then((result) => {
        if (cancelled) return
        const disponibles = result.filter((vehiculo) => vehiculo.activo)
        setVehiculosDisponibles(disponibles)
        setValues((previous) => ({
          ...previous,
          idVehiculo: disponibles.some((vehiculo) => String(vehiculo.id) === previous.idVehiculo)
            ? previous.idVehiculo
            : '',
        }))
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setVehiculosDisponibles([])
          setErrorVehiculos(
            requestError instanceof Error
              ? requestError.message
              : 'No se pudieron cargar los vehículos disponibles.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVehiculos(false)
      })

    return () => {
      cancelled = true
    }
  }, [type, values.horaInicio, values.horaFin])

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
        const idCliente = Number(values.idCliente)
        const idVehiculo = Number(values.idVehiculo)
        if (!Number.isSafeInteger(idCliente) || idCliente <= 0 || !clientes.some((cliente) => cliente.id === idCliente)) {
          setError('Seleccioná un cliente activo.')
          return
        }
        if (!Number.isSafeInteger(idVehiculo) || idVehiculo <= 0 || !vehiculosDisponibles.some((vehiculo) => vehiculo.id === idVehiculo)) {
          setError('Seleccioná un vehículo disponible para las fechas indicadas.')
          return
        }
        await crearReserva({
          idCliente,
          idVehiculo,
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
              {field('horaInicio', 'Inicio', 'datetime-local')}
              {field('horaFin', 'Fin', 'datetime-local')}
              <label>
                <span>Cliente</span>
                <select
                  value={values.idCliente ?? ''}
                  onChange={update('idCliente')}
                  required
                  disabled={loadingClientes || Boolean(errorClientes)}
                >
                  <option value="">
                    {loadingClientes ? 'Cargando clientes...' : 'Seleccionar cliente'}
                  </option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido} · {cliente.documento}
                    </option>
                  ))}
                </select>
                {errorClientes && <small className="form-error">{errorClientes}</small>}
                {!loadingClientes && !errorClientes && clientes.length === 0 && (
                  <small className="form-error">No hay clientes activos para reservar.</small>
                )}
              </label>
              <label>
                <span>Vehículo</span>
                <select
                  value={values.idVehiculo ?? ''}
                  onChange={update('idVehiculo')}
                  required
                  disabled={!values.horaInicio || !values.horaFin || values.horaInicio >= values.horaFin || loadingVehiculos || Boolean(errorVehiculos)}
                >
                  <option value="">
                    {loadingVehiculos
                      ? 'Buscando disponibilidad...'
                      : !values.horaInicio || !values.horaFin
                        ? 'Ingresar inicio y fin'
                        : values.horaInicio >= values.horaFin
                          ? 'Rango de fechas inválido'
                          : 'Seleccionar vehículo'}
                  </option>
                  {vehiculosDisponibles.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.patente} · {vehiculo.marca} {vehiculo.modelo}
                    </option>
                  ))}
                </select>
                {errorVehiculos && <small className="form-error">{errorVehiculos}</small>}
                {!loadingVehiculos && !errorVehiculos && values.horaInicio && values.horaFin && values.horaInicio < values.horaFin && vehiculosDisponibles.length === 0 && (
                  <small className="form-error">No hay vehículos disponibles para esas fechas.</small>
                )}
              </label>
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
