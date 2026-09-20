-- =====================================================================
-- Datos de prueba - Rentar
-- =====================================================================
-- Carga un set coherente de usuarios, clientes, vehiculos, tiempo y
-- reservas para poder probar la API (REST y GraphQL).
--
-- Uso:
--   mysql -u root -padmin rentar < Proyecto/BD/DatosPrueba.sql
--
-- Notas:
--   - Todas las claves de usuario son "admin123" (hash BCrypt).
--   - El script es idempotente: limpia las tablas antes de insertar.
--   - Respeta el orden de las claves foraneas.
-- =====================================================================

USE `rentar`;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `ft_reservas`;
DELETE FROM `lk_tiempo`;
DELETE FROM `lk_clientes`;
DELETE FROM `lk_vehiculos`;
-- Conserva el usuario admin (id 1); elimina el resto para recargar clientes
DELETE FROM `lk_usuarios` WHERE `desc_email` <> 'admin@rentar.com';
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- USUARIOS (clave de todos: admin123)
-- ---------------------------------------------------------------------
INSERT INTO `lk_usuarios` (`id_usuario`, `desc_email`, `desc_password_hash`, `desc_rol`, `flag_activo`) VALUES
(10, 'juan.perez@mail.com',    '$2a$10$WHwUwJEs3ZEX/TzYylTKVudhRw/amb1yS8Fm5R6OQzLaZ8ncR2Rgm', 'CLIENTE', 1),
(11, 'maria.gomez@mail.com',   '$2a$10$WHwUwJEs3ZEX/TzYylTKVudhRw/amb1yS8Fm5R6OQzLaZ8ncR2Rgm', 'CLIENTE', 1),
(12, 'carlos.lopez@mail.com',  '$2a$10$WHwUwJEs3ZEX/TzYylTKVudhRw/amb1yS8Fm5R6OQzLaZ8ncR2Rgm', 'CLIENTE', 1),
(13, 'ana.torres@mail.com',    '$2a$10$WHwUwJEs3ZEX/TzYylTKVudhRw/amb1yS8Fm5R6OQzLaZ8ncR2Rgm', 'CLIENTE', 0);

-- ---------------------------------------------------------------------
-- CLIENTES (id_usuario -> lk_usuarios)
-- Ana Torres queda inactiva para probar la regla "cliente inactivo no alquila"
-- ---------------------------------------------------------------------
INSERT INTO `lk_clientes` (`id_cliente`, `id_usuario`, `cod_documento`, `nom_nombre`, `desc_apellido`, `desc_telefono`, `fecha_nacimiento`, `flag_activo`) VALUES
(1, 10, '30111222', 'Juan',   'Perez', '1155501001', '1990-05-10', 1),
(2, 11, '31222333', 'Maria',  'Gomez', '1155501002', '1988-11-22', 1),
(3, 12, '32333444', 'Carlos', 'Lopez', '1155501003', '1995-02-15', 1),
(4, 13, '33444555', 'Ana',    'Torres','1155501004', '1992-07-30', 0);

-- ---------------------------------------------------------------------
-- VEHICULOS
-- ---------------------------------------------------------------------
INSERT INTO `lk_vehiculos` (`id_vehiculo`, `cod_patente`, `desc_marca`, `desc_modelo`, `num_anio`, `desc_color`, `desc_tipo_vehiculo`, `f_val_precio_diario`, `desc_estado_vehiculo`, `flag_activo`) VALUES
(1, 'AA123BB', 'Toyota',     'Corolla', 2022, 'Blanco', 'SEDAN',     35000.00, 'DISPONIBLE', 1),
(2, 'AC456DD', 'Ford',       'Ranger',  2021, 'Gris',   'PICKUP',    52000.00, 'DISPONIBLE', 1),
(3, 'AD789EE', 'Volkswagen', 'Gol',     2020, 'Rojo',   'HATCHBACK', 28000.00, 'DISPONIBLE', 1),
(4, 'AE012FF', 'Chevrolet',  'Tracker', 2023, 'Negro',  'SUV',       45000.00, 'DISPONIBLE', 1);

-- ---------------------------------------------------------------------
-- TIEMPO (dimension de fechas usada por las reservas)
-- ---------------------------------------------------------------------
INSERT INTO `lk_tiempo` (`id_tiempo`, `fecha_calendario`, `num_anio`, `num_mes`, `num_dia`, `desc_nombre_mes`, `desc_dia_semana`) VALUES
(1, '2025-01-10', 2025, 1, 10, 'JANUARY',  'FRIDAY'),
(2, '2025-02-05', 2025, 2, 5,  'FEBRUARY', 'WEDNESDAY'),
(3, '2025-03-20', 2025, 3, 20, 'MARCH',    'THURSDAY'),
(4, '2026-12-01', 2026, 12, 1, 'DECEMBER', 'TUESDAY');

-- ---------------------------------------------------------------------
-- RESERVAS
--   - Reservas pasadas TERMINADA / CANCELADA para probar historial.
--   - Una reserva futura CONFIRMADA.
-- ---------------------------------------------------------------------
INSERT INTO `ft_reservas` (`id_reserva`, `id_tiempo`, `id_cliente`, `id_vehiculo`, `hora_inicio`, `hora_fin`, `num_duracion_dias`, `f_val_precio_diario_historico`, `f_val_importe_total`, `desc_estado_reserva`) VALUES
-- Juan (cliente 1): un alquiler terminado y uno cancelado -> aparece en historial
(1, 1, 1, 1, '2025-01-10 10:00:00', '2025-01-13 10:00:00', 3, 35000.00, 105000.00, 'TERMINADA'),
(2, 2, 1, 3, '2025-02-05 09:00:00', '2025-02-06 09:00:00', 1, 28000.00, 28000.00,  'CANCELADA'),
-- Maria (cliente 2): un alquiler terminado
(3, 3, 2, 2, '2025-03-20 08:00:00', '2025-03-25 08:00:00', 5, 52000.00, 260000.00, 'TERMINADA'),
-- Carlos (cliente 3): una reserva futura confirmada
(4, 4, 3, 4, '2026-12-01 12:00:00', '2026-12-04 12:00:00', 3, 45000.00, 135000.00, 'CONFIRMADA');

-- Realinea los AUTO_INCREMENT para que las altas por API sigan la secuencia
ALTER TABLE `lk_usuarios`  AUTO_INCREMENT = 100;
ALTER TABLE `lk_clientes`  AUTO_INCREMENT = 100;
ALTER TABLE `lk_vehiculos` AUTO_INCREMENT = 100;
ALTER TABLE `lk_tiempo`    AUTO_INCREMENT = 100;
ALTER TABLE `ft_reservas`  AUTO_INCREMENT = 100;
