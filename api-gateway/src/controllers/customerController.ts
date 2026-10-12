import { Request, Response, NextFunction } from "express";
import * as customerService from "../services/customerService";
import * as rentalService from "../services/rentalService";

const normalizeCustomer = (customer: any) => ({
  id: Number(customer.id),
  documento: customer.documento || "",
  nombre: customer.nombre,
  apellido: customer.apellido,
  email: customer.email,
  telefono: customer.telefono || "",
  activo: Boolean(customer.activo),
  fechaNacimiento: customer.fecha_nacimiento || "",
});

// El front manda fechaNacimiento y el proto usa fecha_nacimiento
const toRequest = (body: any) => ({
  ...body,
  fecha_nacimiento: body.fechaNacimiento,
});

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await customerService.getCustomers();

    res.status(200).json(response.customers.map(normalizeCustomer));
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await customerService.getCustomer(id);

    res.status(200).json(normalizeCustomer(response.customer));
  } catch (error) {
    next(error);
  }
};

export const customerExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await customerService.customerExists(id);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const isCustomerActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await customerService.isCustomerActive(id);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await customerService.createCustomer(toRequest(req.body));

    res.status(201).json(normalizeCustomer(response.customer));
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await customerService.updateCustomer(id, toRequest(req.body));

    res.status(200).json(normalizeCustomer(response.customer));
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    // Las reservas son de rental-service: el gateway valida antes de dar de baja
    const historial = await rentalService.getRentalHistory(id);
    const tieneReservasActivas = historial.rentals.some(
      (reserva: any) =>
        ["PENDIENTE", "CONFIRMADA"].includes(reserva.estado) &&
        new Date(reserva.fecha_fin) > new Date()
    );

    if (tieneReservasActivas) {
      return res.status(409).json({
        status: 409,
        message: "No se puede dar de baja al cliente porque tiene reservas activas. Deben cancelarse o finalizar primero.",
      });
    }

    await customerService.deleteCustomer(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const reactivateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    await customerService.reactivateCustomer(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
