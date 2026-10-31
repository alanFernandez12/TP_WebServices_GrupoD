USE `Rentar`;

-- NULL = todavía no hay resultado de mantenimiento para la reserva.
ALTER TABLE `ft_reservas`
    ADD COLUMN `desc_mantenimiento` VARCHAR(20) NULL,
    ADD CONSTRAINT `ck_reservas_mantenimiento`
        CHECK (`desc_mantenimiento` IN ('REALIZADO', 'NO_REALIZADO'));

-- Verificar:
-- SELECT id_reserva, desc_mantenimiento FROM ft_reservas ORDER BY id_reserva DESC LIMIT 5;

-- Deshacer:
-- ALTER TABLE `ft_reservas` DROP CONSTRAINT `ck_reservas_mantenimiento`, DROP COLUMN `desc_mantenimiento`;
