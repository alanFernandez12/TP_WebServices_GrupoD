import type { Cliente, Reserva, ReservaFiltro, Vehiculo } from '../types/domain'

const jsonHeaders = { 'Content-Type': 'application/json' }

export type Rol = 'ADMIN' | 'CLIENTE'

export interface Sesion {
  email: string
  nombre: string
  rol: Rol
  clienteId: number | null
}

let authorization = ''
let sesionValidada = false
let alPerderSesion: (() => void) | undefined

export function configurarPerdidaSesion(callback?: () => void) {
  alPerderSesion = callback
}

export function cerrarSesion() {
  authorization = ''
  sesionValidada = false
}

export async function iniciarSesion(email: string, password: string): Promise<Sesion> {
  const bytes = new TextEncoder().encode(`${email.trim()}:${password}`)
  authorization = `Basic ${btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))}`
  sesionValidada = false
  try {
    const sesion = await request<Sesion>('/gateway/auth/me')
    if (sesion.rol !== 'ADMIN' && sesion.rol !== 'CLIENTE') {
      throw new Error('La cuenta no tiene un rol habilitado.')
    }
    if (sesion.rol === 'CLIENTE' && sesion.clienteId == null) {
      throw new Error('La cuenta no tiene un cliente asociado.')
    }
    sesionValidada = true
    return sesion
  } catch (error) {
    cerrarSesion()
    throw error
  }
}


async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  const credencialSolicitud = authorization
  if (credencialSolicitud) headers.set('Authorization', credencialSolicitud)
  headers.set('X-Requested-With', 'XMLHttpRequest')
  const response = await fetch(url, { ...options, headers, credentials: 'omit' })
  if (response.status === 401 && sesionValidada && authorization === credencialSolicitud) {
    cerrarSesion()
    alPerderSesion?.()
  }
  if (!response.ok) {
    let message: string

    try {
      const errorBody = await response.json()

      message =
        errorBody.message ||
        (response.status === 403
          ? 'No tiene los permisos suficientes para realizar esta acción'
          : response.status === 401
            ? 'Debe iniciar sesión para continuar'
            : 'Error interno al procesar la solicitud')
    } catch {
      message =
        response.status === 403
          ? 'No tiene los permisos suficientes para realizar esta acción'
          : response.status === 401
            ? 'Debe iniciar sesión para continuar'
            : response.status === 500
              ? 'Error interno del servidor'
              : 'La solicitud no pudo completarse'
    }

    throw new Error(message)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export function crearVehiculo(data: unknown) {
  return request<Vehiculo>('/api/vehiculos', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function crearCliente(data: unknown) {
  return request<Cliente>('/api/clientes', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function crearReserva(data: unknown) {
  return request<Reserva>('/gateway/reservas', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function obtenerVehiculos() {
  return request<Vehiculo[]>('/gateway/vehiculos')
}

export function obtenerClientes() {
  return request<Cliente[]>('/gateway/clientes')
}

export function obtenerVehiculo(id: number) {
  return request<Vehiculo>(`/gateway/vehiculos/${id}`)
}

export function obtenerCliente(id: number) {
  return request<Cliente>(`/gateway/clientes/${id}`)
}

export interface ReservaConsulta {
  id: number
  idCliente: number
  idVehiculo: number
  horaInicio: string
  horaFin: string
  duracionDias: number
  precioDiarioHistorico: number
  importeTotal: number
  estadoReserva: Reserva['estadoReserva']
}

export function obtenerReserva(id: number) {
  return request<ReservaConsulta>(`/gateway/reservas/${id}`)
}

export async function obtenerReservas(filtro: ReservaFiltro = {}): Promise<Reserva[]> {
  const [reservas, clientes, vehiculos] = await Promise.all([
    request<Array<{
      id: number
      idCliente: number
      idVehiculo: number
      horaInicio: string
      horaFin: string
      duracionDias: number
      precioDiarioHistorico: number
      importeTotal: number
      estadoReserva: Reserva['estadoReserva']
    }>>('/gateway/reservas'),
    obtenerClientes(),
    obtenerVehiculos(),
  ])

  const completas = reservas.map((reserva) => {
    const cliente = clientes.find((item) => item.id === reserva.idCliente)
    const vehiculo = vehiculos.find((item) => item.id === reserva.idVehiculo)

    return {
      ...reserva,
      cliente: cliente ?? {
        id: reserva.idCliente,
        nombre: 'Cliente',
        apellido: `#${reserva.idCliente}`,
        documento: '',
      },
      vehiculo: vehiculo ?? {
        id: reserva.idVehiculo,
        marca: 'Vehículo',
        modelo: `#${reserva.idVehiculo}`,
        patente: '',
        tipoVehiculo: '',
      },
      patente: vehiculo?.patente ?? '',
    }
  })

  return completas.filter((reserva) =>
    (!filtro.clienteId || reserva.idCliente === filtro.clienteId) &&
    (!filtro.vehiculoId || reserva.idVehiculo === filtro.vehiculoId) &&
    (!filtro.tipoVehiculo || reserva.vehiculo.tipoVehiculo === filtro.tipoVehiculo) &&
    (!filtro.estadoReserva || reserva.estadoReserva === filtro.estadoReserva) &&
    (!filtro.fechaDesde || reserva.horaInicio >= filtro.fechaDesde) &&
    (!filtro.fechaHasta || reserva.horaFin <= filtro.fechaHasta)
  )
}

export function cancelarReserva(id: number) {
  return request<Reserva>(`/gateway/reservas/${id}/cancelar`, { method: 'PATCH' })
}

export function modificarVehiculo(id: number, data: unknown) {
  return request<Vehiculo>(`/api/vehiculos/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  })
}

export function modificarCliente(id: number, data: unknown) {
  return request<Cliente>(`/api/clientes/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  })
}

export function bajaVehiculo(id: number) {
  return request<void>(`/api/vehiculos/${id}`, {method: 'DELETE'})
}

export function bajaCliente(id: number) {
  return request<void>(`/api/clientes/${id}`, {method: 'DELETE'})
}

export function reactivarVehiculo(id: number) {
  return request<void>(`/api/vehiculos/${id}/reactivar`, {method: 'PATCH'})
}

export function reactivarCliente(id: number) {
  return request<void>(`/api/clientes/${id}/reactivar`,{method: 'PATCH'})
}
