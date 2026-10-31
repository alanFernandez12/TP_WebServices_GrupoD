export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'TERMINADA'

export interface Vehiculo {
  id: number
  patente: string
  marca: string
  modelo: string
  anio: number
  tipoVehiculo: string
  estado: string
  color?: string
  precio_diario: number
  activo: boolean
}

export interface Cliente {
  id: number
  documento: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  activo: boolean
}

export interface ReservaFiltro {
  clienteId?: number
  vehiculoId?: number
  tipoVehiculo?: string
  estadoReserva?: EstadoReserva
  fechaDesde?: string
  fechaHasta?: string
}

export interface Reserva {
  cliente: Pick<Cliente, 'id' | 'nombre' | 'apellido' | 'documento'>
  vehiculo: Pick<Vehiculo, 'id' | 'marca' | 'modelo' | 'patente' | 'tipoVehiculo'>
  patente: string
  precioDiarioHistorico: number
  id: number
  horaInicio: string
  horaFin: string
  importeTotal: number
  estadoReserva: EstadoReserva
  descMantenimiento?: string
}
