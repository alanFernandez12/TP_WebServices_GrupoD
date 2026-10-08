import { Request, Response, NextFunction } from "express";
import * as customerService from "../services/customerService";

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await customerService.getCustomers();

    res.status(200).json(response);
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

    res.status(200).json(response);
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