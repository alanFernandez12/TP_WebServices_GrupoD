import { Request, Response, NextFunction } from "express";
import * as rentalService from "../services/rentalService";

const normalizeRental = (rental: any) => ({
  id: Number(rental.id),
  idCliente: Number(rental.cliente_id),
  idVehiculo: Number(rental.vehiculo_id),
  horaInicio: rental.fecha_inicio,
  horaFin: rental.fecha_fin,
  duracionDias: Number(rental.duracion_dias),
  precioDiarioHistorico: Number(rental.precio_diario_historico),
  importeTotal: Number(rental.importe_total),
  estadoReserva: rental.estado,
  descMantenimiento: rental.desc_mantenimiento || "",
});

const normalizeRentalResponse = (response: any) =>
  normalizeRental(response.rental);

const normalizeRentalListResponse = (response: any) =>
  response.rentals.map(normalizeRental);

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

    res.status(201).json(normalizeRentalResponse(response));
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
    res.status(200).json(normalizeRentalListResponse(response));
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
    res.status(200).json(normalizeRentalResponse(response));
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
    res.status(200).json(normalizeRentalResponse(response));
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
    res.status(200).json(normalizeRentalListResponse(response));
  } catch (error) {
    next(error);
  }
};