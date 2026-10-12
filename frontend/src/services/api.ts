import type { Cliente, Reserva, Vehiculo } from '../types/domain'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
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

export function obtenerReservas() {
  return request<Reserva[]>('/gateway/reservas')
}

// Alternativa anterior: consulta las reservas mediante GraphQL en Spring Boot.
// Se conserva para poder comparar ambos contratos o volver a utilizarlo.
export async function obtenerReservasGraphQL(): Promise<Reserva[]> {
  const response = await request<{
    data?: { reservas: Reserva[] }
    errors?: { message: string }[]
  }>('/graphql', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      query: `query Reservas { reservas(filtro: {}) { id idCliente idVehiculo horaInicio horaFin importeTotal estadoReserva } }`,
    }),
  })

  if (response.errors?.length) {
    throw new Error(response.errors[0].message)
  }

  return response.data?.reservas ?? []
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
