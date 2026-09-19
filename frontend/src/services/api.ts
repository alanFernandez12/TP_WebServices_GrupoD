import type { Cliente, Reserva, Vehiculo } from '../types/domain'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`La solicitud no pudo completarse (${response.status})`)
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

export async function obtenerReservas(): Promise<Reserva[]> {
  const response = await request<{ data?: { reservas: Reserva[] }; errors?: { message: string }[] }>('/graphql', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      query: `query Reservas { reservas(filtro: {}) { id idCliente idVehiculo horaInicio horaFin importeTotal estadoReserva } }`,
    }),
  })
  if (response.errors?.length) throw new Error(response.errors[0].message)
  return response.data?.reservas ?? []
}
