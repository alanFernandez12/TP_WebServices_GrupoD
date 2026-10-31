/** Consultas GraphQL públicas del Gateway; todas las fuentes internas son gRPC. */
import { Router } from "express";
import { buildSchema, graphql } from "graphql";
import * as vehicleService from "./services/vehicleService";
import * as rentalService from "./services/rentalService";

const schema = buildSchema(`
  """
  Filtros para consultar vehículos disponibles en un período determinado.

  Las fechas deben tener el formato YYYY-MM-DDTHH:mm o
  YYYY-MM-DDTHH:mm:ss. La fecha y hora de finalización
  deben ser posteriores a las de inicio.
  """
  input DisponibilidadFiltro {
    """Fecha y hora de inicio del período de alquiler."""
    fechaInicio: String!

    """Fecha y hora de finalización del período de alquiler."""
    fechaFin: String!

    """Tipo de vehículo requerido. Es opcional."""
    tipoVehiculo: String

    """Marca del vehículo. Permite coincidencias parciales."""
    marca: String

    """Modelo del vehículo. Permite coincidencias parciales."""
    modelo: String

    """Precio diario mínimo permitido."""
    precioMin: Float

    """Precio diario máximo permitido."""
    precioMax: Float
  }

  """
  Representa un vehículo que se encuentra disponible
  para el período solicitado y cumple con los filtros aplicados.
  """
  type VehiculoDisponible {
    """Identificador único del vehículo."""
    id: ID!

    """Patente del vehículo."""
    patente: String!

    """Marca del vehículo."""
    marca: String!

    """Modelo del vehículo."""
    modelo: String!

    """Año de fabricación."""
    anio: Int!

    """Color del vehículo. Puede no estar informado."""
    color: String

    """Tipo de vehículo."""
    tipoVehiculo: String!

    """Precio diario de alquiler."""
    precioDiario: Float!
  }

  """
  Representa un alquiler perteneciente al historial del cliente.
  Incluye alquileres terminados y cancelados.
  """
  type AlquilerHistorico {
    """Identificador único del alquiler."""
    id: ID!

    """Marca y modelo del vehículo alquilado."""
    vehiculo: String!

    """Patente del vehículo alquilado."""
    patente: String!

    """Fecha y hora de inicio del alquiler."""
    fechaInicio: String!

    """Fecha y hora de finalización del alquiler."""
    fechaFin: String!

    """Cantidad de días del alquiler."""
    cantidadDias: Int!

    """Importe total del alquiler."""
    importeTotal: Float!

    """Estado del alquiler: TERMINADA o CANCELADA."""
    estado: String!
  }

  """
  Representa una reserva realizada por el cliente autenticado,
  incluyendo información del cliente y del vehículo reservado.
  """
  type ReservaCliente {
    """Identificador único de la reserva."""
    id: Int!

    """Información del cliente asociado a la reserva."""
    cliente: ClienteReserva!

    """Información del vehículo asociado a la reserva."""
    vehiculo: VehiculoReserva!

    """Patente del vehículo reservado."""
    patente: String!

    """Precio diario registrado al momento de la reserva."""
    precioDiarioHistorico: Float!

    """Fecha y hora de inicio de la reserva."""
    horaInicio: String!

    """Fecha y hora de finalización de la reserva."""
    horaFin: String!

    """Importe total de la reserva."""
    importeTotal: Float!

    """Estado actual de la reserva."""
    estadoReserva: String!
  }

  """
  Información del cliente asociada a una reserva.
  """
  type ClienteReserva {
    """Identificador único del cliente."""
    id: Int!

    """Nombre del cliente."""
    nombre: String!

    """Apellido del cliente."""
    apellido: String!

    """Documento identificatorio del cliente."""
    documento: String!
  }

  """
  Información del vehículo asociado a una reserva.
  """
  type VehiculoReserva {
    """Identificador único del vehículo."""
    id: Int!

    """Marca del vehículo."""
    marca: String!

    """Modelo del vehículo."""
    modelo: String!

    """Patente del vehículo."""
    patente: String!

    """Tipo de vehículo."""
    tipoVehiculo: String!
  }

  """
  Consultas disponibles para clientes autenticados.
  Todas las operaciones utilizan la sesión del cliente actual.
  """
  type Query {

    """
    Obtiene todas las reservas correspondientes al cliente autenticado.
    No requiere argumentos: el cliente se identifica mediante la sesión.
    """
    misReservas: [ReservaCliente!]!

    """
    Consulta los vehículos disponibles para un período determinado.

    Permite aplicar filtros opcionales por tipo de vehículo, marca,
    modelo y rango de precio diario.

    Requiere que el usuario autenticado tenga rol CLIENTE.
    """
    disponibilidad(
      """Criterios de búsqueda y período de disponibilidad."""
      filtro: DisponibilidadFiltro!
    ): [VehiculoDisponible!]!

    """
    Obtiene el historial de alquileres del cliente autenticado.
    Incluye únicamente alquileres con estado TERMINADA o CANCELADA.
    No requiere argumentos porque utiliza el cliente de la sesión.
    """
    historialAlquileres: [AlquilerHistorico!]!
  }
`);

