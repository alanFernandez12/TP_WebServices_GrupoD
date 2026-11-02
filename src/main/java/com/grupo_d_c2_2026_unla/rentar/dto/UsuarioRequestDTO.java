package com.grupo_d_c2_2026_unla.rentar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioRequestDTO {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String rol;

    public UsuarioRequestDTO() {
    }

    public UsuarioRequestDTO(String email, String password, String rol) {
        this.email = email;
        this.password = password;
        this.rol = rol;
    }
}
