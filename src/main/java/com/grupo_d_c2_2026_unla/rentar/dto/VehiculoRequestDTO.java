package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class VehiculoRequestDTO {
    @NotBlank
    private String patente;
    @NotBlank
    private String marca;
    @NotBlank
    private String modelo;
    @NotBlank
    private int anio;
    private TipoVehiculo tipoVehiculo;
    private EstadoVehiculo estado;
    private String color;
    private BigDecimal precio_diario;
    private boolean activo;

    public VehiculoRequestDTO() {
    }
}