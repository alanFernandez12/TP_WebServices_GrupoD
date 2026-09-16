package com.grupo_d_c2_2026_unla.rentar.repository;

import com.grupo_d_c2_2026_unla.rentar.entity.Reserva;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    // Verifica si existe una reserva para un vehículo en un rango de tiempo específico
    boolean existsByVehiculo_IdAndHoraInicioLessThanAndHoraFinGreaterThan(
            Integer vehiculoId,
            LocalDateTime horaFin,
            LocalDateTime horaInicio
    );

    @Query("""
            SELECT r
            FROM Reserva r
            JOIN FETCH r.vehiculo
            WHERE r.cliente.idCliente = :clienteId
              AND r.estadoReserva IN :estados
            ORDER BY r.horaInicio DESC
            """)
    List<Reserva> buscarHistorialPorCliente(
            @Param("clienteId") Long clienteId,
            @Param("estados") Collection<EstadoReserva> estados
    );
}