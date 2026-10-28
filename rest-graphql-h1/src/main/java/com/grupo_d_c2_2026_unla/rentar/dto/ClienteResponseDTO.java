package com.grupo_d_c2_2026_unla.rentar.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteResponseDTO {

    private Long id;
    private String documento;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private LocalDate fechaNacimiento;
    private boolean activo;

    public ClienteResponseDTO() {
    }

    public ClienteResponseDTO(
            Long id,
            String documento,
            String nombre,
            String apellido,
            String email,
            String telefono,
            LocalDate fechaNacimiento,
            boolean activo) {

        this.id = id;
        this.documento = documento;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.telefono = telefono;
        this.fechaNacimiento = fechaNacimiento;
        this.activo = activo;
    }

    @Override
    public String toString() {
        return "ClienteResponseDTO{" +
                "id=" + id +
                ", documento='" + documento + '\'' +
                ", nombre='" + nombre + '\'' +
                ", apellido='" + apellido + '\'' +
                ", email='" + email + '\'' +
                ", telefono='" + telefono + '\'' +
                ", fechaNacimiento=" + fechaNacimiento +
                ", activo=" + activo +
                '}';
    }
}
