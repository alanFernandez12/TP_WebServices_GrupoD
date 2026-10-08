import { vehicleClient } from "../grpc/clients/vehicleClient";

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

export const getVehicle = (
  id: number
): Promise<any> => {
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