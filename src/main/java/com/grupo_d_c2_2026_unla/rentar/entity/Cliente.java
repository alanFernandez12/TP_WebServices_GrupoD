package com.grupo_d_c2_2026_unla.rentar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "lk_clientes")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;

    @OneToOne
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "cod_documento", nullable = false, unique = true)
    private String documento;

    @Column(name = "nom_nombre", nullable = false)
    private String nombre;

    @Column(name = "desc_apellido", nullable = false)
    private String apellido;

    @Column(name = "desc_telefono")
    private String telefono;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "flag_activo", nullable = false)
    private Boolean activo;

}