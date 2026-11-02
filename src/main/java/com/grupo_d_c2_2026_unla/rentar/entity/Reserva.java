package com.grupo_d_c2_2026_unla.rentar.entity;

import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ft_reservas")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false ,name = "id_reserva")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", referencedColumnName = "id_cliente", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vehiculo", referencedColumnName = "id_vehiculo", nullable = false)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tiempo", referencedColumnName = "id_tiempo", nullable = false)
    private Tiempo tiempo;

    // Resto de columnas
    @Column(name = "hora_inicio", nullable = false)
    private LocalDateTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalDateTime horaFin;

    @Column(name = "num_duracion_dias", nullable = false)
    private Integer duracionDias;

    @Column(name = "f_val_precio_diario_historico", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioDiarioHistorico;

    @Column(name = "f_val_importe_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal importeTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "desc_estado_reserva", nullable = false, length = 50)
    private EstadoReserva estadoReserva;


}
