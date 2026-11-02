package com.grupo_d_c2_2026_unla.rentar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "lk_tiempo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tiempo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tiempo", nullable = false)
    private Long id;

    @Column(name = "fecha_calendario", nullable = false)
    private LocalDate fechaCalendario;

    @Column(name = "num_anio", nullable = false)
    private Integer anio;

    @Column(name = "num_mes", nullable = false)
    private Integer mes;

    @Column(name = "num_dia", nullable = false)
    private Integer dia;

    @Column(name = "desc_nombre_mes", nullable = false, length = 20)
    private String nombreMes;

    @Column(name = "desc_dia_semana", nullable = false, length = 20)
    private String diaSemana;
}