import { Request, Response, NextFunction } from "express";
import * as vehicleService from "../services/vehicleService";

const normalizeVehicle = (vehicle: any) => ({
  id: Number(vehicle.id),
  patente: vehicle.patente,
  marca: vehicle.marca,
  modelo: vehicle.modelo,
  anio: Number(vehicle.anio),
  tipoVehiculo: vehicle.tipoVehiculo,
  estado: vehicle.estado,
  color: vehicle.color || "",
  precio_diario: Number(vehicle.precio_diario),
  activo: Boolean(vehicle.activo),
});

export const getVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await vehicleService.getVehicles();

    res.status(200).json(response.vehicles.map(normalizeVehicle));
  } catch (error) {
    next(error);
  }
};

export const getVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await vehicleService.getVehicle(id);

    res.status(200).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};

export const getAvailableVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const response =
      await vehicleService.getAvailableVehicles(
        String(fechaInicio),
        String(fechaFin)
      );

    res.status(200).json(response.vehicles.map(normalizeVehicle));
  } catch (error) {
    next(error);
  }
};