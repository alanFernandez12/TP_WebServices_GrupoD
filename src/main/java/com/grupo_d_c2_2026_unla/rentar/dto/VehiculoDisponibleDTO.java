package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;
import com.grupo_d_c2_2026_unla.rentar.enums.TipoVehiculo;

import java.math.BigDecimal;

public record VehiculoDisponibleDTO (
        String patente,
        String marca,
        String modelo,
        Integer anio,
        String color,
        TipoVehiculo tipoVehiculo,
        BigDecimal precioDiario
) {
    public static VehiculoDisponibleDTO fromEntity(Vehiculo vehiculo) {
        return new VehiculoDisponibleDTO(
                vehiculo.getPatente(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getColor(),
                vehiculo.getTipoVehiculo(),
                vehiculo.getPrecio_diario()
        );
    }
    
}
