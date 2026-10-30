USE `Rentar`;

ALTER TABLE `lk_vehiculos`
    ADD COLUMN `id_cliente` BIGINT NULL,
    ADD INDEX `idx_vehiculos_cliente` (`id_cliente` ASC),
    ADD CONSTRAINT `fk_vehiculo_cliente`
        FOREIGN KEY (`id_cliente`)
        REFERENCES `lk_clientes` (`id_cliente`);

CREATE TABLE `incorporacion_correlacion` (
    `id_correlacion` BIGINT NOT NULL AUTO_INCREMENT,
    `vehiculo_externo_id` BIGINT NOT NULL,
    `cliente_id` BIGINT NULL,
    `patente` VARCHAR(20) NULL,
    `resultado_patente` VARCHAR(20) NULL,
    `resultado_titularidad` VARCHAR(20) NULL,
    `resultado_final` VARCHAR(20) NULL,
    `evento_completada_publicado` TINYINT(1) NOT NULL DEFAULT 0,
    `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    `fecha_finalizacion` DATETIME NULL,
    PRIMARY KEY (`id_correlacion`),
    UNIQUE KEY `uk_correlacion_vehiculo` (`vehiculo_externo_id`),
    KEY `idx_correlacion_cliente` (`cliente_id`),
    CONSTRAINT `fk_correlacion_vehiculo`
        FOREIGN KEY (`vehiculo_externo_id`)
        REFERENCES `lk_vehiculos` (`id_vehiculo`),
    CONSTRAINT `fk_correlacion_cliente`
        FOREIGN KEY (`cliente_id`)
        REFERENCES `lk_clientes` (`id_cliente`),
    CONSTRAINT `chk_correlacion_patente`
        CHECK (`resultado_patente` IS NULL OR
               `resultado_patente` IN ('VALIDADO', 'RECHAZADO')),
    CONSTRAINT `chk_correlacion_titularidad`
        CHECK (`resultado_titularidad` IS NULL OR
               `resultado_titularidad` IN ('VALIDADO', 'RECHAZADO')),
    CONSTRAINT `chk_correlacion_final`
        CHECK (`resultado_final` IS NULL OR
               `resultado_final` IN ('VALIDADO', 'RECHAZADO'))
) ENGINE = InnoDB;