const validDate = (date: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(date) &&
  Number.isFinite(new Date(date).getTime());

const router = Router();
router.post("/", async (req, res) => {
  const sesion = res.locals.sesion;
  if (sesion?.rol !== "CLIENTE") {
    res.status(403).json({ errors: [{ message: "Solo los clientes pueden acceder a estas consultas." }] });
    return;
  }
  const { query, variables, operationName } = req.body ?? {};
  if (typeof query !== "string" || query.length > 10000) {
    res.status(400).json({ errors: [{ message: "Debe proporcionar una consulta GraphQL válida." }] });
    return;
  }
  const result = await graphql({
    schema,
    source: query,
    variableValues: variables,
    operationName,
    rootValue: {
      misReservas: async () => {
        const response = await rentalService.getRentals();
        const reservas = (response.rentals || []).filter((r: any) =>
          Number(r.cliente_id) === Number(sesion.clienteId));
        if (!reservas.length) return [];
        const vehiclesResponse = await vehicleService.getVehicles();
        const vehicles = new Map<string, any>((vehiclesResponse.vehicles || []).map((v: any) => [String(v.id), v]));
        return reservas.map((r: any) => {
          const v = vehicles.get(String(r.vehiculo_id));
          const nombre = String(sesion.nombre || 'Cliente').trim();
          return {
            id: Number(r.id),
            cliente: { id: Number(sesion.clienteId), nombre, apellido: '', documento: '' },
            vehiculo: {
              id: Number(r.vehiculo_id), marca: v?.marca || 'Vehículo',
              modelo: v?.modelo || `#${r.vehiculo_id}`,
              patente: v?.patente || '', tipoVehiculo: v?.tipoVehiculo || '',
            },
            patente: v?.patente || '',
            precioDiarioHistorico: Number(r.precio_diario_historico),
            horaInicio: r.fecha_inicio, horaFin: r.fecha_fin,
            importeTotal: Number(r.importe_total), estadoReserva: r.estado,
          };
        });
      },
      disponibilidad: async ({ filtro }: { filtro: {
        fechaInicio: string; fechaFin: string; tipoVehiculo?: string;
        marca?: string; modelo?: string; precioMin?: number; precioMax?: number;
      } }) => {
        if (!validDate(filtro.fechaInicio) || !validDate(filtro.fechaFin) ||
            new Date(filtro.fechaInicio) >= new Date(filtro.fechaFin)) {
          throw new Error("Indicá fechas y horas válidas: la final debe superar la inicial.");
        }
        if ((filtro.precioMin != null && filtro.precioMin < 0) ||
            (filtro.precioMax != null && filtro.precioMax < 0) ||
            (filtro.precioMin != null && filtro.precioMax != null && filtro.precioMin > filtro.precioMax)) {
          throw new Error("El rango de precios no es válido.");
        }
        const response = await vehicleService.getAvailableVehicles(filtro.fechaInicio, filtro.fechaFin);
        return (response.vehicles || []).filter((v: any) => {
          const precio = Number(v.precio_diario);
          return v.activo &&
            (!filtro.tipoVehiculo || v.tipoVehiculo === filtro.tipoVehiculo) &&
            (!filtro.marca || v.marca.toLowerCase().includes(filtro.marca.trim().toLowerCase())) &&
            (!filtro.modelo || v.modelo.toLowerCase().includes(filtro.modelo.trim().toLowerCase())) &&
            (filtro.precioMin == null || precio >= filtro.precioMin) &&
            (filtro.precioMax == null || precio <= filtro.precioMax);
        }).map((v: any) => ({
          id: String(v.id), patente: v.patente, marca: v.marca, modelo: v.modelo,
          anio: v.anio, color: v.color, tipoVehiculo: v.tipoVehiculo,
          precioDiario: Number(v.precio_diario),
        }));
      },
      historialAlquileres: async () => {
        const response = await rentalService.getRentalHistory(sesion.clienteId);
        const rentals = (response.rentals || []).filter((r: any) =>
          ["TERMINADA", "CANCELADA"].includes(r.estado));
        // gRPC de vehículos, no acceso directo a la base del otro servicio.
        const vehiclesResponse = await vehicleService.getVehicles();
        const vehicles = new Map((vehiclesResponse.vehicles || []).map((v: any) => [String(v.id), v]));
        return rentals.map((r: any) => {
          const v: any = vehicles.get(String(r.vehiculo_id));
          return {
            id: String(r.id), vehiculo: v ? `${v.marca} ${v.modelo}` : `Vehículo #${r.vehiculo_id}`,
            patente: v?.patente || "No disponible",
            fechaInicio: r.fecha_inicio, fechaFin: r.fecha_fin,
            cantidadDias: Number(r.duracion_dias), importeTotal: Number(r.importe_total),
            estado: r.estado,
          };
        });
      },
    },
  });
  res.status(result.errors ? 400 : 200).json(result);
});
export default router;