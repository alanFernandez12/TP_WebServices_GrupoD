import { ResultSetHeader, RowDataPacket } from "mysql2";
import { database } from "./database";

export type Vehicle = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  estado: string;
};

type VehicleRow = RowDataPacket & {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  estado: string;
};

/**
 * Convierte una fila de MySQL al formato definido por vehicle.proto.
 */
const mapVehicle = (row: VehicleRow): Vehicle => ({
  id: String(row.id),
  patente: row.patente,
  marca: row.marca,
  modelo: row.modelo,
  estado: row.estado,
});

/**
 * Accede a la tabla lk_vehiculos y contiene las consultas del servicio.
 */
export class VehicleRepository {
  /**
   * Busca todos los vehículos activos.
   */
  async findAll(): Promise<Vehicle[]> {
    const [rows] = await database.query<VehicleRow[]>(
      `
        SELECT
          id_vehiculo AS id,
          cod_patente AS patente,
          desc_marca AS marca,
          desc_modelo AS modelo,
          desc_estado_vehiculo AS estado
        FROM lk_vehiculos
        WHERE flag_activo = 1
        ORDER BY id_vehiculo
      `
    );

    return rows.map(mapVehicle);
  }

  /**
   * Busca un vehículo activo por su ID.
   */
  async findById(id: string): Promise<Vehicle | null> {
    const [rows] = await database.execute<VehicleRow[]>(
      `
        SELECT
          id_vehiculo AS id,
          cod_patente AS patente,
          desc_marca AS marca,
          desc_modelo AS modelo,
          desc_estado_vehiculo AS estado
        FROM lk_vehiculos
        WHERE id_vehiculo = ? AND flag_activo = 1
      `,
      [id]
    );

    return rows.length > 0 ? mapVehicle(rows[0]) : null;
  }

  /**
   * Busca vehículos disponibles y sin reservas superpuestas en el período.
   */
  async findAvailable(
    fechaInicio: string,
    fechaFin: string
  ): Promise<Vehicle[]> {
    const [rows] = await database.execute<VehicleRow[]>(
      `
        SELECT
          v.id_vehiculo AS id,
          v.cod_patente AS patente,
          v.desc_marca AS marca,
          v.desc_modelo AS modelo,
          v.desc_estado_vehiculo AS estado
        FROM lk_vehiculos v
        WHERE v.flag_activo = 1
          AND v.desc_estado_vehiculo = 'DISPONIBLE'
          AND NOT EXISTS (
            SELECT 1
            FROM ft_reservas r
            WHERE r.id_vehiculo = v.id_vehiculo
              AND r.desc_estado_reserva <> 'CANCELADA'
              AND r.hora_inicio < ?
              AND r.hora_fin > ?
          )
        ORDER BY v.id_vehiculo
      `,
      [fechaFin, fechaInicio]
    );

    return rows.map(mapVehicle);
  }

  /**
   * Actualiza el estado de un vehículo activo y devuelve el resultado.
   */
  async updateStatus(
    id: string,
    estado: string
  ): Promise<Vehicle | null> {
    const [result] = await database.execute<ResultSetHeader>(
      `
        UPDATE lk_vehiculos
        SET desc_estado_vehiculo = ?
        WHERE id_vehiculo = ? AND flag_activo = 1
      `,
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }
}
