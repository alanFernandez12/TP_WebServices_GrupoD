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
  precio_diario: vehicle.precio_diario,
  activo: Boolean(vehicle.activo),
});

const isValidId = (id: number) =>
  Number.isSafeInteger(id) && id > 0;

const isValidDate = (date: unknown): date is string =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

const isValidPrice = (price: unknown) =>
  typeof price === "string" &&
  /^\d{1,10}(\.\d{1,2})?$/.test(price) &&
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

  if (
    !Number.isInteger(Number(body.anio)) ||
    Number(body.anio) <= 0
  ) {
    return "El año del vehículo no es válido.";
  }

  if (!isValidPrice(body.precio_diario)) {
    return "El precio diario debe ser un importe válido con hasta dos decimales.";
  }

  return null;
};

// GET /api/vehiculos
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

// GET /api/vehiculos/:id
export const getVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      res.status(400).json({
        status: 400,
        message: "El identificador del vehículo no es válido.",
      });
      return;
    }

    const response = await vehicleService.getVehicle(id);

    res.status(200).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};

// GET /api/vehiculos/disponibles?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
export const getAvailableVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fechaInicio = req.query.fechaInicio;
    const fechaFin = req.query.fechaFin;

    if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
      res.status(400).json({
        status: 400,
        message: "Las fechas son obligatorias y deben tener formato YYYY-MM-DD.",
      });
      return;
    }

    if (fechaInicio > fechaFin) {
      res.status(400).json({
        status: 400,
        message: "La fecha de inicio no puede ser posterior a la fecha de fin.",
      });
      return;
    }

    const response = await vehicleService.getAvailableVehicles(
      fechaInicio,
      fechaFin
    );

    res.status(200).json(response.vehicles.map(normalizeVehicle));
  } catch (error) {
    next(error);
  }
};

// POST /api/vehiculos
export const createVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationError = validateVehicleData(req.body);

    if (validationError) {
      res.status(400).json({
        status: 400,
        message: validationError,
      });
      return;
    }

    const response = await vehicleService.createVehicle({
      patente: req.body.patente.trim(),
      marca: req.body.marca.trim(),
      modelo: req.body.modelo.trim(),
      anio: Number(req.body.anio),
      tipoVehiculo: req.body.tipoVehiculo.trim(),
      color: req.body.color.trim(),
      precio_diario: req.body.precio_diario,
    });

    res.status(201).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};

// PUT /api/vehiculos/:id
export const updateVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      res.status(400).json({
        status: 400,
        message: "El identificador del vehículo no es válido.",
      });
      return;
    }

    const validationError = validateVehicleData({
      ...req.body,
      // La patente no se modifica.
      patente: "patente-no-modificable",
    });

    if (validationError) {
      res.status(400).json({
        status: 400,
        message: validationError,
      });
      return;
    }

    const response = await vehicleService.updateVehicle({
      id,
      marca: req.body.marca.trim(),
      modelo: req.body.modelo.trim(),
      anio: Number(req.body.anio),
      tipoVehiculo: req.body.tipoVehiculo.trim(),
      color: req.body.color.trim(),
      precio_diario: req.body.precio_diario,
    });

    res.status(200).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vehiculos/:id
export const deleteVehicle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      res.status(400).json({
        status: 400,
        message: "El identificador del vehículo no es válido.",
      });
      return;
    }

    const response = await vehicleService.deleteVehicle(id);

    res.status(200).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/vehiculos/:id/estado
export const updateVehicleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!isValidId(id)) {
      res.status(400).json({
        status: 400,
        message: "El identificador del vehículo no es válido.",
      });
      return;
    }

    if (typeof estado !== "string" || !estado.trim()) {
      res.status(400).json({
        status: 400,
        message: "El estado del vehículo es obligatorio.",
      });
      return;
    }

    const response = await vehicleService.updateVehicleStatus(
      id,
      estado.trim()
    );

    res.status(200).json(normalizeVehicle(response.vehicle));
  } catch (error) {
    next(error);
  }
};