package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.entity.Reserva;
import com.grupo_d_c2_2026_unla.rentar.enums.EstadoReserva;

import java.math.BigDecimal;

public record HistorialAlquilerDTO(
        VehiculoHistorialDTO vehiculo,
        String patente,
        String fechaInicio,
        String fechaFin,
        Integer cantidadDias,
        BigDecimal importeTotal,
        EstadoReserva estado
) {
    public static HistorialAlquilerDTO fromEntity(Reserva reserva) {
        return new HistorialAlquilerDTO(
                VehiculoHistorialDTO.fromEntity(reserva.getVehiculo()),
                reserva.getVehiculo().getPatente(),
                reserva.getHoraInicio().toString(),
                reserva.getHoraFin().toString(),
                reserva.getDuracionDias(),
                reserva.getImporteTotal(),
                reserva.getEstadoReserva()
        );
    }
}
