package com.grupo_d_c2_2026_unla.rentar.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Objects;
@Getter
@Setter
public class VehiculoResponseDTO {

    private int id;
    private String patente;
    private String marca;
    private String modelo;
    private int anio;
    private String tipoVehiculo;
    private String estado;
    private String color;
    private String precio_diario;
    private boolean activo;

    public VehiculoResponseDTO() {
    }

    public VehiculoResponseDTO(int id, String patente, String marca, String modelo, int anio, String tipoVehiculo, String estado, String color, String precio_diario, boolean activo) {
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

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        VehiculoResponseDTO that = (VehiculoResponseDTO) o;
        return id == that.id && anio == that.anio && activo == that.activo && Objects.equals(patente, that.patente) && Objects.equals(marca, that.marca) && Objects.equals(modelo, that.modelo) && Objects.equals(tipoVehiculo, that.tipoVehiculo) && Objects.equals(estado, that.estado) && Objects.equals(color, that.color) && Objects.equals(precio_diario, that.precio_diario);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, patente, marca, modelo, anio, tipoVehiculo, estado, color, precio_diario, activo);
    }
}
