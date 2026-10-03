import { rentalClient } from "../grpc/clients/rentalClient";

export const createRental = (
  clienteId: number,
  vehiculoId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<any> =>
  new Promise((resolve, reject) => {
    rentalClient.CreateRental(
      {
        cliente_id: String(clienteId),
        vehiculo_id: String(vehiculoId),
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

export const getRentals = (): Promise<any> =>
  new Promise((resolve, reject) => {
    rentalClient.GetRentals(
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

export const getRental = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    rentalClient.GetRental(
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

export const cancelRental = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    rentalClient.CancelRental(
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

export const getRentalHistory = (
  clienteId: number
): Promise<any> =>
  new Promise((resolve, reject) => {
    rentalClient.GetRentalHistory(
      { cliente_id: String(clienteId) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });