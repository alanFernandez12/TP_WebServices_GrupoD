package com.grupo_d_c2_2026_unla.rentar.dto;

import com.grupo_d_c2_2026_unla.rentar.entity.Vehiculo;

public record VehiculoHistorialDTO(
        String marca,
        String modelo
) {
    public static VehiculoHistorialDTO fromEntity(Vehiculo vehiculo) {
        return new VehiculoHistorialDTO(
                vehiculo.getMarca(),
                vehiculo.getModelo()
        );
    }
}
