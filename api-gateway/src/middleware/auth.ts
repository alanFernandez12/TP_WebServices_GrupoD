import { Request, Response, NextFunction } from "express";
import * as customerService from "../services/customerService";

// Roles permitidos por ruta (mismas reglas que tenía Spring Security)
const permisos: Record<string, string[]> = {
  "/api/clientes": ["ADMIN"],
  "/api/vehiculos": ["ADMIN"],
  "/api/reservas": ["ADMIN", "CLIENTE"],
};

// Autenticación por HTTP Basic: valida las credenciales contra customer-service
export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Basic ")) {
      return res.status(401).json({ status: 401, message: "No autenticado" });
    }

    const [email, password] = Buffer.from(header.slice(6), "base64")
      .toString()
      .split(":");

    const response = await customerService.login(email, password);

    if (!response.valido) {
      return res.status(401).json({ status: 401, message: "Correo o contraseña incorrectos" });
    }

    const ruta = Object.keys(permisos).find((r) => req.path.startsWith(r));

    if (ruta && !permisos[ruta].includes(response.rol)) {
      return res.status(403).json({ status: 403, message: "No tiene permisos" });
    }

    // Datos de la sesión para /api/auth/me
    res.locals.sesion = {
      email,
      nombre: response.nombre,
      rol: response.rol,
      clienteId: response.rol === "CLIENTE" ? Number(response.cliente_id) : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};
