import { Request, Response, NextFunction } from "express";
import { status as grpcStatus } from "@grpc/grpc-js";

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  // Errores provenientes de gRPC
  if (error?.code !== undefined) {
    switch (error.code) {
      case grpcStatus.NOT_FOUND:
        return res.status(404).json({
          status: 404,
          message: error.details || "Recurso no encontrado",
        });

      case grpcStatus.INVALID_ARGUMENT:
        return res.status(400).json({
          status: 400,
          message: error.details || "Solicitud inválida",
        });

      case grpcStatus.ALREADY_EXISTS:
        return res.status(409).json({
          status: 409,
          message: error.details || "El recurso ya existe",
        });

      case grpcStatus.FAILED_PRECONDITION:
        return res.status(409).json({
          status: 409,
          message: error.details || "No se puede realizar la operación",
        });

      case grpcStatus.UNAVAILABLE:
        return res.status(503).json({
          status: 503,
          message: "El servicio no está disponible",
        });

      case grpcStatus.DEADLINE_EXCEEDED:
        return res.status(504).json({
          status: 504,
          message: "El servicio tardó demasiado en responder",
        });
    }
  }

  // Error genérico
  return res.status(500).json({
    status: 500,
    message: "Error interno del servidor",
  });
};