package com.grupo_d_c2_2026_unla.rentar.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioResponseDTO {

    private Long id;
    private String email;
    private String rol;
    private Boolean activo;

    public UsuarioResponseDTO() {
    }

    public UsuarioResponseDTO(Long id, String email, String rol, Boolean activo) {
        this.id = id;
        this.email = email;
        this.rol = rol;
        this.activo = activo;
    }
}
