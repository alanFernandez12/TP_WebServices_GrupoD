import { status as grpcStatus } from "@grpc/grpc-js";
import { rentalClient } from "../grpc/clients/rentalClient";
import { customerExists, isCustomerActive } from "./customerService";
import { getVehicle, getAvailableVehicles } from "./vehicleService";

const validationError = (code: number, details: string): never => {
    throw Object.assign(new Error(details), { code, details });
};

export const validateRental = async (
    clienteId: number,
    vehiculoId: number,
    fechaInicio: string,
    fechaFin: string
): Promise<void> => {
    if (
        !Number.isSafeInteger(clienteId) ||
        clienteId <= 0 ||
        !Number.isSafeInteger(vehiculoId) ||
        vehiculoId <= 0
    ) {
        validationError(
            grpcStatus.INVALID_ARGUMENT,
            "Cliente y vehículo son obligatorios"
        );
    }

    if (!fechaInicio || !fechaFin) {
        validationError(
            grpcStatus.INVALID_ARGUMENT,
            "Las fechas de inicio y fin son obligatorias"
        );
    }

    const customer = await customerExists(clienteId);
    if (!customer.exists) {
        validationError(grpcStatus.NOT_FOUND, "Cliente no encontrado");
    }

    const customerStatus = await isCustomerActive(clienteId);
    if (!customerStatus.active) {
        validationError(
            grpcStatus.FAILED_PRECONDITION,
            "El cliente no está activo"
        );
    }

    await getVehicle(vehiculoId);

    const available = await getAvailableVehicles(fechaInicio, fechaFin);
    const isAvailable = available.vehicles.some(
        (vehicle: { id: string | number }) =>
            String(vehicle.id) === String(vehiculoId)
    );

    if (!isAvailable) {
        validationError(
            grpcStatus.FAILED_PRECONDITION,
            "El vehículo no está disponible durante el período solicitado"
        );
    }
};

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
        rentalClient.GetRentals({}, (error: any, response: any) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        });
    });

export const getRental = (id: number): Promise<any> =>
    new Promise((resolve, reject) => {
        rentalClient.GetRental({ id: String(id) }, (error: any, response: any) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        });
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

export const getRentalHistory = (clienteId: number): Promise<any> =>
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