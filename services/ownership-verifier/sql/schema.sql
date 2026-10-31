CREATE DATABASE IF NOT EXISTS Rentar_RegistroAutomotor;
USE Rentar_RegistroAutomotor;

CREATE TABLE IF NOT EXISTS lk_registro_titularidad (
    id_registro BIGINT NOT NULL AUTO_INCREMENT,
    cod_patente VARCHAR(20) NOT NULL,
    cod_documento_titular VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_registro),
    UNIQUE KEY uk_registro_patente (cod_patente)
);

INSERT INTO lk_registro_titularidad
    (cod_patente, cod_documento_titular)
VALUES
    ('AA123BB', '30111222')
ON DUPLICATE KEY UPDATE
    cod_documento_titular = VALUES(cod_documento_titular);
