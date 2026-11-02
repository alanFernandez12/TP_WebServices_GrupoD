package com.grupo_d_c2_2026_unla.rentar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lk_usuarios")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "desc_email", nullable = false, unique = true)
    private String email;

    @Column(name = "desc_password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "desc_rol", nullable = false)
    private String rol;

    @Column(name = "flag_activo", nullable = false)
    private Boolean activo;
}