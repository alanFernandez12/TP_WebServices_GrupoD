package com.grupo_d_c2_2026_unla.rentar.repository;

import com.grupo_d_c2_2026_unla.rentar.entity.Reserva;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("""
            SELECT r
            FROM Reserva r
            JOIN FETCH r.vehiculo v
            WHERE r.cliente.idCliente = :clienteId
              AND r.estadoReserva IN :estados
            ORDER BY r.horaInicio DESC
            """)
    List<Reserva> buscarHistorialPorCliente(
            @Param("clienteId") Long clienteId,
            @Param("estados") List<EstadoReserva> estados
    );
    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM Reserva r
            WHERE r.vehiculo.id = :vehiculoId
              AND r.estadoReserva <> :estadoCancelada
              AND r.horaInicio < :horaFin
              AND r.horaFin > :horaInicio
            """)
    boolean existsByVehiculoIdAndHoraInicioLessThanAndHoraFinGreaterThanAndEstadoReservaNot(
            @Param("vehiculoId") Integer vehiculoId,
            @Param("horaFin") LocalDateTime horaFin,
            @Param("horaInicio") LocalDateTime horaInicio,
            @Param("estadoCancelada") EstadoReserva estadoCancelada
    );
}