package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.exception.BusinessException;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;


@Getter
@Setter
public class DisponibilidadFiltroInput {

    private TipoVehiculo tipoVehiculo;
    private String marca;
    private String modelo;
    private BigDecimal precioMinimo;
    private BigDecimal precioMaximo;
    private String fechaInicio;
    private String fechaFin;

    public LocalDateTime getFechaInicioComoDateTime() {
        return parsear(fechaInicio, "inicio");
    }

    public LocalDateTime getFechaFinComoDateTime() {
        return parsear(fechaFin, "fin");
    }

    public void validar() {
        LocalDateTime inicio = getFechaInicioComoDateTime();
        LocalDateTime fin = getFechaFinComoDateTime();

        if (!fin.isAfter(inicio)) {
            throw new BusinessException("La fecha y hora de fin debe ser posterior al inicio.");
        }
        if (precioMinimo != null && precioMinimo.signum() < 0) {
            throw new BusinessException("El precio mínimo no puede ser negativo.");
        }
        if (precioMaximo != null && precioMaximo.signum() < 0) {
            throw new BusinessException("El precio máximo no puede ser negativo.");
        }
        if (precioMinimo != null && precioMaximo != null
                && precioMinimo.compareTo(precioMaximo) > 0) {
            throw new BusinessException("El precio mínimo no puede superar al precio máximo.");
        }
    }

    private LocalDateTime parsear(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException("La fecha y hora de " + campo + " es obligatoria.");
        }
        try {
            return LocalDateTime.parse(valor);
        } catch (DateTimeParseException ex) {
            throw new BusinessException(
                    "La fecha y hora de " + campo + " debe usar el formato ISO-8601, por ejemplo 2026-10-01T10:00:00."
            );
        }
    }
    
}
