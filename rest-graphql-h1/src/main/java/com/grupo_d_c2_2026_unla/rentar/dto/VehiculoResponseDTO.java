package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class VehiculoResponseDTO {

    private int id;
    private String patente;
    private String marca;
    private String modelo;
    private int anio;
    private TipoVehiculo tipoVehiculo;
    private EstadoVehiculo estado;
    private String color;
    private BigDecimal precio_diario;
    private boolean activo;

    public VehiculoResponseDTO() {
    }

    public VehiculoResponseDTO(int id, String patente, String marca, String modelo, int anio, TipoVehiculo tipoVehiculo, EstadoVehiculo estado, String color, BigDecimal precio_diario, boolean activo) {
        this.id = id;
        this.patente = patente;
        this.marca = marca;
        this.modelo = modelo;
        this.anio = anio;
        this.tipoVehiculo = tipoVehiculo;
        this.estado = estado;
        this.color = color;
        this.precio_diario = precio_diario;
        this.activo = activo;
    }

    @Override
    public String toString() {
        return "VehiculoResponseDTO{" +
                "id=" + id +
                ", patente='" + patente + '\'' +
                ", marca='" + marca + '\'' +
                ", modelo='" + modelo + '\'' +
                ", anio=" + anio +
                ", tipoVehiculo='" + tipoVehiculo + '\'' +
                ", estado='" + estado + '\'' +
                ", color='" + color + '\'' +
                ", precio_diario='" + precio_diario + '\'' +
                ", activo=" + activo +
                '}';
    }
}
