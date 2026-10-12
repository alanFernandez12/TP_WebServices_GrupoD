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
    const sesion = await request<Sesion>('/api/auth/me')
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
  return request<Reserva>('/api/reservas', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function obtenerVehiculos() {
  return request<Vehiculo[]>('/api/vehiculos')
}

export function obtenerClientes() {
  return request<Cliente[]>('/api/clientes')
}

export async function obtenerReservas(filtro: ReservaFiltro = {}): Promise<Reserva[]> {
   const response = await request<{ data?: { reservas: Reserva[] }; errors?: { message: string }[] }>('/graphql', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      query: `query Reservas($filtro: ReservaFilterInput) {
        reservas(filtro: $filtro) { id horaInicio horaFin precioDiarioHistorico importeTotal estadoReserva patente
          cliente { id nombre apellido documento }
          vehiculo { id marca modelo patente tipoVehiculo }
        }
      }`,
      variables: { filtro },
    }),
  })
  if (response.errors?.length) {
    const message = response.errors[0].message
    throw new Error(message.startsWith('INTERNAL_ERROR') ? 'No se pudieron consultar las reservas. Intentá nuevamente.' : message)
  }
  return response.data?.reservas ?? []
}
export function cancelarReserva(id: number) {
  return request<Reserva>(`/api/reservas/${id}/cancelar`, { method: 'PATCH' })
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
