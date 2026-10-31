/** Consultas GraphQL públicas del Gateway; todas las fuentes internas son gRPC. */
import { Router } from "express";
import { buildSchema, graphql } from "graphql";
import * as vehicleService from "./services/vehicleService";
import * as rentalService from "./services/rentalService";

const schema = buildSchema(`
  "Filtros de disponibilidad; fechas ISO-8601 con hora obligatorias"
  input DisponibilidadFiltro {
    fechaInicio: String!
    fechaFin: String!
    tipoVehiculo: String
    marca: String
    modelo: String
    precioMin: Float
    precioMax: Float
  }
  type VehiculoDisponible {
    id: ID!
    patente: String!
    marca: String!
    modelo: String!
    anio: Int!
    color: String
    tipoVehiculo: String!
    precioDiario: Float!
  }
  type AlquilerHistorico {
    id: ID!
    vehiculo: String!
    patente: String!
    fechaInicio: String!
    fechaFin: String!
    cantidadDias: Int!
    importeTotal: Float!
    estado: String!
  }
  type ReservaCliente {
    id: Int!
    cliente: ClienteReserva!
    vehiculo: VehiculoReserva!
    patente: String!
    precioDiarioHistorico: Float!
    horaInicio: String!
    horaFin: String!
    importeTotal: Float!
    estadoReserva: String!
  }
  type ClienteReserva { id: Int! nombre: String! apellido: String! documento: String! }
  type VehiculoReserva { id: Int! marca: String! modelo: String! patente: String! tipoVehiculo: String! }
  type Query {
    "Reservas correspondientes exclusivamente al cliente autenticado"
    misReservas: [ReservaCliente!]!
    "Consulta disponibilidad por período y filtros opcionales; solo CLIENTE"
    disponibilidad(filtro: DisponibilidadFiltro!): [VehiculoDisponible!]!
    "Historial del cliente autenticado (TERMINADA y CANCELADA)"
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