package com.grupo_d_c2_2026_unla.rentar.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteRequestDTO {
    @NotBlank
    private String email;
    @NotBlank
    private String documento;
    @NotBlank
    private String nombre;
    @NotBlank
    private String apellido;
    private String telefono;
    private LocalDate fechaNacimiento;
    @NotBlank
    private String password;
    @NotBlank
    private String rol;

    public ClienteRequestDTO() {
    }

    public ClienteRequestDTO(
            String email,
            String documento,
            String nombre,
            String apellido,
            String telefono,
            LocalDate fechaNacimiento,
            String password,
            String rol) {

        this.email = email;
        this.documento = documento;
        this.nombre = nombre;
        this.apellido = apellido;
        this.telefono = telefono;
        this.fechaNacimiento = fechaNacimiento;
        this.password = password;
        this.rol = rol;
    }
}