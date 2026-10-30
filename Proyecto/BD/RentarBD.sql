-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema Rentar
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema Rentar
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `Rentar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `Rentar` ;

-- -----------------------------------------------------
-- Table `Rentar`.`lk_usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Rentar`.`lk_usuarios` (
  `id_usuario` BIGINT NOT NULL AUTO_INCREMENT,
  `desc_email` VARCHAR(255) NOT NULL,
  `desc_password_hash` VARCHAR(255) NOT NULL,
  `desc_rol` VARCHAR(50) NOT NULL,
  `flag_activo` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `desc_email` (`desc_email` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `Rentar`.`lk_clientes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Rentar`.`lk_clientes` (
  `id_cliente` BIGINT NOT NULL AUTO_INCREMENT,
  `id_usuario` BIGINT NOT NULL,
  `cod_documento` VARCHAR(50) NOT NULL,
  `nom_nombre` VARCHAR(100) NOT NULL,
  `desc_apellido` VARCHAR(100) NOT NULL,
  `desc_telefono` VARCHAR(50) NULL DEFAULT NULL,
  `fecha_nacimiento` DATE NULL DEFAULT NULL,
  `flag_activo` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_cliente`),
  UNIQUE INDEX `id_usuario` (`id_usuario` ASC) VISIBLE,
  UNIQUE INDEX `cod_documento` (`cod_documento` ASC) VISIBLE,
  CONSTRAINT `fk_cliente_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `Rentar`.`lk_usuarios` (`id_usuario`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `Rentar`.`lk_tiempo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Rentar`.`lk_tiempo` (
  `id_tiempo` BIGINT NOT NULL AUTO_INCREMENT,
  `fecha_calendario` DATE NOT NULL,
  `num_anio` INT NOT NULL,
  `num_mes` INT NOT NULL,
  `num_dia` INT NOT NULL,
  `desc_nombre_mes` VARCHAR(20) NOT NULL,
  `desc_dia_semana` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_tiempo`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `Rentar`.`lk_vehiculos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Rentar`.`lk_vehiculos` (
  `id_vehiculo` BIGINT NOT NULL AUTO_INCREMENT,
  `cod_patente` VARCHAR(20) NOT NULL,
  `desc_marca` VARCHAR(100) NOT NULL,
  `desc_modelo` VARCHAR(100) NOT NULL,
  `num_anio` INT NOT NULL,
  `desc_color` VARCHAR(50) NULL DEFAULT NULL,
  `desc_tipo_vehiculo` VARCHAR(50) NOT NULL,
  `f_val_precio_diario` DECIMAL(12,2) NOT NULL,
  `desc_estado_vehiculo` VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
  `flag_activo` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_vehiculo`),
  UNIQUE INDEX `cod_patente` (`cod_patente` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `Rentar`.`ft_reservas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Rentar`.`ft_reservas` (
  `id_reserva` BIGINT NOT NULL AUTO_INCREMENT,
  `id_tiempo` BIGINT NOT NULL,
  `id_cliente` BIGINT NOT NULL,
  `id_vehiculo` BIGINT NOT NULL,
  `hora_inicio` DATETIME NOT NULL,
  `hora_fin` DATETIME NOT NULL,
  `num_duracion_dias` INT NOT NULL,
  `f_val_precio_diario_historico` DECIMAL(12,2) NOT NULL,
  `f_val_importe_total` DECIMAL(12,2) NOT NULL,
  `desc_estado_reserva` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMADA',
  PRIMARY KEY (`id_reserva`),
  INDEX `fk_reserva_tiempo` (`id_tiempo` ASC) VISIBLE,
  INDEX `fk_reserva_cliente` (`id_cliente` ASC) VISIBLE,
  INDEX `fk_reserva_vehiculo` (`id_vehiculo` ASC) VISIBLE,
  CONSTRAINT `fk_reserva_cliente`
    FOREIGN KEY (`id_cliente`)
    REFERENCES `Rentar`.`lk_clientes` (`id_cliente`),
  CONSTRAINT `fk_reserva_tiempo`
    FOREIGN KEY (`id_tiempo`)
    REFERENCES `Rentar`.`lk_tiempo` (`id_tiempo`),
  CONSTRAINT `fk_reserva_vehiculo`
    FOREIGN KEY (`id_vehiculo`)
    REFERENCES `Rentar`.`lk_vehiculos` (`id_vehiculo`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
