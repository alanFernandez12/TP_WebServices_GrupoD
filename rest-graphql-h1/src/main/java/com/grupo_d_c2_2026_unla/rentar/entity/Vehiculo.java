package com.grupo_d_c2_2026_unla.rentar.entity;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoVehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "lk_vehiculos")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Vehiculo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehiculo")
    private Integer id;

    @Column(name = "cod_patente", nullable = false, unique = true, updatable = false)
    private String patente;

    @Column(name = "desc_marca", nullable = false)
    private String marca;

    @Column(name = "desc_modelo", nullable = false)
    private String modelo;

    @Column(name = "num_anio", nullable = false)
    private Integer anio;

    @Column(name = "desc_color")
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "desc_tipo_vehiculo", nullable = false)
    private TipoVehiculo tipoVehiculo;

    @Enumerated(EnumType.STRING)
    @Column(name = "desc_estado_vehiculo", nullable = false)
    private EstadoVehiculo estado;

    @Column(name = "f_val_precio_diario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio_diario;

    @Column(name = "flag_activo", nullable = false)
    private boolean activo;
}