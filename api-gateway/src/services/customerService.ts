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

export const login = (email: string, password: string): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.Login(
      { email, password },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });

export const createCustomer = (data: any): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.CreateCustomer(
      data,
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });

export const updateCustomer = (id: number, data: any): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.UpdateCustomer(
      { ...data, id: String(id) },
      (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );
  });

export const deleteCustomer = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.DeleteCustomer(
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

export const reactivateCustomer = (id: number): Promise<any> =>
  new Promise((resolve, reject) => {
    customerClient.ReactivateCustomer(
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
