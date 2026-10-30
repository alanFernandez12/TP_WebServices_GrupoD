CREATE DATABASE IF NOT EXISTS rentar_policial;
USE rentar_policial;

CREATE TABLE IF NOT EXISTS lk_registro_policial (
    cod_patente VARCHAR(20) PRIMARY KEY,
    flag_robada BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO lk_registro_policial (cod_patente, flag_robada)
VALUES
    ('AA123BB', FALSE),
    ('ROBO123', TRUE)
ON DUPLICATE KEY UPDATE flag_robada = VALUES(flag_robada);
