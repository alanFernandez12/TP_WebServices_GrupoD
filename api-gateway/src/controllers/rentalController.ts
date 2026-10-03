import { Request, Response, NextFunction } from "express";
import * as rentalService from "../services/rentalService";

export const createRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clienteId,
      vehiculoId,
      fechaInicio,
      fechaFin,
    } = req.body;

    const response = await rentalService.createRental(
      Number(clienteId),
      Number(vehiculoId),
      fechaInicio,
      fechaFin
    );

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRentals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await rentalService.getRentals();

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await rentalService.getRental(id);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const cancelRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    const response = await rentalService.cancelRental(id);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRentalHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clienteId = Number(req.params.clienteId);

    const response = await rentalService.getRentalHistory(
      clienteId
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};