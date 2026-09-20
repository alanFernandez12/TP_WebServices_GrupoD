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

export interface Reserva {
  id: number
  idCliente: number
  idVehiculo: number
  horaInicio: string
  horaFin: string
  importeTotal: number
  estadoReserva: EstadoReserva
}
