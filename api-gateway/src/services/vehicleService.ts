import { vehicleClient } from "../grpc/clients/vehicleClient";

// Obtiene todos los vehículos.
export const getVehicles = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.GetVehicles(
      {},
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Obtiene un vehículo por su identificador.
export const getVehicle = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.GetVehicle(
      { id: String(id) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Consulta los vehículos disponibles en un período.
export const getAvailableVehicles = (
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.GetAvailableVehicles(
      {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Registra un nuevo vehículo.
export const createVehicle = (vehicle: {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoVehiculo: string;
  color: string;
  precio_diario: string;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.CreateVehicle(
      vehicle,
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

export const createExternalVehicle = (vehicle: {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoVehiculo: string;
  color: string;
  precio_diario: string;
  cliente_id: number;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.CreateExternalVehicle(
      { ...vehicle, cliente_id: String(vehicle.cliente_id) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      }
    );
  });
};

// Modifica los datos permitidos de un vehículo.
export const updateVehicle = (vehicle: {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  tipoVehiculo: string;
  color: string;
  precio_diario: string;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.UpdateVehicle(
      {
        ...vehicle,
        id: String(vehicle.id),
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Realiza la baja lógica de un vehículo.
export const deleteVehicle = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.DeleteVehicle(
      { id: String(id) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Actualiza el estado operativo de un vehículo.
export const updateVehicleStatus = (
  id: number,
  estado: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.UpdateVehicleStatus(
      {
        id: String(id),
        estado,
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};

// Reactiva un vehículo previamente dado de baja.
export const reactivateVehicle = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    vehicleClient.ReactivateVehicle(
      { id: String(id) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });
};