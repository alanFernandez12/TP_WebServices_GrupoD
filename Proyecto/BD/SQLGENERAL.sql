CREATE DATABASE  IF NOT EXISTS `rentar_titularidad` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rentar_titularidad`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: rentar_titularidad
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `lk_registro_titularidad`
--

DROP TABLE IF EXISTS `lk_registro_titularidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_registro_titularidad` (
  `cod_patente` varchar(20) NOT NULL,
  `cod_documento_titular` varchar(50) NOT NULL,
  PRIMARY KEY (`cod_patente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'rentar_titularidad'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-31 17:55:22
CREATE DATABASE  IF NOT EXISTS `rentar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rentar`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: rentar
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ft_incorporacion_correlacion`
--

DROP TABLE IF EXISTS `ft_incorporacion_correlacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ft_incorporacion_correlacion` (
  `id_correlacion` bigint NOT NULL AUTO_INCREMENT,
  `vehiculo_externo_id` bigint NOT NULL,
  `cliente_id` bigint DEFAULT NULL,
  `patente` varchar(20) DEFAULT NULL,
  `resultado_patente` varchar(20) DEFAULT NULL,
  `resultado_titularidad` varchar(20) DEFAULT NULL,
  `resultado_final` varchar(20) DEFAULT NULL,
  `evento_completada_publicado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_finalizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_correlacion`),
  UNIQUE KEY `uk_correlacion_vehiculo` (`vehiculo_externo_id`),
  KEY `idx_correlacion_cliente` (`cliente_id`),
  CONSTRAINT `fk_correlacion_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `lk_clientes` (`id_cliente`),
  CONSTRAINT `fk_correlacion_vehiculo` FOREIGN KEY (`vehiculo_externo_id`) REFERENCES `lk_vehiculos` (`id_vehiculo`),
  CONSTRAINT `chk_correlacion_final` CHECK (((`resultado_final` is null) or (`resultado_final` in (_utf8mb4'VALIDADO',_utf8mb4'RECHAZADO')))),
  CONSTRAINT `chk_correlacion_patente` CHECK (((`resultado_patente` is null) or (`resultado_patente` in (_utf8mb4'VALIDADO',_utf8mb4'RECHAZADO')))),
  CONSTRAINT `chk_correlacion_titularidad` CHECK (((`resultado_titularidad` is null) or (`resultado_titularidad` in (_utf8mb4'VALIDADO',_utf8mb4'RECHAZADO'))))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ft_reservas`
--

DROP TABLE IF EXISTS `ft_reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ft_reservas` (
  `id_reserva` bigint NOT NULL AUTO_INCREMENT,
  `id_tiempo` bigint NOT NULL,
  `id_cliente` bigint NOT NULL,
  `id_vehiculo` bigint NOT NULL,
  `hora_inicio` datetime NOT NULL,
  `hora_fin` datetime NOT NULL,
  `num_duracion_dias` int NOT NULL,
  `f_val_precio_diario_historico` decimal(12,2) NOT NULL,
  `f_val_importe_total` decimal(12,2) NOT NULL,
  `desc_estado_reserva` varchar(50) NOT NULL DEFAULT 'CONFIRMADA',
  `desc_mantenimiento` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `fk_reserva_tiempo` (`id_tiempo`),
  KEY `fk_reserva_cliente` (`id_cliente`),
  KEY `fk_reserva_vehiculo` (`id_vehiculo`),
  CONSTRAINT `fk_reserva_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `lk_clientes` (`id_cliente`),
  CONSTRAINT `fk_reserva_tiempo` FOREIGN KEY (`id_tiempo`) REFERENCES `lk_tiempo` (`id_tiempo`),
  CONSTRAINT `fk_reserva_vehiculo` FOREIGN KEY (`id_vehiculo`) REFERENCES `lk_vehiculos` (`id_vehiculo`),
  CONSTRAINT `ck_reservas_mantenimiento` CHECK ((`desc_mantenimiento` in (_utf8mb4'REALIZADO',_utf8mb4'NO_REALIZADO')))
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lk_clientes`
--

DROP TABLE IF EXISTS `lk_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_clientes` (
  `id_cliente` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `cod_documento` varchar(50) NOT NULL,
  `nom_nombre` varchar(100) NOT NULL,
  `desc_apellido` varchar(100) NOT NULL,
  `desc_telefono` varchar(50) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `flag_activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `cod_documento` (`cod_documento`),
  CONSTRAINT `fk_cliente_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `lk_usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lk_tiempo`
--

DROP TABLE IF EXISTS `lk_tiempo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_tiempo` (
  `id_tiempo` bigint NOT NULL AUTO_INCREMENT,
  `fecha_calendario` date NOT NULL,
  `num_anio` int NOT NULL,
  `num_mes` int NOT NULL,
  `num_dia` int NOT NULL,
  `desc_nombre_mes` varchar(20) NOT NULL,
  `desc_dia_semana` varchar(20) NOT NULL,
  PRIMARY KEY (`id_tiempo`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lk_usuarios`
--

DROP TABLE IF EXISTS `lk_usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_usuarios` (
  `id_usuario` bigint NOT NULL AUTO_INCREMENT,
  `desc_email` varchar(255) NOT NULL,
  `desc_password_hash` varchar(255) NOT NULL,
  `desc_rol` varchar(50) NOT NULL,
  `flag_activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `desc_email` (`desc_email`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lk_vehiculos`
--

DROP TABLE IF EXISTS `lk_vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_vehiculos` (
  `id_vehiculo` bigint NOT NULL AUTO_INCREMENT,
  `cod_patente` varchar(20) NOT NULL,
  `desc_marca` varchar(100) NOT NULL,
  `desc_modelo` varchar(100) NOT NULL,
  `num_anio` int NOT NULL,
  `desc_color` varchar(50) DEFAULT NULL,
  `desc_tipo_vehiculo` varchar(50) NOT NULL,
  `f_val_precio_diario` decimal(12,2) NOT NULL,
  `desc_estado_vehiculo` varchar(50) NOT NULL DEFAULT 'DISPONIBLE',
  `flag_activo` tinyint(1) NOT NULL DEFAULT '1',
  `id_cliente` bigint DEFAULT NULL,
  PRIMARY KEY (`id_vehiculo`),
  UNIQUE KEY `cod_patente` (`cod_patente`),
  KEY `idx_vehiculos_cliente` (`id_cliente`),
  CONSTRAINT `fk_vehiculo_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `lk_clientes` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'rentar'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-31 17:55:23
CREATE DATABASE  IF NOT EXISTS `rentar_policial` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rentar_policial`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: rentar_policial
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `lk_registro_policial`
--

DROP TABLE IF EXISTS `lk_registro_policial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lk_registro_policial` (
  `cod_patente` varchar(20) NOT NULL,
  `flag_robada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`cod_patente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'rentar_policial'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-31 17:55:23
