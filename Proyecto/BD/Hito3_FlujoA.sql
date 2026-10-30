USE `Rentar`;

ALTER TABLE `lk_vehiculos`
    ADD COLUMN `desc_verificacion` VARCHAR(20) NULL DEFAULT 'PENDIENTE';
