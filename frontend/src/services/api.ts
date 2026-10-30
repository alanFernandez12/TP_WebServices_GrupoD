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
  return request<Vehiculo>('/gateway/vehiculos', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function crearCliente(data: unknown) {
  return request<Cliente>('/gateway/clientes', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function crearReserva(data: unknown) {
  return request<Reserva>('/gateway/reservas', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) })
}

export function obtenerVehiculos() {
  return request<Vehiculo[]>('/gateway/vehiculos')
}

export function obtenerVehiculosDisponibles(fechaInicio: string, fechaFin: string) {
  const params = new URLSearchParams({ fechaInicio, fechaFin })
  return request<Vehiculo[]>(`/gateway/vehiculos/disponibles?${params.toString()}`)
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

/** Solo consulta reservas del cliente autenticado, sin endpoints administrativos. */
export async function obtenerMisReservas(filtro: ReservaFiltro = {}): Promise<Reserva[]> {
  const data = await graphqlRequest<{ misReservas: Reserva[] }>(`
    query MisReservas {
      misReservas {
        id cliente { id nombre apellido documento }
        vehiculo { id marca modelo patente tipoVehiculo }
        patente precioDiarioHistorico horaInicio horaFin importeTotal estadoReserva
      }
    }
  `)
  return data.misReservas.filter((reserva) =>
    (!filtro.vehiculoId || reserva.vehiculo.id === filtro.vehiculoId) &&
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
  return request<Vehiculo>(`/gateway/vehiculos/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  })
}

export function modificarCliente(id: number, data: unknown) {
  return request<Cliente>(`/gateway/clientes/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  })
}

export function bajaVehiculo(id: number) {
  return request<void>(`/gateway/vehiculos/${id}`, {method: 'DELETE'})
}

export function bajaCliente(id: number) {
  return request<void>(`/gateway/clientes/${id}`, {method: 'DELETE'})
}

export function reactivarVehiculo(id: number) {
  return request<void>(`/gateway/vehiculos/${id}/reactivar`, {method: 'PATCH'})
}

export function reactivarCliente(id: number) {
  return request<void>(`/gateway/clientes/${id}/reactivar`,{method: 'PATCH'})
}

/** Operaciones GraphQL expuestas exclusivamente por el API Gateway. */
async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const result = await request<{ data?: T; errors?: Array<{message: string}> }>('/gateway/graphql', {
    method: 'POST', headers: jsonHeaders, body: JSON.stringify({ query, variables }),
  })
  if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join(' | '))
  if (!result.data) throw new Error('GraphQL no devolvió resultados.')
  return result.data
}

export interface DisponibilidadFiltro {
  fechaInicio: string
  fechaFin: string
  tipoVehiculo?: string
  marca?: string
  modelo?: string
  precioMin?: number
  precioMax?: number
}
export interface Disponible {
  id: string
  patente: string
  marca: string
  modelo: string
  anio: number
  color: string
  tipoVehiculo: string
  precioDiario: number
}
export interface AlquilerHistorico {
  id: string
  vehiculo: string
  patente: string
  fechaInicio: string
  fechaFin: string
  cantidadDias: number
  importeTotal: number
  estado: string
}

export async function consultarDisponibilidad(filtro: DisponibilidadFiltro): Promise<Disponible[]> {
  const response = await graphqlRequest<{ disponibilidad: Disponible[] }>(`
    query ConsultarDisponibilidad($filtro: DisponibilidadFiltro!) {
      disponibilidad(filtro: $filtro) {
        id patente marca modelo anio color tipoVehiculo precioDiario
      }
    }`, { filtro })
  return response.disponibilidad
}

export async function consultarHistorial(): Promise<AlquilerHistorico[]> {
  const response = await graphqlRequest<{ historialAlquileres: AlquilerHistorico[] }>(`
    query ConsultarHistorial {
      historialAlquileres {
        id vehiculo patente fechaInicio fechaFin cantidadDias importeTotal estado
      }
    }`)
  return response.historialAlquileres
}
