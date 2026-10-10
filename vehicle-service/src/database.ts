import mysql from "mysql2/promise";

/**
 * Pool de conexiones a la base Rentar. Reutiliza conexiones para evitar
 * abrir una conexión nueva en cada llamada gRPC.
 */
export const database = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "Rentar",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

/**
 * Verifica que la base esté disponible antes de iniciar el servidor gRPC.
 */
export const checkDatabaseConnection = async (): Promise<void> => {
  const connection = await database.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};
