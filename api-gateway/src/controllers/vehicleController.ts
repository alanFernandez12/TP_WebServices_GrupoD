import { Request, Response, NextFunction } from "express";
import * as vehicleService from "../services/vehicleService";

export const getVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await vehicleService.getVehicles();

    res.status(200).json(response);
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

    res.status(200).json(response);
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

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};