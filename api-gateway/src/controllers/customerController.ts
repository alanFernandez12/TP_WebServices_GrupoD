import { Request, Response, NextFunction } from "express";
import * as customerService from "../services/customerService";

const normalizeCustomer = (customer: any) => ({
  id: Number(customer.id),
  documento: customer.documento || "",
  nombre: customer.nombre,
  apellido: customer.apellido,
  email: customer.email,
  telefono: customer.telefono || "",
  activo: Boolean(customer.activo),
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
    const { nombre, apellido, email } = req.body;

    if (!nombre || !apellido || !email) {
      res.status(400).json({
        status: 400,
        message: "Nombre, apellido y email son obligatorios",
      });
      return;
    }

    const response = await customerService.createCustomer({
      nombre,
      apellido,
      email,
    });

    res.status(201).json(response);
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

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        status: 400,
        message: "El ID del cliente no es válido",
      });
      return;
    }

    const { nombre, apellido, email } = req.body;

    if (!nombre || !apellido || !email) {
      res.status(400).json({
        status: 400,
        message: "Nombre, apellido y email son obligatorios",
      });
      return;
    }

    const response = await customerService.updateCustomer(id, {
      nombre,
      apellido,
      email,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};