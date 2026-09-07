package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
public class VehiculoRequestDTO {
    private String patente;
    private String marca;
    private String modelo;
    private int anio;
    private TipoVehiculo tipoVehiculo;
    private EstadoVehiculo estado;
    private String color;
    private String precio_diario;
    private boolean activo;


    public VehiculoRequestDTO() {
    }

}