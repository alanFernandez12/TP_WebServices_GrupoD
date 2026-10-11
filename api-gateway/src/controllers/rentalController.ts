import { Request, Response, NextFunction } from "express";
import * as rentalService from "../services/rentalService";

export const createRental = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
  try {
    const body = req.body ?? {};
    const clienteId = Number(body.clienteId ?? body.idCliente);
    const vehiculoId = Number(body.vehiculoId ?? body.idVehiculo);
    const fechaInicio = body.fechaInicio ?? body.horaInicio;
    const fechaFin = body.fechaFin ?? body.horaFin;

    await rentalService.validateRental(
        clienteId,
        vehiculoId,
        fechaInicio,
        fechaFin
    );

    const response = await rentalService.createRental(
        clienteId,
        vehiculoId,
        fechaInicio,
        fechaFin
    );

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getRentals = async (
    _req: Request,
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
    const response = await rentalService.getRental(Number(req.params.id));
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
    const response = await rentalService.cancelRental(Number(req.params.id));
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
    const response = await rentalService.getRentalHistory(
        Number(req.params.clienteId)
    );
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};