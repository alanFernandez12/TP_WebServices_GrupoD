import { Request, Response, NextFunction } from "express";
import * as vehicleService from "../services/vehicleService";
import * as customerService from "../services/customerService";

const normalizeVehicle = (vehicle: any) => ({
  id: Number(vehicle.id),
  patente: vehicle.patente,
  marca: vehicle.marca,
  modelo: vehicle.modelo,
  anio: Number(vehicle.anio),
  tipoVehiculo: vehicle.tipoVehiculo,
  estado: vehicle.estado,
  color: vehicle.color || "",
  precio_diario: vehicle.precio_diario,
  activo: Boolean(vehicle.activo),
  clienteId: Number(vehicle.cliente_id),
});

const isValidPrice = (price: unknown) =>
  (typeof price === "string" || typeof price === "number") &&
  /^\d{1,10}(\.\d{1,2})?$/.test(String(price)) &&
  Number(price) >= 0;

const validateVehicleData = (body: any) => {
  if (
    !body.patente?.trim() ||
    !body.marca?.trim() ||
    !body.modelo?.trim() ||
    !body.tipoVehiculo?.trim() ||
    !body.color?.trim()
  ) {
    return "Los campos patente, marca, modelo, tipo de vehículo y color son obligatorios.";
  }
  if (!Number.isInteger(Number(body.anio)) || Number(body.anio) <= 0) {
    return "El año del vehículo no es válido.";
  }
  if (!isValidPrice(body.precio_diario)) {
    return "El precio diario debe ser un importe válido con hasta dos decimales.";
  }
  return null;
};

export const createExternalVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationError = validateVehicleData(req.body);
    if (validationError) {
      res.status(400).json({ status: 400, message: validationError });
      return;
    }

    const clienteId = Number(res.locals.sesion?.clienteId);
    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      res.status(403).json({
        status: 403,
        message: "La cuenta no tiene un cliente asociado.",
      });
      return;
    }
    const customerStatus = await customerService.isCustomerActive(clienteId);
    if (!customerStatus.active) {
      res.status(403).json({
        status: 403,
        message: "El cliente asociado no está activo.",
      });
      return;
    }

    const response = await vehicleService.createExternalVehicle({
      patente: req.body.patente.trim(),
      marca: req.body.marca.trim(),
      modelo: req.body.modelo.trim(),
      anio: Number(req.body.anio),
      tipoVehiculo: req.body.tipoVehiculo.trim(),
      color: req.body.color.trim(),
      precio_diario: String(req.body.precio_diario),
      cliente_id: clienteId,
    });

    res.status(201).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};
