import { customerClient } from "../grpc/clients/customerClient";

export const getCustomers = (): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.GetCustomers(
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

export const getCustomer = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.GetCustomer(
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

export const customerExists = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.CustomerExists(
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

export const isCustomerActive = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.IsCustomerActive(
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